
import requests
import time
import os
import uuid

# Base URL for local backend
BASE_URL = "http://localhost:8000"

# Colors for printing
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'

def print_pass(msg):
    print(f"{GREEN}[PASS]{RESET} {msg}")

def print_fail(msg):
    print(f"{RED}[FAIL]{RESET} {msg}")

def test_health_check():
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print_pass("Health Check: System is Online")
            return True
        else:
            print_fail(f"Health Check: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Health Check: Connection Failed ({e})")
        return False

def test_model_status():
    try:
        print("\n--- Testing Model Status ---")
        response = requests.get(f"{BASE_URL}/api/models/status")
        if response.status_code == 200:
            data = response.json()
            for model, status in data.items():
                if status == 'ok':
                    print_pass(f"{model.capitalize()}: Available")
                else:
                    print(f"      {model.capitalize()}: {status} (Not Green)")
            return True
        else:
            print_fail(f"Model Status: {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Model Status: Failed ({e})")
        return False

def test_generate_draft():
    try:
        print("\n--- Testing Draft Generation ---")
        # Need a dummy session
        session_id = str(uuid.uuid4())
        
        headers = {'X-Session-ID': session_id}
        payload = {
            "topic": "The Future of AI Coding",
            "purpose": "Test",
            "options": {},
            "key_points": [],
            "style": "professional",
            "tone": "informative",
            "modelProvider": "gemini" 
        }
        
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('content') and len(data['content']) > 100:
                print_pass("Draft Generation: Success (>100 chars generated)")
            else:
                print_fail("Draft Generation: Content too short or empty")
        else:
            print_fail(f"Draft Generation: {response.status_code} - {response.text}")

    except Exception as e:
        print_fail(f"Draft Generation: Failed ({e})")

# Run functionality tests
if __name__ == "__main__":
    print(f"Checking WordAssistantAI Backend at {BASE_URL}...\n")
    
    if test_health_check():
        test_model_status()
        test_generate_draft()
        # Add more tests here
    else:
        print_fail("Skipping further tests as Health Check failed.")
