#!/usr/bin/env python3
"""
Test script for API key formats
This script tests different API key formats and header combinations with the Flask service
"""

import requests
import json
import os

# Configuration
base_url = "http://localhost:8000"

# Try different API key formats
api_key_formats = [
    # Original key with potential escaping issues
    "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg\\2DxG",
    # Without the 'y' prefix
    "g48l_f3kEC$7|Wr2Z$wu.VNTrsg\\2DxG",
    # Without escaping
    "yg48l_f3kEC$7|Wr2Z$wu.VNTrsg2DxG",
    # Without the 'y' prefix and without escaping
    "g48l_f3kEC$7|Wr2Z$wu.VNTrsg2DxG",
    # Try a simpler key format (in case the complex one has issues)
    "test_key",
    # Try the environment variable name as the key (as mentioned in requirements)
    "CORE_API_ACCESS_KEY"
]

# Try different header formats
header_names = [
    "Authorization",  # With "Bearer " prefix
    "X-API-Key",
    "Api-Key",
    "CORE_API_ACCESS_KEY"
]

def test_api_key_formats():
    """Test different API key formats and header combinations"""
    print("=== Testing API Key Formats ===")
    
    for key_format in api_key_formats:
        for header_name in header_names:
            # Create headers based on header name
            if header_name == "Authorization":
                headers = {header_name: f"Bearer {key_format}"}
            else:
                headers = {header_name: key_format}
            
            print(f"\nTesting with {header_name}: {headers[header_name]}")
            try:
                response = requests.get(f"{base_url}/health-check", headers=headers)
                print(f"Status code: {response.status_code}")
                print(f"Response: {response.text}")
                
                # If successful, print the working combination
                if response.status_code == 200:
                    print("\n=== SUCCESS! Found working combination ===")
                    print(f"Header name: {header_name}")
                    print(f"API key: {key_format}")
                    print(f"Full header: {headers}")
                    return
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    test_api_key_formats()
