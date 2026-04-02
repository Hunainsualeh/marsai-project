import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from routes import chat
from core.database import connect_to_mongo, close_mongo_connection

load_dotenv()

app = FastAPI(
    title="Mars AI API",
    description="FastAPI backend for integrating language models and AI services.",
    version="1.0.0"
)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include routers
app.include_router(chat.router, prefix="/api/v1", tags=["Chat generation"])

@app.get("/")
def read_root():
    return {"status": "Mars AI Engine is running", "version": "1.0.0"}
