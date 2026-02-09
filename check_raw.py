
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.llm_client import get_llm_client
from prompts.templates import get_linear_prompt
from data.equations import get_equations

def inspect_raw_response():
    llm = get_llm_client()
    eq_data = get_equations(3)
    equations = eq_data["equations"]
    
    prompt = get_linear_prompt(equations)
    response, tokens, time_taken = llm.generate(prompt)
    
    print("--- RAW RESPONSE ---")
    print(response)
    print("--- END RAW RESPONSE ---")

if __name__ == "__main__":
    inspect_raw_response()
