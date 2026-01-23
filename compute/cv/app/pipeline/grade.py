"""
Main grading pipeline orchestrator.
Coordinates all CV stages and produces detection results.
"""
import time
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path
from loguru import logger

from app.schemas.detection_result import (
    DetectionResult,
    QuestionDetection,
    QualityMetrics,
    DetectionWarning,
    DetectionError
)
from app.templates.loader import load_template
from app.pipeline.preprocess import preprocess_image, PreprocessingError
from app.pipeline.paper_detection import detect_paper_with_fallback, PaperDetectionError
from app.pipeline.perspective import (
    correct_perspective,
    validate_perspective_correction,
    PerspectiveCorrectionError
)
from app.pipeline.align import align_image_with_template, AlignmentError
from app.pipeline.roi_extraction import extract_all_bubbles, ROIExtractionError
from app.pipeline.fill_scoring import score_all_questions


class GradingPipelineError(Exception):
    """Raised when grading pipeline fails."""
    pass


def run_detection_pipeline(
    scan_id: str,
    image_path: str,
    template_id: str,
    strict_quality: bool = False
) -> DetectionResult:
    """
    Run complete detection pipeline.
    
    Pipeline stages:
    1. Preprocessing & quality checks
    2. Paper boundary detection
    3. Perspective correction
    4. Template alignment (registration marks)
    5. ROI extraction
    6. Fill scoring
    7. Answer determination
    
    Args:
        scan_id: Unique scan identifier
        template_id: Template to use for detection
        image_path: Path to image file
        strict_quality: If True, fail on quality issues
        
    Returns:
        DetectionResult with all findings
    """
    start_time = time.time()
    
    warnings = []
    errors = []
    detections = []
    quality_metrics = {}
    
    logger.info(f"Starting detection pipeline for scan {scan_id}")
    
    try:
        # ============================================================
        # Stage 1: Load Template
        # ============================================================
        logger.info(f"Loading template: {template_id}")
        try:
            template = load_template(template_id)
        except Exception as e:
            errors.append({
                "code": "TEMPLATE_LOAD_FAILED",
                "message": f"Failed to load template '{template_id}': {e}",
                "stage": "template_loading"
            })
            raise GradingPipelineError(f"Template loading failed: {e}")
        
        # ============================================================
        # Stage 2: Preprocessing & Quality Checks
        # ============================================================
        logger.info("Stage 1: Preprocessing")
        try:
            preprocessed, metrics = preprocess_image(
                image_path,
                apply_clahe=True,
                check_quality=True,
                min_blur_score=80.0 if strict_quality else 50.0,
                binarization="auto"  # Auto-select Otsu or Adaptive based on lighting
            )
            
            quality_metrics = {
                "blur_score": metrics.get("blur_score"),
                "brightness_mean": metrics.get("brightness_mean"),
                "brightness_std": metrics.get("brightness_std"),
                "skew_angle": metrics.get("skew_angle")
            }
            
            # Warnings for quality issues
            if metrics.get("blur_score", 0) < 100:
                warnings.append({
                    "code": "LOW_BLUR_SCORE",
                    "message": f"Image may be blurry (score={metrics['blur_score']:.1f})"
                })
            
            if abs(metrics.get("skew_angle", 0)) > 5:
                warnings.append({
                    "code": "SIGNIFICANT_SKEW",
                    "message": f"Image appears skewed ({metrics['skew_angle']:.2f}°)"
                })
                
        except PreprocessingError as e:
            errors.append({
                "code": "PREPROCESSING_FAILED",
                "message": str(e),
                "stage": "preprocessing"
            })
            
            if strict_quality:
                raise GradingPipelineError(f"Preprocessing failed: {e}")
            else:
                # Try without quality checks
                logger.warning("Retrying preprocessing without quality checks")
                preprocessed, metrics = preprocess_image(
                    image_path,
                    apply_clahe=True,
                    check_quality=False
                )
        
        # ============================================================
        # Stage 3: Paper Detection
        # ============================================================
        logger.info("Stage 2: Paper detection")
        try:
            paper_corners = detect_paper_with_fallback(
                preprocessed,
                strict=strict_quality
            )
            
            if paper_corners is None:
                raise PaperDetectionError("Paper boundary could not be detected")
                
        except PaperDetectionError as e:
            errors.append({
                "code": "PAPER_NOT_DETECTED",
                "message": str(e),
                "stage": "paper_detection"
            })
            raise GradingPipelineError(f"Paper detection failed: {e}")
        
        # ============================================================
        # Stage 4: Perspective Correction
        # ============================================================
        logger.info("Stage 3: Perspective correction")
        try:
            warped = correct_perspective(
                preprocessed,
                paper_corners,
                target_size=(
                    template.canonical_size.width,
                    template.canonical_size.height
                )
            )
            
            # Validate correction
            is_valid, reason = validate_perspective_correction(
                warped,
                (template.canonical_size.width, template.canonical_size.height)
            )
            
            if not is_valid:
                warnings.append({
                    "code": "PERSPECTIVE_QUALITY",
                    "message": f"Perspective correction quality issue: {reason}"
                })
            
            quality_metrics["perspective_correction_applied"] = True
            
        except PerspectiveCorrectionError as e:
            errors.append({
                "code": "PERSPECTIVE_CORRECTION_FAILED",
                "message": str(e),
                "stage": "perspective_correction"
            })
            raise GradingPipelineError(f"Perspective correction failed: {e}")
        
        # ============================================================
        # Stage 5: Template Alignment (Registration Marks)
        # ============================================================
        logger.info("Stage 4: Template alignment")
        try:
            aligned, alignment_success = align_image_with_template(
                warped,
                template,
                strict=False
            )
            
            if not alignment_success:
                warnings.append({
                    "code": "ALIGNMENT_SKIPPED",
                    "message": "Template alignment could not be performed"
                })
                aligned = warped
                
        except AlignmentError as e:
            warnings.append({
                "code": "ALIGNMENT_FAILED",
                "message": str(e)
            })
            aligned = warped
        
        # ============================================================
        # Stage 6: ROI Extraction
        # ============================================================
        logger.info("Stage 5: Bubble ROI extraction")
        try:
            all_bubbles = extract_all_bubbles(aligned, template)
        except ROIExtractionError as e:
            errors.append({
                "code": "ROI_EXTRACTION_FAILED",
                "message": str(e),
                "stage": "roi_extraction"
            })
            raise GradingPipelineError(f"ROI extraction failed: {e}")
        
        # ============================================================
        # Stage 7: Fill Scoring & Answer Determination
        # ============================================================
        logger.info("Stage 6: Fill scoring")
        scored_questions = score_all_questions(
            all_bubbles,
            template.bubble_config
        )
        
        # Convert to DetectionResult format
        for q_id, result in scored_questions.items():
            detection = QuestionDetection(
                question_id=result["question_id"],
                fill_ratios=result["fill_ratios"],
                selected=result["selected"],
                detection_status=result["detection_status"],
                confidence=result.get("confidence")
            )
            detections.append(detection)
        
        # Check for multiple ambiguous answers
        ambiguous_count = sum(
            1 for d in detections
            if d.detection_status == "ambiguous"
        )
        
        if ambiguous_count > 3:
            warnings.append({
                "code": "MULTIPLE_AMBIGUOUS",
                "message": f"{ambiguous_count} questions have ambiguous marks"
            })
        
        # ============================================================
        # Finalize Result
        # ============================================================
        processing_time = (time.time() - start_time) * 1000  # milliseconds
        
        # Determine overall status
        if errors:
            status = "failed"
        elif ambiguous_count > 0:
            status = "needs_review"
        else:
            status = "success"
        
        result = DetectionResult(
            scan_id=scan_id,
            template_id=template_id,
            status=status,
            detections=detections,
            quality_metrics=QualityMetrics(**quality_metrics) if quality_metrics else None,
            warnings=[DetectionWarning(**w) for w in warnings],
            errors=[DetectionError(**e) for e in errors],
            processing_time_ms=processing_time,
            timestamp=datetime.utcnow()
        )
        
        logger.success(
            f"Detection complete: {len(detections)} questions, "
            f"status={status}, time={processing_time:.0f}ms"
        )
        
        return result
        
    except GradingPipelineError as e:
        # Pipeline failed at a critical stage
        logger.error(f"Pipeline failed: {e}")
        
        processing_time = (time.time() - start_time) * 1000
        
        return DetectionResult(
            scan_id=scan_id,
            template_id=template_id,
            status="failed",
            detections=detections,  # Partial results if any
            quality_metrics=QualityMetrics(**quality_metrics) if quality_metrics else None,
            warnings=[DetectionWarning(**w) for w in warnings],
            errors=[DetectionError(**e) for e in errors],
            processing_time_ms=processing_time,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        # Unexpected error
        logger.exception("Unexpected error in detection pipeline")
        
        processing_time = (time.time() - start_time) * 1000
        
        errors.append({
            "code": "UNEXPECTED_ERROR",
            "message": f"Unexpected error: {type(e).__name__}: {e}",
            "stage": "unknown"
        })
        
        return DetectionResult(
            scan_id=scan_id,
            template_id=template_id,
            status="failed",
            detections=[],
            quality_metrics=None,
            warnings=[DetectionWarning(**w) for w in warnings],
            errors=[DetectionError(**e) for e in errors],
            processing_time_ms=processing_time,
            timestamp=datetime.utcnow()
        )

