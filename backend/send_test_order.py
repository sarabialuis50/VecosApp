import requests
import json

data = {
  "items": [{
    "producto_id": None,
    "nombre": "Test Product",
    "cantidad": 1,
    "precio_unitario": 1000.0,
    "notas": ""
  }],
  "cliente_nombre": "Test User",
  "cliente_telefono": "+573000000000",
  "tipo": "mesa",
  "metodo_pago": "Efectivo",
  "metodo_entrega": "Mesa",
  "direccion": None,
  "distancia": None,
  "costo_envio": 0,
  "notas": "Test note"
}

try:
    response = requests.post("http://localhost:8000/api/orders/don-jediondo", json=data)
    print(f"Status: {response.status_code}")
    with open("last_response.json", "w", encoding="utf-8") as f:
        f.write(response.text)
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
