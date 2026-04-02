import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

async def generate_response(prompt: str, model: str = "llama3-8b-8192", history: list = []) -> str:
    """
    Modular LLM integration. Swapping out OpenAI for Groq SDK.
    """
    if not GROQ_API_KEY:
        return "Warning: GROQ_API_KEY not configured. This is a mock response from Mars AI."

    # Using the new Groq async client format
    client = AsyncGroq(api_key=GROQ_API_KEY)

    # This is the Core System Prompt. Edit this to change Mars AI's personality, behavior, or format!
    SYSTEM_PROMPT = """
You are Mars AI, a highly advanced, mechanical reasoning engine capable of high-stakes mission logic and autonomous execution. 
Your interface is kinetic and pill-based. You do not use gradients or highlights, just pure, high-contrast responses.
Output should be direct, clean, and futuristic. Keep responses concise unless otherwise needed.
"""

    messages = [{"role": "system", "content": SYSTEM_PROMPT.strip()}]
    messages.extend([{"role": m.get("role", "user"), "content": m.get("content", "")} for m in history])
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=1,   # Adjust creativity (0.0 = robotic/strict, 1.0 = very creative)
            max_tokens=1000     # Adjust max length of responses
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM API Error: {e}")
        return "Sorry, I ran into an error generating a response."
