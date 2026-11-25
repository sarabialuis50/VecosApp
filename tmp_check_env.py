import os
import jwt
SECRET = os.environ.get("JWT_SECRET", "secret-key")
print(f"DEBUG: SECRET={SECRET[:5]}...")
