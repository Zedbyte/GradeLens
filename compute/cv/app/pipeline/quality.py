import cv2
import numpy as np
from loguru import logger

def assess_image_quality(gray_image):
    metrics = {}

    # --- Blur detection ---
    blur_score = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    metrics["blur"] = blur_score

    # --- Contrast ---
    contrast = gray_image.std()
    metrics["contrast"] = contrast

    # --- Illumination uniformity ---
    h, w = gray_image.shape
    blocks = []
    block_size = 64

    for y in range(0, h, block_size):
        for x in range(0, w, block_size):
            block = gray_image[y:y+block_size, x:x+block_size]
            if block.size > 0:
                blocks.append(block.mean())

    illumination_std = np.std(blocks)
    metrics["illumination_std"] = illumination_std

    # --- Hard thresholds (tuned conservatively) ---
    passed = (
        blur_score > 120 and
        contrast > 25 and
        illumination_std < 40
    )

    logger.debug(f"Quality metrics: {metrics}")

    return passed, metrics
