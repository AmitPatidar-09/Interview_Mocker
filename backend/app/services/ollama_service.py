import httpx
import json
from ..utils.helpers import extract_json_from_response

OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3"

async def generate_json(prompt: str, model: str = DEFAULT_MODEL) -> dict:
    """
    Send *prompt* to local Ollama and return the parsed JSON response.
    Requires Ollama to be running locally.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OLLAMA_API_URL, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            text = data.get("response", "")
            return extract_json_from_response(text)
        except Exception as e:
            # Fallback or re-raise depending on how we handle local model failures
            print(f"Ollama error: {e}")
            raise ValueError(f"Failed to generate from Ollama: {e}")
