import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv()

def get_nutritional_estimate(dish_name):
    api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
    if not api_key:
        return {"error": "API Key de Gemini no encontrada"}
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Como experto nutricionista de IA para un restaurante, analiza el siguiente plato y proporciona una estimación de sus valores nutricionales aproximados para una porción estándar.
    
    Plato: {dish_name}
    
    Devuelve la respuesta ÚNICAMENTE como un objeto JSON con la siguiente estructura exacta:
    {{
        "plato": "{dish_name}",
        "kcal": valor_entero,
        "prot": "valor_g",
        "carb": "valor_g",
        "grasa": "valor_g",
        "nota": "Breve explicación de por qué estos valores"
    }}
    
    Asegúrate de que los valores sean aproximados y realistas basados en una porción de restaurante comercial.
    """
    
    try:
        response = model.generate_content(prompt)
        # Limpiar la respuesta para obtener solo el JSON
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    test_dishes = ["Bandeja Paisa", "Salmón al Teriyaki con Arroz de Jazmín", "Hamburguesa Gourmet con Papas Fritas"]
    print("--- PRUEBA TÉCNICA DE ESTIMACIÓN NUTRICIONAL POR IA ---")
    for dish in test_dishes:
        print(f"\nAnalizando: {dish}...")
        result = get_nutritional_estimate(dish)
        print(json.dumps(result, indent=4, ensure_ascii=False))
