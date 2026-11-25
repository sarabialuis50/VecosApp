import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
genai.configure(api_key=api_key)

with open('model_names.txt', 'w') as f:
    try:
        models = genai.list_models()
        for m in models:
            f.write(f"{m.name}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
