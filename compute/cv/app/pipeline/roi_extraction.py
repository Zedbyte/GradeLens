"""
ROI (Region of Interest) extraction module.
Extracts bubble regions from aligned image based on template coordinates.
"""
import cv2
import numpy as np
from typing import List, Dict, Tuple
from loguru import logger

from app.schemas.template import Template, Question
from app.utils.image_utils import safe_crop, create_circular_mask


class ROIExtractionError(Exception):
    """Raised when ROI extraction fails."""
    pass


def extract_bubble_roi(
    image: np.ndarray,
    center_x: int,
    center_y: int,
    radius: int,
    padding: int = 10
) -> np.ndarray:
    """
    Extract circular bubble ROI from image.
    
    Args:
        image: Grayscale image
        center_x: Bubble center X coordinate
        center_y: Bubble center Y coordinate
        radius: Bubble radius
        padding: Extra padding around bubble
        
    Returns:
        Square ROI containing the bubble
        
    Raises:
        ROIExtractionError: If ROI cannot be extracted
    """
    # Calculate bounding box with padding
    size = (radius + padding) * 2
    x = center_x - radius - padding
    y = center_y - radius - padding
    
    # Extract ROI
    roi = safe_crop(image, x, y, size, size)
    
    if roi is None or roi.size == 0:
        raise ROIExtractionError(
            f"Failed to extract ROI at ({center_x}, {center_y})"
        )
    
    return roi


def extract_question_bubbles(
    image: np.ndarray,
    question: Question,
    bubble_radius: int,
    padding: int = 5
) -> Dict[str, np.ndarray]:
    """
    Extract all bubble ROIs for a single question.
    
    Args:
        image: Grayscale aligned image
        question: Question definition from template
        bubble_radius: Bubble radius from template
        padding: Extra padding
        
    Returns:
        Dictionary mapping option letter to ROI image
    """
    bubbles = {}
    
    for option, position in question.options.items():
        try:
            roi = extract_bubble_roi(
                image,
                position.x,
                position.y,
                bubble_radius,
                padding
            )
            bubbles[option] = roi
        except ROIExtractionError as e:
            logger.warning(f"Q{question.question_id} option {option}: {e}")
            # Create empty ROI as fallback
            size = (bubble_radius + padding) * 2
            bubbles[option] = np.full((size, size), 255, dtype=np.uint8)
    
    return bubbles


def extract_all_bubbles(
    image: np.ndarray,
    template: Template
) -> Dict[int, Dict[str, np.ndarray]]:
    """
    Extract all bubble ROIs from image based on template.
    
    Args:
        image: Grayscale aligned image
        template: Template defining bubble positions
        
    Returns:
        Nested dictionary: {question_id: {option: roi_image}}
    """
    all_bubbles = {}
    bubble_radius = template.bubble_config.radius
    
    logger.debug(f"Extracting bubbles for {len(template.questions)} questions")
    
    for question in template.questions:
        bubbles = extract_question_bubbles(
            image,
            question,
            bubble_radius,
            padding=10
        )
        all_bubbles[question.question_id] = bubbles
    
    logger.success(f"Extracted bubbles for {len(all_bubbles)} questions")
    
    return all_bubbles


def validate_roi_quality(roi: np.ndarray, min_size: int = 10) -> Tuple[bool, str]:
    """
    Validate extracted ROI quality.
    
    Args:
        roi: Extracted ROI image
        min_size: Minimum acceptable size
        
    Returns:
        (is_valid, reason)
    """
    if roi is None or roi.size == 0:
        return False, "ROI is empty"
    
    h, w = roi.shape[:2]
    
    if h < min_size or w < min_size:
        return False, f"ROI too small: {w}x{h}"
    
    # Check if ROI is mostly black (likely extraction error)
    mean_val = np.mean(roi)
    if mean_val < 30:
        return False, f"ROI too dark (mean={mean_val:.1f})"
    
    # Check if ROI has any content (not all white)
    if mean_val > 250:
        return False, f"ROI too bright/empty (mean={mean_val:.1f})"
    
    return True, "Valid"


def create_bubble_mask(
    roi_size: int,
    radius: int
) -> np.ndarray:
    """
    Create circular mask for bubble ROI.
    
    Args:
        roi_size: Size of ROI (square)
        radius: Bubble radius
        
    Returns:
        Binary mask (255 inside circle, 0 outside)
    """
    center = roi_size // 2
    mask = create_circular_mask(
        (roi_size, roi_size),
        (center, center),
        radius
    )
    return mask


def visualize_roi_extraction(
    image: np.ndarray,
    template: Template,
    highlight_color: Tuple[int, int, int] = (0, 255, 0)
) -> np.ndarray:
    """
    Create visualization of ROI extraction for debugging.
    
    Args:
        image: Base image
        template: Template with bubble positions
        highlight_color: Color for highlighting bubbles (BGR)
        
    Returns:
        Annotated image
    """
    # Convert to BGR if grayscale
    if len(image.shape) == 2:
        output = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        output = image.copy()
    
    bubble_radius = template.bubble_config.radius
    
    for question in template.questions:
        for option, position in question.options.items():
            # Draw circle
            cv2.circle(
                output,
                (position.x, position.y),
                bubble_radius,
                highlight_color,
                2
            )
            
            # Draw option letter
            cv2.putText(
                output,
                f"Q{question.question_id}{option}",
                (position.x - 15, position.y - bubble_radius - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                highlight_color,
                1
            )
    
    return output
