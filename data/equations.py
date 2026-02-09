"""
Test equations for the experiment.
"""

# 3-Variable System (Baseline)
EQUATIONS_3VAR = {
    "size":  3,
    "variables": ["x", "y", "z"],
    "equations":  [
        "2x + 3y - z = 1",
        "x - 2y + 4z = 11",
        "3x + y - z = 4"
    ],
    "solution":  {"x": 15/7, "y": -3/7, "z": 2}  # Actual solution
}

# 5-Variable System (DET Emerges)
EQUATIONS_5VAR = {
    "size": 5,
    "variables":  ["x", "y", "z", "w", "v"],
    "equations":  [
        "x + y + z + w - v = 3",
        "2x - 3y + 4z - w = 10",
        "x + 2y - z + 3w + 2v = 8",
        "3x - y + 2z - w - v = 7",
        "x + y - z + w + 2v = 6"
    ],
    "solution":  None  # Will be calculated
}

# 7-Variable System (Linear Collapses)
EQUATIONS_7VAR = {
    "size": 7,
    "variables":  ["x", "y", "z", "w", "v", "u", "t"],
    "equations": [
        "x + y - z + w - v + u = 5",
        "2x - 3y + 4z - w + 2v - u = 12",
        "x + 2y - z + 3w - v + u = 9",
        "3x - y + 2z - w - 2v + 3u = 11",
        "x - y + z + w + v - u = 4",
        "4x + 2y - z - 3w + v - u = 10",
        "x + 3y + 2z - w - v + 2u = 8"
    ],
    "solution": None
}

ALL_EQUATIONS = {
    3: EQUATIONS_3VAR,
    5: EQUATIONS_5VAR,
    7: EQUATIONS_7VAR
}

def get_equations(size: int) -> dict:
    """Get equations by size."""
    return ALL_EQUATIONS. get(size, EQUATIONS_3VAR)