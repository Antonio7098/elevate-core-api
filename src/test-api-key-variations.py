"""
Test script for API key variations
This script tests different API key formats and authentication methods with the Flask service
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
base_url = "http://localhost:8000"
api_key = os.getenv('AI_SERVICE_API_KEY', 'd0zYy6XQNIe3yy2iSTgEr9G6dpoJaejo')

# Try different API key formats
api_key_formats = [
    api_key,                               # Original key
    api_key.replace('\\', ''),             # Without backslash
    api_key.replace('|', '%7C'),           # URL encoded pipe
    api_key.replace('$', '%24'),           # URL encoded dollar sign
    "test123",                             # Simple test key
    "CORE_API_ACCESS_KEY"                  # Literal environment variable name
]

# Try different endpoints
endpoints = [
    "/health-check",                       # Without version
    "/v1/health-check",                    # With version
]

# Try different header formats
header_formats = [
    {"Authorization": lambda k: f"Bearer {k}"},
    {"X-API-Key": lambda k: k},
    {"Api-Key": lambda k: k},
    {"CORE_API_ACCESS_KEY": lambda k: k},
    {"x-api-key": lambda k: k},            # Lowercase
    {"authorization": lambda k: f"Bearer {k}"},  # Lowercase
    {"Authorization": lambda k: k},        # Without Bearer prefix
]

def test_api_key_variations():
    """Test different API key formats and authentication methods"""
    print("=== Testing API Key Variations ===")
    
    for endpoint in endpoints:
        print(f"\nTesting endpoint: {endpoint}")
        
        for key_format in api_key_formats:
            for header_format in header_formats:
                header_name = list(header_format.keys())[0]
                header_value = header_format[header_name](key_format)
                headers = {header_name: header_value}
                
                try:
                    response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=5)
                    status = response.status_code
                    
                    if status == 200:
                        print(f"\n✅ SUCCESS with {header_name}: {header_value}")
                        print(f"Response: {response.json()}")
                        return True
                except Exception as e:
                    # Silently continue on errors
                    pass
    
    print("\n❌ All authentication attempts failed")
    return False

def main():
    print(f"Testing with API key: {api_key}")
    
    if not test_api_key_variations():
        print("\nSuggestions:")
        print("1. Check the Flask service logs for more details")
        print("2. Verify that the Flask service is correctly configured to accept API keys")
        print("3. Try setting a simple API key in both the Flask service and the Core API")
        print("4. Check if the Flask service requires a specific header format")

if __name__ == "__main__":
    main()
