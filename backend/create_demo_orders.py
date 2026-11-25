import requests
import json
import random

BASE_URL = "http://127.0.0.1:8000/api"
SLUG = "don-jediondo"

orders_data = [
    {
        "mesa_numero": 1,
        "cliente_nombre": "Carlos Martínez",
        "tipo": "mesa",
        "items": [
            {"producto_id": "p1", "nombre": "Bandeja Paisa", "cantidad": 1, "precio_unitario": 35000},
            {"producto_id": "p2", "nombre": "Jugo de Mora", "cantidad": 1, "precio_unitario": 8000}
        ],
        "notas": "El jugo sin azúcar por favor"
    },
    {
        "mesa_numero": 4,
        "cliente_nombre": "Ana Ramos",
        "tipo": "mesa",
        "items": [
            {"producto_id": "p3", "nombre": "Ajiaco Santafereño", "cantidad": 2, "precio_unitario": 28000},
            {"producto_id": "p4", "nombre": "Cerveza Club Colombia", "cantidad": 2, "precio_unitario": 9000},
            {"producto_id": "p5", "nombre": "Postre de Natas", "cantidad": 1, "precio_unitario": 12000}
        ]
    },
    {
        "tipo": "takeaway",
        "cliente_nombre": "Juan David (Rappi)",
        "items": [
            {"producto_id": "p6", "nombre": "Picada Familiar", "cantidad": 1, "precio_unitario": 85000},
            {"producto_id": "p7", "nombre": "Gaseosa 1.5L", "cantidad": 1, "precio_unitario": 10000}
        ],
        "notas": "Enviar cubiertos extra"
    }
]

def create_orders():
    print(f"Creando pedidos de prueba para el restaurante: {SLUG}...")
    for order in orders_data:
        try:
            response = requests.post(f"{BASE_URL}/orders/{SLUG}", json=order)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Pedido creado exitosamente!")
                print(f"   ID: {data['id']}")
                print(f"   Cliente: {data.get('cliente_nombre')}")
                print(f"   Total: ${data.get('total'):,.0f}")
                print("-" * 30)
            else:
                print(f"❌ Error al crear pedido: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    create_orders()
