from pydantic import BaseModel
from typing import Dict, Any

class ScanResult(BaseModel):
    scan_id: str
    success: bool
    confidence: float
    answers: Dict[str, Any]
    errors: list[str] = []
