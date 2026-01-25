from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.health import router as health_router
from app.api.preview import router as preview_router
from app.api.templates import router as templates_router
from loguru import logger
from pathlib import Path

app = FastAPI(
    title="CV Compute Service",
    version="0.1.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage directory for serving pipeline visualization images
storage_path = Path("storage")
if storage_path.exists():
    app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

app.include_router(health_router)
app.include_router(preview_router)
app.include_router(templates_router)

@app.on_event("startup")
async def startup():
    logger.info("CV Compute Service started")

@app.on_event("shutdown")
async def shutdown():
    logger.info("CV Compute Service shutting down")
