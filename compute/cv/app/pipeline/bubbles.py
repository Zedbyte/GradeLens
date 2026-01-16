import cv2
from loguru import logger

def detect_bubbles(image):
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

    logger.debug(f"Detected {len(bubbles)} potential bubbles")
    return bubbles
