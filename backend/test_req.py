import requests

payload = {
    "negocio_id": "8aaadfdc-c9d7-46af-8238-d77960fc5f9a",
    "name": "Test Item",
    "description": "Test Descr",
    "base_price": 5000,
    "currency": "COP",
    "category": "Entradas",
    "image_url": "",
    "available": True,
    "is_recommended": False,
    "is_vegan": False,
    "is_vegetarian": False,
    "is_gluten_free": False,
    "is_spicy": False,
    "prep_time_minutes": 15,
    "allergens": [],
    "modificadores": [],
    "tamanos": [],
    "opciones": [],
    "nutri_kcal": None,
    "nutri_proteina": None,
    "nutri_carbohidratos": None,
    "nutri_grasa": None,
    "precio_original": None,
    "oferta_porcentaje": None
}

r = requests.post("http://localhost:8000/api/menu-items/don-jediondo", json=payload)
print(r.status_code)
print(r.text)
