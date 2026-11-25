import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Config
BASE_URL = "http://localhost:8000/api/whatsapp/webhook"
OFFICIAL_NUMBER = "whatsapp:+16617952400" # From .env
TEST_USER_PHONE = "whatsapp:+573111111111" # A number likely not in history

def test_platform_first_message():
    print("--- Testing Platform Mode: First Message ---")
    data = {
        "To": OFFICIAL_NUMBER,
        "From": TEST_USER_PHONE,
        "Body": "Hola, tengo hambre y quiero pedir algo."
    }
    
    response = requests.post(BASE_URL, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_platform_location_search():
    print("\n--- Testing Platform Mode: Location Search ---")
    # We use the same TEST_USER_PHONE to simulate a conversation
    data = {
        "To": OFFICIAL_NUMBER,
        "From": TEST_USER_PHONE,
        "Body": "Estoy cerca de la Calle 100 con Carrera 15 en Bogotá. ¿Qué hay cerca?"
    }
    
    response = requests.post(BASE_URL, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    # Ensure server is running or this will fail
    try:
        test_platform_first_message()
        test_platform_location_search()
    except Exception as e:
        print(f"Error: {e}")
