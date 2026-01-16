import cv2
from loguru import logger

def preprocess_image(image_path: str):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Image not found: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    logger.debug("Preprocessing complete")
    return blurred
