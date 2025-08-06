#!/usr/bin/env python3
"""
Simple API key test without emojis
"""

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

def test_api_key():
    print("Testing OpenAI API Key...")
    print("=" * 40)
    
    # Load environment variables
    env_path = Path('.env')
    print(f"Looking for .env file at: {env_path.absolute()}")
    
    if env_path.exists():
        print("Found .env file, loading with override=True...")
        load_dotenv(env_path, override=True)  # Override system env vars
    else:
        print("No .env file found, trying default load_dotenv()...")
        load_dotenv()
    
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("ERROR: No OpenAI API key found!")
        return
    
    print(f"API Key loaded: {api_key[:20]}...{api_key[-10:]}")
    print(f"Key length: {len(api_key)}")
    print(f"Starts with 'sk-': {api_key.startswith('sk-')}")
    
    # Show the full key (first 30 chars) to help debug
    print(f"Key prefix: {api_key[:30]}...")
    
    # Test the API key with a simple request
    print("\nTesting API key with OpenAI...")
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Test with a simple GPT request (cheaper than DALL-E)
        data = {
            'model': 'gpt-3.5-turbo',
            'messages': [{'role': 'user', 'content': 'Say "API test successful"'}],
            'max_tokens': 10
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print(f"API Response: {message}")
            print("[SUCCESS] API KEY IS WORKING!")
        else:
            print(f"[ERROR] API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Check if it's the deactivated account error specifically
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    if 'account_deactivated' in str(error_data):
                        print("[ERROR] Account has been deactivated by OpenAI")
                    else:
                        print("[ERROR] Invalid API key or authentication issue") 
                except:
                    print("[ERROR] 401 Unauthorized - likely invalid API key")
            
    except Exception as e:
        print(f"[ERROR] Error testing API: {e}")

if __name__ == "__main__":
    test_api_key()