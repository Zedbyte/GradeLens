"""
Template alignment module.
Fine-tunes perspective using registration marks after initial correction.
"""
import cv2
import numpy as np
from typing import List, Tuple, Optional
from loguru import logger

from app.schemas.template import Template, RegistrationMark
from app.utils.contour_utils import find_circles, get_contour_center
from app.utils.image_utils import safe_crop


class AlignmentError(Exception):
    """Raised when alignment fails."""
    pass


def detect_registration_marks(
    image: np.ndarray,
    expected_marks: List[RegistrationMark],
    search_radius: Optional[int] = None,
    tolerance: float = 0.3,
    adaptive_search: bool = True
) -> List[Tuple[int, int]]:
    """
    Detect registration marks in image.
    
    Args:
        image: Grayscale image (after perspective correction)
        expected_marks: List of expected registration marks from template
        search_radius: Radius around expected position to search.
                        If None, auto-calculated as ~2.4% of image diagonal.
        tolerance: How far detected mark can be from expected (as ratio of search_radius)
        adaptive_search: Use larger search radius for marks further from image center
        
    Returns:
        List of detected (x, y) positions
        
    Raises:
        AlignmentError: If critical marks cannot be detected
    """
    detected_positions = []
    img_height, img_width = image.shape[:2]
    img_center_y = img_height / 2
    
    # Auto-calculate search radius proportional to image size for resolution-independence
    # For canonical 2100x2970, diagonal ≈ 3637 → 2.4% ≈ 87px (generous enough)
    # For small images like 600x800, diagonal ≈ 1000 → 2.4% ≈ 24px
    if search_radius is None:
        img_diagonal = np.sqrt(img_width**2 + img_height**2)
        search_radius = max(20, int(img_diagonal * 0.024))
        logger.debug(f"Auto search_radius={search_radius}px for {img_width}x{img_height} image")
    
    for mark in expected_marks:
        expected_x = mark.position.x
        expected_y = mark.position.y
        mark_size = mark.size
        
        # Adaptive search radius: larger for marks far from center (especially bottom marks)
        # This compensates for cumulative perspective/alignment errors
        if adaptive_search:
            distance_from_center_y = abs(expected_y - img_center_y)
            # Increase search radius by up to 100% for marks at image edges
            radius_multiplier = 1.0 + (distance_from_center_y / img_center_y) * 1.0
            adjusted_search_radius = int(search_radius * radius_multiplier)
            
            # Also increase tolerance for edge marks
            adjusted_tolerance = tolerance * radius_multiplier
            
            logger.debug(
                f"Mark '{mark.id}' at y={expected_y}: "
                f"radius={adjusted_search_radius}px (x{radius_multiplier:.2f}), "
                f"tolerance={adjusted_tolerance:.2f}"
            )
        else:
            adjusted_search_radius = search_radius
            adjusted_tolerance = tolerance
        
        # Extract search region
        x1 = max(0, expected_x - adjusted_search_radius)
        y1 = max(0, expected_y - adjusted_search_radius)
        x2 = min(image.shape[1], expected_x + adjusted_search_radius)
        y2 = min(image.shape[0], expected_y + adjusted_search_radius)
        
        roi = image[y1:y2, x1:x2]
        
        if roi.size == 0:
            logger.warning(f"Registration mark '{mark.id}' search region out of bounds")
            detected_positions.append((expected_x, expected_y))
            continue
        
        # Detect circles in ROI
        if mark.type == "circle":
            circles = find_circles(
                roi,
                min_radius=max(5, mark_size - 5),
                max_radius=mark_size + 5,
                param2=20  # Less strict threshold
            )
            
            if circles:
                # Find closest to expected position
                roi_center_x = adjusted_search_radius if expected_x >= adjusted_search_radius else expected_x
                roi_center_y = adjusted_search_radius if expected_y >= adjusted_search_radius else expected_y
                
                best_circle = min(
                    circles,
                    key=lambda c: np.sqrt((c[0] - roi_center_x)**2 + (c[1] - roi_center_y)**2)
                )
                
                # Convert back to image coordinates
                detected_x = x1 + best_circle[0]
                detected_y = y1 + best_circle[1]
                
                # Validate distance from expected
                distance = np.sqrt((detected_x - expected_x)**2 + (detected_y - expected_y)**2)
                max_distance = adjusted_search_radius * adjusted_tolerance
                
                if distance <= max_distance:
                    detected_positions.append((detected_x, detected_y))
                    logger.debug(f"Mark '{mark.id}' detected at ({detected_x}, {detected_y}), distance={distance:.1f}px")
                else:
                    logger.warning(
                        f"Mark '{mark.id}' too far from expected position "
                        f"(distance={distance:.1f}px > max={max_distance:.1f}px)"
                    )
                    detected_positions.append((expected_x, expected_y))
            else:
                logger.warning(f"Registration mark '{mark.id}' not detected, using expected position")
                detected_positions.append((expected_x, expected_y))
        
        elif mark.type == "square":
            # For squares, use contour detection
            _, binary = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Find square-like contour closest to center
                roi_center_x = adjusted_search_radius if expected_x >= adjusted_search_radius else expected_x
                roi_center_y = adjusted_search_radius if expected_y >= adjusted_search_radius else expected_y
                
                best_contour = None
                best_distance = float('inf')
                
                for contour in contours:
                    area = cv2.contourArea(contour)
                    expected_area = mark_size * mark_size
                    
                    # Check if size is reasonable (more lenient than before)
                    if 0.3 * expected_area < area < 3.0 * expected_area:
                        center = get_contour_center(contour)
                        distance = np.sqrt((center[0] - roi_center_x)**2 + (center[1] - roi_center_y)**2)
                        
                        if distance < best_distance:
                            best_distance = distance
                            best_contour = contour
                
                if best_contour is not None:
                    center = get_contour_center(best_contour)
                    detected_x = x1 + center[0]
                    detected_y = y1 + center[1]
                    
                    # Validate distance
                    distance = np.sqrt((detected_x - expected_x)**2 + (detected_y - expected_y)**2)
                    max_distance = adjusted_search_radius * adjusted_tolerance
                    
                    if distance <= max_distance:
                        detected_positions.append((detected_x, detected_y))
                        logger.debug(
                            f"Square mark '{mark.id}' detected at ({detected_x}, {detected_y}), "
                            f"distance={distance:.1f}px"
                        )
                    else:
                        logger.warning(
                            f"Square mark '{mark.id}' too far (distance={distance:.1f}px > "
                            f"max={max_distance:.1f}px), using expected"
                        )
                        detected_positions.append((expected_x, expected_y))
                else:
                    logger.warning(f"Square mark '{mark.id}' not detected")
                    detected_positions.append((expected_x, expected_y))
            else:
                detected_positions.append((expected_x, expected_y))
    
    return detected_positions


def calculate_alignment_transform(
    detected_marks: List[Tuple[int, int]],
    expected_marks: List[RegistrationMark],
    method: str = "affine"
) -> Optional[np.ndarray]:
    """
    Calculate transformation matrix to align detected marks to expected positions.
    
    Args:
        detected_marks: List of detected (x, y) positions
        expected_marks: List of expected registration marks
        method: "affine" or "similarity" (similarity = rotation + scale + translation)
        
    Returns:
        Transformation matrix (2x3 for affine) or None if insufficient marks
    """
    if len(detected_marks) < 3:
        logger.warning("Need at least 3 marks for alignment")
        return None
    
    # Prepare point arrays
    src_points = np.array(detected_marks, dtype=np.float32)
    dst_points = np.array(
        [(m.position.x, m.position.y) for m in expected_marks],
        dtype=np.float32
    )
    
    # Calculate transformation
    if method == "affine":
        if len(detected_marks) >= 3:
            M = cv2.estimateAffinePartial2D(src_points, dst_points)[0]
            return M
    elif method == "similarity":
        if len(detected_marks) >= 2:
            M = cv2.estimateAffinePartial2D(
                src_points,
                dst_points,
                method=cv2.LMEDS
            )[0]
            return M
    
    return None


def apply_alignment(
    image: np.ndarray,
    transform_matrix: np.ndarray,
    output_size: Optional[Tuple[int, int]] = None
) -> np.ndarray:
    """
    Apply alignment transformation to image.
    
    Args:
        image: Input image
        transform_matrix: 2x3 affine transformation matrix
        output_size: Optional output size, defaults to input size
        
    Returns:
        Aligned image
    """
    if output_size is None:
        output_size = (image.shape[1], image.shape[0])
    
    aligned = cv2.warpAffine(
        image,
        transform_matrix,
        output_size,
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255)
    )
    
    return aligned


def align_image_with_template(
    image: np.ndarray,
    template: Template,
    strict: bool = False
) -> Tuple[np.ndarray, bool]:
    """
    Align image using template registration marks.
    
    Args:
        image: Grayscale image (after perspective correction)
        template: Template with registration marks
        strict: If True, raise error if alignment fails
        
    Returns:
        (aligned_image, alignment_successful)
        
    Raises:
        AlignmentError: If strict=True and alignment fails
    """
    if not template.registration_marks or len(template.registration_marks) < 3:
        logger.warning("Template has insufficient registration marks, skipping alignment")
        return image, False
    
    try:
        # Detect marks (search_radius auto-calculated based on image size)
        detected_marks = detect_registration_marks(
            image,
            template.registration_marks
        )
        
        # Calculate transform
        transform_matrix = calculate_alignment_transform(
            detected_marks,
            template.registration_marks
        )
        
        if transform_matrix is None:
            if strict:
                raise AlignmentError("Failed to calculate alignment transform")
            logger.warning("Alignment skipped: insufficient marks detected")
            return image, False
        
        # Apply alignment
        aligned = apply_alignment(
            image,
            transform_matrix,
            output_size=(template.canonical_size.width, template.canonical_size.height)
        )
        
        logger.success("Image aligned using registration marks")
        return aligned, True
        
    except Exception as e:
        if strict:
            raise AlignmentError(f"Alignment failed: {e}")
        logger.error(f"Alignment failed: {e}, proceeding without alignment")
        return image, False


# Legacy function for backward compatibility
def align_image(image):
    """Legacy placeholder function."""
    logger.debug("Using legacy align_image (no template provided)")
    return image
