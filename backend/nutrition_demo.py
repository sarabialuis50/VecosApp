import os
import google.generativeai as genai
import json

# Simulated prompt results to ensure the user sees the logic if the local API call fails
# In a real environment, this calls Gemini
def get_nutritional_estimate_simulated(dish_name):
    # This is a sample of what Gemini returns based on its internal knowledge (USDA, etc.)
    database = {
        "Bandeja Paisa": {
            "plato": "Bandeja Paisa",
            "kcal": 1250,
            "prot": "55g",
            "carb": "110g",
            "grasa": "65g",
            "nota": "Plato densamente calórico con múltiples fuentes de proteína (carne, huevo, chicharrón) y carbohidratos complejos (frijol, arroz, plátano)."
        },
        "Salmón al Teriyaki con Arroz de Jazmín": {
            "plato": "Salmón al Teriyaki con Arroz de Jazmín",
            "kcal": 580,
            "prot": "35g",
            "carb": "65g",
            "grasa": "18g",
            "nota": "Aporte balanceado de grasas saludables (Omega-3) y carbohidratos de absorción moderada."
        },
        "Hamburguesa Gourmet con Papas Fritas": {
            "plato": "Hamburguesa Gourmet con Papas Fritas",
            "kcal": 950,
            "prot": "32g",
            "carb": "85g",
            "grasa": "48g",
            "nota": "Valores estimados para una hamburguesa de 200g de res con queso, pan brioche y porción de papas fritas."
        }
    }
    return database.get(dish_name, {
        "plato": dish_name,
        "kcal": 450,
        "prot": "20g",
        "carb": "40g",
        "grasa": "15g",
        "nota": "Estimación genérica basada en ingredientes estándar."
    })

if __name__ == "__main__":
    test_dishes = ["Bandeja Paisa", "Salmón al Teriyaki con Arroz de Jazmín", "Hamburguesa Gourmet con Papas Fritas"]
    print("--- PRUEBA TÉCNICA: ESTIMACIÓN NUTRICIONAL POR IA (Simulación de Gemini) ---")
    for dish in test_dishes:
        print(f"\nAnalizando: {dish}...")
        result = get_nutritional_estimate_simulated(dish)
        print(json.dumps(result, indent=4, ensure_ascii=False))
