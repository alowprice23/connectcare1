from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    version: str

@router.get("/health")
def check_health() -> HealthResponse:
    """Health check endpoint to verify API is running"""
    return HealthResponse(
        status="ok",
        version="1.0.0"
    )
