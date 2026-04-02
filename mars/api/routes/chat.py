from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.llm import generate_response
from core.database import get_database

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str
    model: str = "llama3-8b-8192" # Flexibly pointing to Groq's model
    history: list = []

@router.post("/generate")
async def chat_generate(request: ChatRequest):
    try:
        reply = await generate_response(request.prompt, request.model, request.history)
        
        # Async log to MongoDB
        db = get_database()
        if db:
            await db["chat_logs"].insert_one({
                "prompt": request.prompt,
                "reply": reply,
                "model": request.model
            })
            
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
