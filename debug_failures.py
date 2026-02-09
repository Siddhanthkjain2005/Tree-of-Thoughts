
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.llm_client import get_llm_client
from prompts.templates import get_linear_prompt, get_det_prompt
from data.equations import get_equations
from config import settings

def debug_5var():
    print("--- Debugging 5-Variable System ---")
    
    # Force larger tokens for debug
    settings.MAX_TOKENS = 4000
    
    llm = get_llm_client()
    eq_data = get_equations(5)
    equations = eq_data["equations"]
    
    print("\nEquations:")
    for eq in equations:
        print(f"  {eq}")
        
    print("\n--- Testing LINEAR ---")
    prompt = get_linear_prompt(equations)
    print(f"Prompt length: {len(prompt)} chars")
    
    # Manually call to see the full object
    response_obj = llm.client.chat.completions.create(
        model=llm.model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=settings.MAX_TOKENS,
    )
    
    print("\nFull Response Object:")
    print(response_obj)
    
    text = response_obj.choices[0].message.content if response_obj.choices else ""
    tokens = response_obj.usage.total_tokens if response_obj.usage else 0
    
    print(f"\nResponse (First 500 chars):")
    print(f"'{text[:500]}'")
    print(f"\nResponse length: {len(text)} chars")
    print(f"Tokens: {tokens}")
    
    if not text:
        print("\n❌ WARNING: RESPONSE IS EMPTY!")

if __name__ == "__main__":
    debug_5var()
