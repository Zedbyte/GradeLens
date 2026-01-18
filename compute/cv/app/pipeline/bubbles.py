"""
DEPRECATED: This module is obsolete.

Bubble detection is now handled by:
- roi_extraction.py: Extracts bubble regions
- fill_scoring.py: Measures bubble fill ratios

This file is kept for backward compatibility only.
"""
import cv2
from loguru import logger


def detect_bubbles(image):
    """
    Legacy bubble detection function (deprecated).
    Use roi_extraction and fill_scoring modules instead.
    """
    logger.warning("detect_bubbles() is deprecated. Use roi_extraction and fill_scoring modules.")
    
    thresh = cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        15,
        3
    )

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    bubbles = [c for c in contours if cv2.contourArea(c) > 100]

    logger.debug(f"Detected {len(bubbles)} potential bubbles (legacy method)")
    return bubbles
