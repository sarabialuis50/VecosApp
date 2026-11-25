import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/37a07d0f-e8b4-4f23-bfe9-02be72d76c28"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send("ping")
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
