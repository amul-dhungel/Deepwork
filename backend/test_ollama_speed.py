#!/usr/bin/env python3
"""
Quick test script to verify Ollama optimizations
Run this to test if the faster model is working
"""

import requests
import time
import json

OLLAMA_API_URL = "http://localhost:11434/api/chat"

def test_ollama():
    print("=" * 70)
    print("OLLAMA OPTIMIZATION TEST")
    print("=" * 70)
    
    # Test 1: Simple query (should be <5s)
    print("\n📝 Test 1: Simple Query")
    print("-" * 70)
    
    start = time.time()
    
    payload = {
        "model": "deepseek-v3.1:8b",
        "messages": [{"role": "user", "content": "What is artificial intelligence? (2 sentences)"}],
        "stream": False,
        "options": {
            "num_ctx": 4096,
            "num_predict": 2048,
            "temperature": 0.7,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
            "num_thread": 8,
        },
        "keep_alive": "5m"
    }
    
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json=payload,
            timeout=60
        )
        
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            content = data["message"]["content"]
            
            print(f"✅ Response received in {elapsed:.2f}s")
            print(f"\nResponse:\n{content}\n")
            
            # Benchmark
            if elapsed < 5:
                print(f"🚀 EXCELLENT: {elapsed:.2f}s (Target: <5s)")
            elif elapsed < 10:
                print(f"✓ GOOD: {elapsed:.2f}s (Target: <5s)")
            else:
                print(f"⚠️ SLOW: {elapsed:.2f}s (Target: <5s)")
                print("   Tip: Make sure you've pulled 8B model: ollama pull deepseek-v3.1:8b")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        print("\nMake sure Ollama is running:")
        print("  1. Start Ollama: ollama serve")
        print("  2. Pull model: ollama pull deepseek-v3.1:8b")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    test_ollama()
