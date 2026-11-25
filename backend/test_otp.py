import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from server import request_otp
from models_client import OTPRequest

async def test():
    data = OTPRequest(telefono="+573123607283", negocio_slug="demo-restaurante")
    res = await request_otp(data)
    print("RESULT:", res)

if __name__ == "__main__":
    asyncio.run(test())
