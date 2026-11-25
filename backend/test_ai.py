import os
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv()

async def test_gen():
    try:
        print("2. Enhancing prompt with GPT-4o-mini...")
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        prompt_refinement = "Create a photo prompt for a 'Delicious Burger'"
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt_refinement}]
        )
        enhanced_prompt = response.choices[0].message.content.strip()
        print(f"Enhanced Prompt: {enhanced_prompt}")
        
        print("3. Generating image with DALL-E 3...")
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        img_gen_res = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        dalle_url = img_gen_res.data[0].url
        print(f"Dalle URL: {dalle_url}")
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_gen())
