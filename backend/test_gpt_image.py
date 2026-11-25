import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

try:
    print("Testing gpt-image-1-mini...")
    res = client.images.generate(
        model="gpt-image-1-mini",
        prompt="A professional photo of a simple hamburger on a wooden plate, studio lighting, bokeh.",
        size="1024x1024",
        quality="low",
        n=1
    )
    print("Response structure:")
    print(json.dumps(res.model_dump(), indent=2))
except Exception as e:
    print(f"Error: {e}")
