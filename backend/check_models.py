import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"))

with open('gemini_pro_details.txt', 'w') as f:
    try:
        m = genai.get_model('models/gemini-pro-latest')
        f.write(f"{m.name}: {m.supported_generation_methods}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
