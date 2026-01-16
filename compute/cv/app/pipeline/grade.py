from app.schemas.scan_result import ScanResult
from loguru import logger

def grade_bubbles(scan_id: str, bubbles):
    # Placeholder grading
    confidence = min(1.0, len(bubbles) / 100)

    result = ScanResult(
        scan_id=scan_id,
        success=True,
        confidence=confidence,
        answers={}
    )

    logger.debug("Grading complete (placeholder)")
    return result.dict()
