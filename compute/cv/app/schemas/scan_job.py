from pydantic import BaseModel

class ScanJob(BaseModel):
    scan_id: str
    image_path: str
    template: str
