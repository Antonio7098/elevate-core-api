#!/usr/bin/env python3
"""
Test script for Flask service
This script tests the connection to the Flask service using Python's requests library
"""

import requests
import json

# Configuration
base_url = "http://localhost:8000"
api_key = "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg\\2DxG"

# Test different header formats
header_formats = [
    {"X-API-Key": api_key},
    {"Authorization": f"Bearer {api_key}"},
    {"CORE_API_ACCESS_KEY": api_key},
    {"Api-Key": api_key},
    # Try without the 'y' prefix (in case it was added by mistake)
    {"Authorization": f"Bearer {api_key[1:]}"},
    # Try with a hardcoded value (for testing)
    {"Authorization": "Bearer CORE_API_ACCESS_KEY"}
]

def test_health_check():
    """Test the health check endpoint with different header formats"""
    print("=== Testing Health Check Endpoint ===")
    
    for i, headers in enumerate(header_formats):
        print(f"\nTest {i+1}: Using headers: {headers}")
        try:
            response = requests.get(f"{base_url}/health-check", headers=headers)
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_health_check()
