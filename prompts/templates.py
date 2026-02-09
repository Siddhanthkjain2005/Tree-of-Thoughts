"""
Standardized prompt templates for Linear vs DET methods.
"""

def get_linear_prompt(equations: list) -> str:
    """
    Standard linear prompting approach.
    """
    equations_text = "\n".join(equations)
    
    return f"""Solve this system of linear equations step-by-step. 

EQUATIONS:
{equations_text}

INSTRUCTIONS:
1. Show all your work clearly
2. Solve for each variable
3. Verify your solution by substituting back

Provide the final answer in this exact format:
x = [value]
y = [value]
z = [value]
(and so on for all variables)

SOLUTION:"""


def get_det_prompt(equations: list) -> str:
    """
    Standardized Dynamic Expression Tree (DET) prompting.
    Optimized for high accuracy and minimal latency (formerly v2).
    """
    equations_text = "\n".join(equations)
    num_vars = _count_variables(equations)
    var_list = _get_variable_names(num_vars)
    
    return f"""Solve using TREE DECOMPOSITION: 

{equations_text}

TREE METHOD: 
┌─ BRANCH 1: Combine eq1 + eq2 → eliminate one variable → Result A
├─ BRANCH 2: Use Result A + eq3 → solve for more variables → Result B  
├─ BRANCH 3: Continue with remaining equations → Result C
└─ ROOT: Merge all results → Complete solution

RULES:
• Show each branch clearly with "Branch X:" label
• After each branch, write "Current known: x=?, y=?, ..."
• End with VERIFY:  substitute into equation 1

FINAL FORMAT (required):
{chr(10).join(f'{v} = [number]' for v in var_list)}

START: """


def _count_variables(equations: list) -> int:
    """Count variables in equations."""
    text = " ".join(equations).lower()
    vars_found = set()
    for char in text:
        if char in ['x', 'y', 'z', 'w', 'v', 'u', 't']: 
            vars_found.add(char)
    return len(vars_found) if vars_found else 3


def _get_variable_names(num_vars: int) -> list: 
    """Get variable names for given count."""
    all_vars = ['x', 'y', 'z', 'w', 'v', 'u', 't']
    return all_vars[:num_vars]


def get_method_name(method: str) -> str:
    """Get display name for method."""
    return {
        "linear": "Linear Chain-of-Thought",
        "det": "Dynamic Expression Tree (DET)"
    }.get(method, method)