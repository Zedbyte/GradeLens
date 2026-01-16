from fastapi import FastAPI
from app.api.health import router as health_router
from loguru import logger

app = FastAPI(
    title="CV Compute Service",
    version="0.1.0"
)

app.include_router(health_router)

@app.on_event("startup")
async def startup():
    logger.info("CV Compute Service started")

@app.on_event("shutdown")
async def shutdown():
    logger.info("CV Compute Service shutting down")
