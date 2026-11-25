from dotenv import load_dotenv
load_dotenv()
import os, json, re
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"))

prompt = """Responde ÚNICAMENTE un JSON válido sin markdown con esta estructura:
{"opciones": [{"tipo": "Corta", "mensaje": "Hola"}, {"tipo": "Creativa", "mensaje": "Hey"}, {"tipo": "Oferta", "mensaje": "Promo"}], "recomendacion_marketing": "test"}"""

models_to_try = [
    'models/gemini-2.5-flash',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-flash-latest',
]

for m_name in models_to_try:
    try:
        print(f"Trying {m_name}...")
        model = genai.GenerativeModel(m_name)
        r = model.generate_content(prompt)
        text = r.text.strip()
        print(f"  RAW response: {text[:100]}...")
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        data = json.loads(text)
        print(f"  SUCCESS! Parsed JSON with {len(data.get('opciones', []))} options")
        break
    except Exception as e:
        print(f"  FAILED: {e}")
