import requests
import json

def test_openrouter_tool_calling():
    """
    Test if OpenRouter's Mistral free model supports tool calling
    """
    
    # Configuration
    config = {
        "api_key": "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",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "mistralai/mistral-small-3.1-24b-instruct:free",
        "max_tokens": 4096,
        "temperature": 0.5,
        "top_p": 1,
        "top_k": 0,
        "max_retries": 10
    }
    
    # Define a simple test tool
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather for a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "The temperature unit"
                        }
                    },
                    "required": ["location"]
                }
            }
        }
    ]
    
    # Test message that should trigger tool calling
    messages = [
        {
            "role": "user",
            "content": "What's the weather like in New York City right now?"
        }
    ]
    
    # Prepare the request
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": config["model"],
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto",  # Let the model decide when to use tools
        "max_tokens": config["max_tokens"],
        "temperature": config["temperature"],
        "top_p": config["top_p"]
    }
    
    try:
        print("Testing OpenRouter Mistral model for tool calling capability...")
        print(f"Model: {config['model']}")
        print(f"Test query: {messages[0]['content']}")
        print("-" * 50)
        
        # Make the API request
        response = requests.post(
            f"{config['base_url']}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        # Check response status
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        # Parse response
        result = response.json()
        
        # Check if response contains tool calls
        if "choices" in result and len(result["choices"]) > 0:
            choice = result["choices"][0]
            message = choice.get("message", {})
            
            # Check for tool calls in the response
            tool_calls = message.get("tool_calls", [])
            
            if tool_calls:
                print("✅ SUCCESS: Model supports tool calling!")
                print(f"Number of tool calls: {len(tool_calls)}")
                
                for i, tool_call in enumerate(tool_calls):
                    print(f"\nTool Call {i+1}:")
                    print(f"  Function: {tool_call.get('function', {}).get('name', 'Unknown')}")
                    print(f"  Arguments: {tool_call.get('function', {}).get('arguments', 'None')}")
                
                return True
            else:
                print("❌ FAILED: Model did not make any tool calls")
                print("Response content:", message.get("content", "No content"))
                
                # Check if the model mentioned it can't use tools
                content = message.get("content", "").lower()
                if any(phrase in content for phrase in ["can't", "cannot", "unable", "don't have access"]):
                    print("⚠️  Model explicitly stated it cannot use tools")
                
                return False
        else:
            print("❌ FAILED: Invalid response format")
            print("Response:", result)
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network Error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def test_alternative_approach():
    """
    Alternative test with a more explicit tool calling request
    """
    config = {
        "api_key": "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",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "mistralai/mistral-small-3.1-24b-instruct:free"
    }
    
    # Simple math tool
    tools = [
        {
            "type": "function",
            "function": {
                "name": "calculate",
                "description": "Perform basic arithmetic calculations",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "Mathematical expression to evaluate"
                        }
                    },
                    "required": ["expression"]
                }
            }
        }
    ]
    
    messages = [
        {
            "role": "user",
            "content": "Use the calculate tool to find the result of 234 * 567"
        }
    ]
    
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": config["model"],
        "messages": messages,
        "tools": tools,
        "tool_choice": "required",  # Force tool usage
        "max_tokens": 1000
    }
    
    try:
        print("\n" + "="*50)
        print("ALTERNATIVE TEST: Forcing tool usage...")
        
        response = requests.post(
            f"{config['base_url']}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            choice = result["choices"][0]
            message = choice.get("message", {})
            tool_calls = message.get("tool_calls", [])
            
            if tool_calls:
                print("✅ SUCCESS: Forced tool calling worked!")
                return True
            else:
                print("❌ FAILED: Even forced tool calling didn't work")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            error_detail = response.json().get("error", {}).get("message", "Unknown error")
            print(f"Error detail: {error_detail}")
            
            # Check if error mentions tool calling not supported
            if "tool" in error_detail.lower() or "function" in error_detail.lower():
                print("⚠️  Error suggests tool calling is not supported")
            
            return False
            
    except Exception as e:
        print(f"❌ Error in alternative test: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Testing OpenRouter Mistral Free Model Tool Calling Capability")
    print("=" * 60)
    
    # Run primary test
    success1 = test_openrouter_tool_calling()
    
    # Run alternative test
    success2 = test_alternative_approach()
    
    print("\n" + "="*60)
    print("FINAL RESULTS:")
    print(f"Test 1 (Auto tool calling): {'✅ PASSED' if success1 else '❌ FAILED'}")
    print(f"Test 2 (Forced tool calling): {'✅ PASSED' if success2 else '❌ FAILED'}")
    
    if success1 or success2:
        print("\n🎉 CONCLUSION: Model supports tool calling!")
    else:
        print("\n❌ CONCLUSION: Model does NOT support tool calling")
        print("\nThis might be because:")
        print("- Free tier models often have limited tool calling support")
        print("- The specific model version doesn't support function calling")
        print("- OpenRouter may have restrictions on tool calling for free models")
