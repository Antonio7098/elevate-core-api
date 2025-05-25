"""
Debug script to test Flask service authentication
"""
import requests
import json
import os

# Test different API key configurations
API_KEYS = [
    "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg\\2DxG",  # From your logs (escaped)
    "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg\2DxG",   # From your env (single backslash)
    "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg2DxG",    # Without backslash
    "d0zYy6XQNIe3yy2iSTgEr9G6dpoJaejo",    # New API key
]

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint with different configurations"""
    print("=== Testing Flask Service Authentication ===\n")
    
    for i, api_key in enumerate(API_KEYS, 1):
        print(f"Test {i}: API Key = '{api_key}'")
        
        # Test different header combinations
        header_configs = [
            {"X-API-Key": api_key},
            {"Authorization": f"Bearer {api_key}"},
            {"CORE_API_ACCESS_KEY": api_key},
            {"Api-Key": api_key},
        ]
        
        for j, headers in enumerate(header_configs, 1):
            try:
                response = requests.get(f"{BASE_URL}/v1/health-check", headers=headers, timeout=5)
                print(f"  Config {j} ({list(headers.keys())[0]}): Status {response.status_code}")
                
                if response.status_code == 200:
                    print(f"  ✅ SUCCESS! Response: {response.json()}")
                    return True
                else:
                    print(f"  ❌ Error: {response.json()}")
                    
            except requests.exceptions.RequestException as e:
                print(f"  ❌ Request failed: {e}")
        
        print()
    
    return False

def check_flask_service():
    """Check if Flask service is running"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"Flask service status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Flask service is running")
            return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Flask service not reachable: {e}")
        return False

def main():
    print("Checking Flask service availability...")
    try:
        # Just try to connect to the service
        requests.get(f"{BASE_URL}/", timeout=5)
        print("Flask service appears to be running")
    except requests.exceptions.RequestException as e:
        print(f"❌ Flask service not reachable: {e}")
        print("Please ensure your Flask service is running on port 8000")
        return
    
    print("\n" + "="*50)
    
    # Skip the check and directly test authentication
    print("Skipping availability check and directly testing authentication...")
    
    if not test_health_check():
        print("\n❌ All authentication attempts failed")
        print("\nSuggestions:")
        print("1. Check if CORE_API_ACCESS_KEY in Flask matches exactly")
        print("2. Verify Flask authentication middleware implementation")
        print("3. Check Flask logs for authentication errors")
        print("4. Test with a simple API key like 'test123'")
    else:
        print("\n✅ Authentication successful!")

if __name__ == "__main__":
    main()
