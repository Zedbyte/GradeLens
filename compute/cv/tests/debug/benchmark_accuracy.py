"""
Accuracy Benchmark Tool

Measures detection accuracy by comparing pipeline results against known answer keys.
Provides detailed metrics for evaluating pipeline performance.

Usage:
    python -m tests.debug.benchmark_accuracy --test-dir <dir> --template <template_id>

Example:
    python -m tests.debug.benchmark_accuracy \
        --test-dir tests/fixtures/images \
        --template form_A \
        --report tests/output/accuracy_report.json
"""
import argparse
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, asdict
import cv2
import numpy as np
from loguru import logger

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.pipeline.grade import run_detection_pipeline
from app.schemas.detection_result import DetectionResult


def _to_jsonable(obj: Any) -> Any:
    """Safely convert pipeline objects to JSON-serializable structures."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_jsonable(v) for v in obj]
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        try:
            return obj.dict()
        except Exception:
            pass
    if hasattr(obj, "__dict__"):
        return {k: _to_jsonable(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    return str(obj)


@dataclass
class QuestionAccuracy:
    """Accuracy metrics for a single question."""
    question_id: int
    expected: str
    detected: str
    correct: bool
    confidence: float
    fill_ratios: Dict[str, float]
    detection_status: str


@dataclass
class ImageAccuracy:
    """Accuracy metrics for a single image."""
    image_name: str
    template_id: str
    total_questions: int
    correct_detections: int
    incorrect_detections: int
    ambiguous_detections: int
    unanswered_detections: int
    accuracy_rate: float
    average_confidence: float
    pipeline_status: str
    quality_metrics: Dict[str, Any]
    warnings: List[str]
    errors: List[str]
    question_details: List[QuestionAccuracy]


@dataclass
class BenchmarkReport:
    """Complete benchmark report."""
    total_images: int
    total_questions: int
    overall_accuracy: float
    average_confidence: float
    perfect_scans: int
    failed_scans: int
    needs_review: int
    image_results: List[ImageAccuracy]
    
    # Aggregated metrics
    condition_breakdown: Dict[str, Dict[str, Any]]
    confusion_matrix: Dict[str, Dict[str, int]]


class AccuracyBenchmark:
    """Benchmarks pipeline accuracy against known answers."""
    
    def __init__(self, template_id: str, answer_key_path: str = None):
        self.template_id = template_id
        self.answer_key = self._load_answer_key(answer_key_path)
        self.results: List[ImageAccuracy] = []
    
    def _load_answer_key(self, path: str = None) -> Dict[int, str]:
        """
        Load answer key from JSON file.
        If not provided, uses default test answers.
        """
        if path and Path(path).exists():
            with open(path) as f:
                data = json.load(f)
                # Convert string keys to int
                return {int(k): v for k, v in data.items()}
        
        # Default test answers (first 20 questions)
        logger.warning("No answer key provided, using default test answers")
        return {
            1: "A", 2: "B", 3: "C", 4: "D", 5: "A",
            6: "B", 7: "C", 8: "D", 9: "A", 10: "B",
            11: "C", 12: "D", 13: "A", 14: "B", 15: "C",
            16: "D", 17: "A", 18: "B", 19: "C", 20: "D"
        }
    
    def benchmark_image(self, image_path: Path) -> ImageAccuracy:
        """Benchmark a single image."""
        logger.info(f"Benchmarking: {image_path.name}")
        
        # Run pipeline
        try:
            result = run_detection_pipeline(
                scan_id=image_path.stem,
                image_path=str(image_path),
                template_id=self.template_id,
                strict_quality=False
            )
        except Exception as e:
            logger.error(f"  Pipeline failed: {e}")
            return self._create_failed_result(image_path.name, str(e))
        
        # Compare with answer key
        question_details = []
        correct = 0
        incorrect = 0
        ambiguous = 0
        unanswered = 0
        total_confidence = 0.0
        
        for detection in result.detections:
            qid = detection.question_id
            expected = self.answer_key.get(qid)
            
            if not expected:
                continue  # Skip questions not in answer key
            
            detected = detection.selected[0] if detection.selected else None
            is_correct = (detected == expected)
            
            if detection.detection_status == "answered":
                if is_correct:
                    correct += 1
                else:
                    incorrect += 1
            elif detection.detection_status == "ambiguous":
                ambiguous += 1
            else:  # unanswered
                unanswered += 1
            
            total_confidence += detection.confidence
            
            question_details.append(QuestionAccuracy(
                question_id=qid,
                expected=expected,
                detected=detected or "NONE",
                correct=is_correct,
                confidence=detection.confidence,
                fill_ratios=detection.fill_ratios,
                detection_status=detection.detection_status
            ))
        
        total = len(question_details)
        accuracy = (correct / total * 100) if total > 0 else 0.0
        avg_confidence = (total_confidence / total) if total > 0 else 0.0
        
        image_accuracy = ImageAccuracy(
            image_name=image_path.name,
            template_id=self.template_id,
            total_questions=total,
            correct_detections=correct,
            incorrect_detections=incorrect,
            ambiguous_detections=ambiguous,
            unanswered_detections=unanswered,
            accuracy_rate=accuracy,
            average_confidence=avg_confidence,
            pipeline_status=result.status,
            quality_metrics=_to_jsonable(result.quality_metrics),
            warnings=[str(w) for w in result.warnings],
            errors=[str(e) for e in result.errors],
            question_details=question_details
        )
        
        logger.info(f"  Accuracy: {accuracy:.1f}% ({correct}/{total})")
        logger.info(f"  Status: {result.status}")
        
        return image_accuracy
    
    def _create_failed_result(self, image_name: str, error: str) -> ImageAccuracy:
        """Create result for failed pipeline."""
        return ImageAccuracy(
            image_name=image_name,
            template_id=self.template_id,
            total_questions=0,
            correct_detections=0,
            incorrect_detections=0,
            ambiguous_detections=0,
            unanswered_detections=0,
            accuracy_rate=0.0,
            average_confidence=0.0,
            pipeline_status="failed",
            quality_metrics={},
            warnings=[],
            errors=[str(error)],
            question_details=[]
        )
    
    def benchmark_directory(self, test_dir: Path) -> BenchmarkReport:
        """Benchmark all images in directory."""
        logger.info(f"Benchmarking directory: {test_dir}")
        
        # Find all image files
        image_files = list(test_dir.glob("*.jpg")) + \
                     list(test_dir.glob("*.png")) + \
                     list(test_dir.glob("*.jpeg"))
        
        if not image_files:
            logger.error(f"No images found in {test_dir}")
            return self._create_empty_report()
        
        logger.info(f"Found {len(image_files)} images")
        
        # Benchmark each image
        for image_path in sorted(image_files):
            result = self.benchmark_image(image_path)
            self.results.append(result)
        
        # Generate report
        report = self._generate_report()
        return report
    
    def _generate_report(self) -> BenchmarkReport:
        """Generate comprehensive benchmark report."""
        if not self.results:
            return self._create_empty_report()
        
        total_images = len(self.results)
        total_questions = sum(r.total_questions for r in self.results)
        total_correct = sum(r.correct_detections for r in self.results)
        
        overall_accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0.0
        
        total_confidence = sum(
            r.average_confidence * r.total_questions 
            for r in self.results if r.total_questions > 0
        )
        average_confidence = (total_confidence / total_questions) if total_questions > 0 else 0.0
        
        # Count by status
        perfect_scans = sum(1 for r in self.results if r.accuracy_rate == 100.0)
        failed_scans = sum(1 for r in self.results if r.pipeline_status == "failed")
        needs_review = sum(1 for r in self.results if r.pipeline_status == "needs_review")
        
        # Condition breakdown (from image names)
        condition_breakdown = self._analyze_by_condition()
        
        # Confusion matrix (expected vs detected)
        confusion_matrix = self._build_confusion_matrix()
        
        return BenchmarkReport(
            total_images=total_images,
            total_questions=total_questions,
            overall_accuracy=overall_accuracy,
            average_confidence=average_confidence,
            perfect_scans=perfect_scans,
            failed_scans=failed_scans,
            needs_review=needs_review,
            image_results=self.results,
            condition_breakdown=condition_breakdown,
            confusion_matrix=confusion_matrix
        )
    
    def _analyze_by_condition(self) -> Dict[str, Dict[str, Any]]:
        """Analyze accuracy by image condition."""
        conditions = {}
        
        for result in self.results:
            # Extract condition from filename (e.g., "test_blurry_form_A.png" -> "blurry")
            parts = result.image_name.replace(".png", "").replace(".jpg", "").split("_")
            condition = parts[1] if len(parts) > 1 else "unknown"
            
            if condition not in conditions:
                conditions[condition] = {
                    "count": 0,
                    "total_questions": 0,
                    "correct": 0,
                    "accuracy": 0.0,
                    "avg_confidence": 0.0
                }
            
            cond = conditions[condition]
            cond["count"] += 1
            cond["total_questions"] += result.total_questions
            cond["correct"] += result.correct_detections
        
        # Calculate averages
        for condition, data in conditions.items():
            if data["total_questions"] > 0:
                data["accuracy"] = data["correct"] / data["total_questions"] * 100
        
        return conditions
    
    def _build_confusion_matrix(self) -> Dict[str, Dict[str, int]]:
        """Build confusion matrix showing expected vs detected answers."""
        matrix = {}
        
        for result in self.results:
            for question in result.question_details:
                expected = question.expected
                detected = question.detected
                
                if expected not in matrix:
                    matrix[expected] = {}
                
                if detected not in matrix[expected]:
                    matrix[expected][detected] = 0
                
                matrix[expected][detected] += 1
        
        return matrix
    
    def _create_empty_report(self) -> BenchmarkReport:
        """Create empty report."""
        return BenchmarkReport(
            total_images=0,
            total_questions=0,
            overall_accuracy=0.0,
            average_confidence=0.0,
            perfect_scans=0,
            failed_scans=0,
            needs_review=0,
            image_results=[],
            condition_breakdown={},
            confusion_matrix={}
        )
    
    def save_report(self, report: BenchmarkReport, output_path: Path):
        """Save report to JSON file."""
        # Convert to dict
        report_dict = asdict(report)
        
        # Save JSON
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(report_dict, f, indent=2)
        
        logger.info(f"Report saved to: {output_path}")
    
    def print_summary(self, report: BenchmarkReport):
        """Print human-readable summary."""
        print("\n" + "="*70)
        print("BENCHMARK SUMMARY")
        print("="*70)
        print(f"Total Images:      {report.total_images}")
        print(f"Total Questions:   {report.total_questions}")
        print(f"Overall Accuracy:  {report.overall_accuracy:.2f}%")
        print(f"Avg Confidence:    {report.average_confidence:.3f}")
        print(f"Perfect Scans:     {report.perfect_scans}")
        print(f"Failed Scans:      {report.failed_scans}")
        print(f"Needs Review:      {report.needs_review}")
        print()
        
        print("Accuracy by Condition:")
        print("-" * 70)
        for condition, data in sorted(report.condition_breakdown.items()):
            print(f"  {condition:20s}: {data['accuracy']:6.2f}% "
                  f"({data['correct']}/{data['total_questions']}) "
                  f"[{data['count']} images]")
        print()
        
        print("Confusion Matrix (Expected → Detected):")
        print("-" * 70)
        for expected, detections in sorted(report.confusion_matrix.items()):
            correct = detections.get(expected, 0)
            total = sum(detections.values())
            print(f"  {expected}: {correct}/{total} correct", end="")
            
            # Show misclassifications
            errors = {k: v for k, v in detections.items() if k != expected}
            if errors:
                error_str = ", ".join(f"{k}:{v}" for k, v in sorted(errors.items()))
                print(f" (errors: {error_str})", end="")
            print()
        
        print("="*70 + "\n")


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Benchmark pipeline accuracy")
    parser.add_argument("--test-dir", required=True, help="Directory with test images")
    parser.add_argument("--template", required=True, help="Template ID (e.g., form_A)")
    parser.add_argument("--answer-key", help="Path to answer key JSON file")
    parser.add_argument("--report", help="Output path for JSON report")
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(sys.stderr, level="INFO")
    
    # Run benchmark
    benchmark = AccuracyBenchmark(args.template, args.answer_key)
    report = benchmark.benchmark_directory(Path(args.test_dir))
    
    # Print summary
    benchmark.print_summary(report)
    
    # Save report if requested
    if args.report:
        benchmark.save_report(report, Path(args.report))


if __name__ == "__main__":
    main()
