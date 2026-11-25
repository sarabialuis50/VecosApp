from dotenv import load_dotenv
load_dotenv()
import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"))

with open("available_models.txt", "w") as f:
    for m in genai.list_models():
        methods = list(m.supported_generation_methods)
        if 'generateContent' in methods:
            f.write(m.name + "\n")

print("Done. See available_models.txt")
