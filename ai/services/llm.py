import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv
from tavily import TavilyClient
from services.tokens import token_manager

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

# Define the Tavily search tool schema
tavily_tool = {
    "type": "function",
    "function": {
        "name": "tavily_search",
        "description": "Perform an internet search for current information or events using the Tavily API.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to look up on the internet."
                }
            },
            "required": ["query"],
        },
    },
}

async def generate_response(prompt: str, model: str = "llama3-8b-8192", history: list = [], user_id: str = "default_user") -> str:
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
            max_tokens=1000, # Adjust max length of responses
            tools=[tavily_tool] if tavily_client else None,
            tool_choice="auto" if tavily_client else "none"
        )
        
        response_message = response.choices[0].message
        
        # Check if the LLM wants to perform an internet search
        if getattr(response_message, 'tool_calls', None):
            tool_calls_dict = []
            for tc in response_message.tool_calls:
                tool_calls_dict.append({
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                })
            
            # Add the assistant's tool intent to message history
            messages.append({
                "role": "assistant",
                "content": response_message.content or "", # Ensure string
                "tool_calls": tool_calls_dict
            })
            
            # Execute tool(s)
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "tavily_search":
                    function_args = json.loads(tool_call.function.arguments)
                    query = function_args.get("query")
                    print(f"[Mars AI] Executing Tavily search for: {query}")
                    
                    try:
                        search_result = tavily_client.search(query)
                        results = []
                        for res in search_result.get("results", [])[:5]:
                            results.append(f"Source: {res['url']}\nContent: {res['content']}")
                        tool_response_content = "\n\n".join(results) if results else "No semantic results found for the query."
                    except Exception as e:
                        print(f"Tavily search error: {e}")
                        tool_response_content = f"Search failed with error: {str(e)}"
                    
                    # Add search results back to history
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": "tavily_search",
                        "content": tool_response_content,
                    })
            
            # Issue the final LLM call giving it the research context to answer the user
            final_content = second_response.choices[0].message.content
            # Deduct tokens from prompt and completion
            prompt_toks = token_manager.count_tokens(prompt + str(history))
            completion_toks = token_manager.count_tokens(final_content)
            await token_manager.deduct_tokens(user_id, prompt_toks + completion_toks)
            
            return final_content

        res_content = response_message.content
        # Deduct tokens
        prompt_toks = token_manager.count_tokens(prompt + str(history))
        completion_toks = token_manager.count_tokens(res_content)
        await token_manager.deduct_tokens(user_id, prompt_toks + completion_toks)
        
        return res_content
    except Exception as e:
        print(f"LLM API Error: {e}")
        return "Sorry, I ran into an error generating a response."
