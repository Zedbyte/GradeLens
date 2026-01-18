"""
Image preprocessing module.
Normalizes and enhances image quality before main CV processing.
"""
import cv2
import numpy as np
from typing import Tuple, Dict
from loguru import logger

from app.utils.image_utils import (
    calculate_blur_score,
    calculate_brightness_stats,
    calculate_skew_angle
)


class PreprocessingError(Exception):
    """Raised when preprocessing fails or quality checks fail."""
    pass


def preprocess_image(
    image_path: str,
    apply_clahe: bool = True,
    check_quality: bool = True,
    min_blur_score: float = 100.0
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Preprocess image with quality checks.
    
    Steps:
    1. Load image
    2. Convert to grayscale
    3. Measure quality metrics (blur, brightness)
    4. Apply CLAHE for contrast enhancement
    5. Apply Gaussian blur for noise reduction
    
    Args:
        image_path: Path to image file
        apply_clahe: Whether to apply CLAHE contrast enhancement
        check_quality: Whether to perform quality checks
        min_blur_score: Minimum acceptable blur score
        
    Returns:
        (processed_image, quality_metrics)
        
    Raises:
        PreprocessingError: If image cannot be loaded or quality is too poor
    """
    # Load image
    image = cv2.imread(image_path)
    
    if image is None:
        raise PreprocessingError(
            f"Failed to decode image (invalid or corrupt): {image_path}"
        )
    
    logger.debug(f"Loaded image: {image.shape}")
    
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Measure quality metrics
    quality_metrics = {}
    
    if check_quality:
        blur_score = calculate_blur_score(gray)
        brightness_mean, brightness_std = calculate_brightness_stats(gray)
        skew_angle = calculate_skew_angle(gray)
        
        quality_metrics = {
            "blur_score": blur_score,
            "brightness_mean": brightness_mean,
            "brightness_std": brightness_std,
            "skew_angle": skew_angle
        }
        
        logger.debug(
            f"Quality: blur={blur_score:.1f}, "
            f"brightness={brightness_mean:.1f}±{brightness_std:.1f}, "
            f"skew={skew_angle:.2f}°"
        )
        
        # Quality checks
        if blur_score < min_blur_score:
            raise PreprocessingError(
                f"Image too blurry: blur_score={blur_score:.1f} < {min_blur_score}"
            )
        
        if brightness_mean < 50:
            logger.warning(f"Image very dark: mean brightness={brightness_mean:.1f}")
        elif brightness_mean > 230:
            logger.warning(f"Image very bright: mean brightness={brightness_mean:.1f}")
        
        if abs(skew_angle) > 10:
            logger.warning(f"Significant skew detected: {skew_angle:.2f}°")
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    if apply_clahe:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        logger.debug("CLAHE applied")
    else:
        enhanced = gray
    
    # Apply Gaussian blur for noise reduction
    blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
    
    logger.success("Preprocessing complete")
    
    return blurred, quality_metrics


def normalize_brightness(
    image: np.ndarray,
    target_mean: float = 200.0
) -> np.ndarray:
    """
    Normalize image brightness to target mean.
    
    Args:
        image: Grayscale image
        target_mean: Target mean brightness (0-255)
        
    Returns:
        Normalized image
    """
    current_mean = np.mean(image)
    
    if current_mean == 0:
        return image
    
    scale = target_mean / current_mean
    normalized = np.clip(image * scale, 0, 255).astype(np.uint8)
    
    logger.debug(f"Brightness normalized: {current_mean:.1f} → {target_mean:.1f}")
    
    return normalized


def remove_noise(
    image: np.ndarray,
    method: str = "gaussian",
    kernel_size: int = 5
) -> np.ndarray:
    """
    Remove noise from image.
    
    Args:
        image: Grayscale image
        method: "gaussian", "median", or "bilateral"
        kernel_size: Kernel size (must be odd)
        
    Returns:
        Denoised image
    """
    if kernel_size % 2 == 0:
        kernel_size += 1
    
    if method == "gaussian":
        return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
    elif method == "median":
        return cv2.medianBlur(image, kernel_size)
    elif method == "bilateral":
        return cv2.bilateralFilter(image, kernel_size, 75, 75)
    else:
        logger.warning(f"Unknown noise removal method: {method}")
        return image


def enhance_contrast(
    image: np.ndarray,
    clip_limit: float = 2.0,
    tile_size: int = 8
) -> np.ndarray:
    """
    Enhance image contrast using CLAHE.
    
    Args:
        image: Grayscale image
        clip_limit: CLAHE clip limit
        tile_size: Grid tile size
        
    Returns:
        Contrast-enhanced image
    """
    clahe = cv2.createCLAHE(
        clipLimit=clip_limit,
        tileGridSize=(tile_size, tile_size)
    )
    enhanced = clahe.apply(image)
    
    return enhanced


def validate_image_quality(
    image: np.ndarray,
    min_blur: float = 100.0,
    min_brightness: float = 50.0,
    max_brightness: float = 230.0
) -> Tuple[bool, list]:
    """
    Validate image meets minimum quality standards.
    
    Args:
        image: Grayscale image
        min_blur: Minimum blur score
        min_brightness: Minimum mean brightness
        max_brightness: Maximum mean brightness
        
    Returns:
        (is_valid, list_of_warnings)
    """
    warnings = []
    
    # Check blur
    blur_score = calculate_blur_score(image)
    if blur_score < min_blur:
        warnings.append(f"LOW_BLUR_SCORE: {blur_score:.1f} < {min_blur}")
    
    # Check brightness
    brightness_mean, brightness_std = calculate_brightness_stats(image)
    if brightness_mean < min_brightness:
        warnings.append(f"TOO_DARK: mean={brightness_mean:.1f}")
    elif brightness_mean > max_brightness:
        warnings.append(f"TOO_BRIGHT: mean={brightness_mean:.1f}")
    
    # Check contrast
    if brightness_std < 20:
        warnings.append(f"LOW_CONTRAST: std={brightness_std:.1f}")
    
    is_valid = len(warnings) == 0
    
    return is_valid, warnings
