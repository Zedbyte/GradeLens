import json
import time
import redis
from loguru import logger

from app.settings import settings
from app.schemas.scan_job import ScanJob
from app.pipeline.preprocess import preprocess_image
from app.pipeline.align import align_image
from app.pipeline.bubbles import detect_bubbles
from app.pipeline.grade import grade_bubbles

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)

QUEUE_NAME = "scan_jobs"

def run_worker():
    logger.info("Scan worker started")
    print("Scan worker started")

    while True:
        _, raw_job = redis_client.blpop(QUEUE_NAME)
        try:
            job_data = json.loads(raw_job)
            job = ScanJob(**job_data)

            logger.info(f"Processing scan {job.scan_id}")

            image = preprocess_image(job.image_path)
            aligned = align_image(image)
            bubbles = detect_bubbles(aligned)
            result = grade_bubbles(job.scan_id, bubbles)

            logger.success(f"Scan {job.scan_id} processed")
            logger.debug(result)

        except Exception as e:
            logger.exception(f"Failed processing job: {e}")
