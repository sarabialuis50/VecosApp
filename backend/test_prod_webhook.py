import requests

# Config
PROD_URL = "https://menuia-production.up.railway.app/api/whatsapp/webhook"
OFFICIAL_NUMBER = "whatsapp:+16617952400"
TEST_USER_PHONE = "whatsapp:+573111111111"

def test_prod_platform():
    print(f"--- Testing PRODUCTION Platform Mode ---")
    data = {
        "To": OFFICIAL_NUMBER,
        "From": TEST_USER_PHONE,
        "Body": "Hola, ¿cómo funciona Menu.IA?"
    }
    
    try:
        response = requests.post(PROD_URL, data=data, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_prod_platform()
