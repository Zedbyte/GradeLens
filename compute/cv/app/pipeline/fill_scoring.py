"""
Fill scoring module.
Measures how filled each bubble is by analyzing pixel darkness.
"""
import cv2
import numpy as np
from typing import Dict, Tuple, List
from loguru import logger

from app.schemas.template import BubbleConfig
from app.utils.image_utils import create_circular_mask


def calculate_fill_ratio(
    roi: np.ndarray,
    radius: int,
    dark_threshold: int = 127,
    use_adaptive: bool = True
) -> float:
    """
    Calculate fill ratio of a bubble ROI.
    
    Fill ratio = (dark pixels inside circle) / (total pixels inside circle)
    
    Args:
        roi: Grayscale ROI image (square)
        radius: Bubble radius
        dark_threshold: Pixel value below which is considered "dark/filled"
        use_adaptive: Whether to use adaptive thresholding
        
    Returns:
        Fill ratio (0.0 = empty, 1.0 = fully filled)
    """
    if roi is None or roi.size == 0:
        return 0.0
    
    # Ensure grayscale
    if len(roi.shape) == 3:
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    else:
        gray = roi
    
    # Create circular mask
    center = roi.shape[0] // 2
    mask = create_circular_mask(
        gray.shape,
        (center, center),
        radius
    )
    
    # Apply mask
    masked = cv2.bitwise_and(gray, gray, mask=mask)
    
    # Count pixels inside circle
    circle_pixels = np.sum(mask > 0)
    
    if circle_pixels == 0:
        return 0.0
    
    # Threshold to binary
    if use_adaptive:
        # Try Otsu's method first for bright images
        mean_brightness = np.mean(masked[mask > 0])
        
        if mean_brightness > 200:  # Very bright image
            # Use Otsu's method which automatically finds optimal threshold
            _, binary = cv2.threshold(
                masked,
                0,
                255,
                cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
            )
            binary = cv2.bitwise_and(binary, binary, mask=mask)
            dark_pixels = np.sum(binary > 0)
        else:
            # Adaptive threshold for normal lighting
            binary = cv2.adaptiveThreshold(
                gray,  # Use full gray image, not masked
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                11,
                2
            )
            binary = cv2.bitwise_and(binary, binary, mask=mask)
            dark_pixels = np.sum(binary > 0)
    else:
        # Simple threshold
        dark_pixels = np.sum((masked < dark_threshold) & (mask > 0))
    
    fill_ratio = dark_pixels / circle_pixels
    
    return float(np.clip(fill_ratio, 0.0, 1.0))


def score_question_bubbles(
    bubbles_rois: Dict[str, np.ndarray],
    bubble_config: BubbleConfig
) -> Dict[str, float]:
    """
    Score all bubbles for a single question.
    
    Args:
        bubbles_rois: Dictionary mapping option letter to ROI image
        bubble_config: Bubble configuration from template
        
    Returns:
        Dictionary mapping option letter to fill ratio
    """
    fill_ratios = {}
    
    for option, roi in bubbles_rois.items():
        try:
            fill_ratio = calculate_fill_ratio(
                roi,
                bubble_config.radius,
                dark_threshold=127
            )
            fill_ratios[option] = fill_ratio
        except Exception as e:
            logger.warning(f"Failed to score option {option}: {e}")
            fill_ratios[option] = 0.0
    
    return fill_ratios


def determine_selected_answers(
    fill_ratios: Dict[str, float],
    bubble_config: BubbleConfig
) -> Tuple[List[str], str, float]:
    """
    Determine which answer(s) are selected based on fill ratios.
    
    Logic:
    - No bubble > fill_threshold → unanswered
    - Multiple bubbles > ambiguous_threshold → ambiguous
    - One clear winner → answered
    
    Args:
        fill_ratios: Dictionary of option -> fill_ratio
        bubble_config: Bubble configuration with thresholds
        
    Returns:
        (selected_options, status, confidence)
        status: "answered", "unanswered", or "ambiguous"
        confidence: 0.0 - 1.0 (difference between top 2 answers)
    """
    if not fill_ratios:
        return [], "unanswered", 0.0
    
    fill_threshold = bubble_config.fill_threshold
    ambiguous_threshold = bubble_config.ambiguous_threshold
    
    # Sort by fill ratio
    sorted_options = sorted(
        fill_ratios.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    # Get top option
    top_option, top_ratio = sorted_options[0]
    
    # Check if any bubble is filled
    if top_ratio < fill_threshold:
        return [], "unanswered", 0.0
    
    # Check for multiple high-fill bubbles (ambiguous)
    high_fill_options = [
        opt for opt, ratio in fill_ratios.items()
        if ratio >= ambiguous_threshold
    ]
    
    if len(high_fill_options) > 1:
        return high_fill_options, "ambiguous", 0.0
    
    # Single answer selected
    # Calculate confidence (difference between top 2)
    if len(sorted_options) >= 2:
        second_ratio = sorted_options[1][1]
        confidence = float(top_ratio - second_ratio)
    else:
        confidence = float(top_ratio)
    
    return [top_option], "answered", confidence


def score_all_questions(
    all_bubbles: Dict[int, Dict[str, np.ndarray]],
    bubble_config: BubbleConfig
) -> Dict[int, Dict]:
    """
    Score bubbles for all questions.
    
    Args:
        all_bubbles: Nested dict {question_id: {option: roi_image}}
        bubble_config: Bubble configuration
        
    Returns:
        Dict mapping question_id to detection result:
        {
            "fill_ratios": {option: ratio},
            "selected": [option],
            "status": "answered"|"unanswered"|"ambiguous",
            "confidence": float
        }
    """
    results = {}
    
    logger.debug(f"Scoring {len(all_bubbles)} questions")
    
    for question_id, bubbles_rois in all_bubbles.items():
        # Score each bubble
        fill_ratios = score_question_bubbles(bubbles_rois, bubble_config)
        
        # Determine selected answer(s)
        selected, status, confidence = determine_selected_answers(
            fill_ratios,
            bubble_config
        )
        
        results[question_id] = {
            "question_id": question_id,
            "fill_ratios": fill_ratios,
            "selected": selected,
            "detection_status": status,
            "confidence": confidence
        }
        
        logger.debug(
            f"Q{question_id}: status={status}, selected={selected}, "
            f"ratios={{{', '.join(f'{k}:{v:.2f}' for k, v in fill_ratios.items())}}}"
        )
    
    logger.success(f"Scored {len(results)} questions")
    
    return results


def validate_fill_ratios(
    fill_ratios: Dict[str, float],
    min_ratio: float = 0.0,
    max_ratio: float = 1.0
) -> Tuple[bool, str]:
    """
    Validate fill ratios are within expected range.
    
    Args:
        fill_ratios: Dictionary of option -> fill_ratio
        min_ratio: Minimum valid ratio
        max_ratio: Maximum valid ratio
        
    Returns:
        (is_valid, reason)
    """
    for option, ratio in fill_ratios.items():
        if not (min_ratio <= ratio <= max_ratio):
            return False, f"Option {option} ratio {ratio:.2f} out of range [{min_ratio}, {max_ratio}]"
    
    return True, "Valid"


def calculate_contrast_score(roi: np.ndarray) -> float:
    """
    Calculate contrast score of ROI.
    Low contrast = hard to detect fill.
    
    Args:
        roi: Grayscale ROI image
        
    Returns:
        Contrast score (standard deviation of pixel values)
    """
    if roi is None or roi.size == 0:
        return 0.0
    
    return float(np.std(roi))
