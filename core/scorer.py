"""
Enhanced scoring system for evaluating responses.
Score = Completeness(50) + Consistency(30) + Reasoning(20)
"""
import re
from typing import Dict, List, Tuple


class ResponseScorer:
    """
    Enhanced scorer with better variable extraction. 
    """
    
    def __init__(self):
        self.reasoning_keywords = [
            "step", "substitute", "tree", "equation", "branch",
            "solve", "therefore", "thus", "partial", "level",
            "first", "next", "finally", "merge", "eliminate",
            "result", "verify", "verification", "check", "node"
        ]
    
    def score(self, response: str, variables: List[str], expected: Dict = None) -> Dict:
        """
        Score a response with improved extraction. 
        """
        # Extract variable assignments
        assignments = self._extract_assignments(response, variables)
        
        # Calculate scores
        completeness = self._score_completeness(assignments, variables)
        consistency = self._score_consistency(response, assignments, variables)
        reasoning = self._score_reasoning(response)
        
        total = completeness + consistency + reasoning
        success = total >= 70
        
        return {
            "total": total,
            "completeness": completeness,
            "consistency": consistency,
            "reasoning": reasoning,
            "success": success,
            "variables_found": len(assignments),
            "variables_expected": len(variables),
            "assignments":  assignments
        }
    
    def _extract_assignments(self, response: str, variables:  List[str]) -> Dict[str, float]:
        """Enhanced variable extraction with multiple patterns."""
        assignments = {}
        
        for var in variables:
            value = self._find_variable_value(response, var)
            if value is not None:
                assignments[var] = value
        
        return assignments
    
    def _find_variable_value(self, response: str, var: str) -> float:
        """Find value for a specific variable using multiple patterns."""
        
        # Clean response for extraction: handle LaTeX and common LLM bolding
        # but keep a copy of the original for reasoning scoring
        clean_text = response
        clean_text = re.sub(rf'\\\(\s*{var}\s*\\\)', var, clean_text, flags=re.IGNORECASE)
        clean_text = re.sub(rf'\*\*{var}\*\*', var, clean_text, flags=re.IGNORECASE)
        
        # Prioritize content outside of <think> blocks if they exist
        search_areas = []
        think_blocks = re.findall(r'<think>.*?</think>', response, flags=re.DOTALL)
        if think_blocks:
            main_content = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
            if main_content.strip():
                search_areas.append(main_content)
        
        search_areas.append(clean_text) # Fallback to full text
        
        patterns = [
            # LaTeX fractions: x = \frac{1}{2}
            rf'{var}\s*[:=]\s*\\frac\{{\s*(-?\d+)\s*\}}\{{\s*(\d+)\s*\}}',
            # Plain fractions: x = 5/2
            rf'\b{var}\s*[:=]\s*(-?\d+)/(\d+)\b',
            # Standard assignments: x = 5, x : 5 (with lookahead to avoid cutting off fractions)
            rf'\b{var}\s*[:=]\s*(-?\d+\.?\d*)\b(?!\s*/)',
            # Text assignments: "x is 5", "x equals 5"
            rf'\b{var}\s+(?:is|equals?)\s+(-?\d+\.?\d*)\b',
            # Final numerical value catching (more flexible)
            rf'{var}\s*=\s*(-?\d+\.?\d*)',
        ]
        
        for area in search_areas:
            for i, pattern in enumerate(patterns):
                matches = re.findall(pattern, area, re.IGNORECASE | re.MULTILINE)
                if matches:
                    try:
                        if i in [0, 1]: # Fraction patterns (LaTeX or Plain)
                            num, den = matches[-1]
                            return float(num) / float(den)
                        else:
                            return float(matches[-1])
                    except (ValueError, ZeroDivisionError, IndexError):
                        continue
        
        return None
    
    def _extract_final_section(self, response: str) -> str:
        """Extract the final answer section."""
        markers = [
            r'final answer[s]?[:\s]*(.*)',
            r'solution[:\s]*(.*)',
            r'therefore[,:\s]*(.*)',
            r'root node[:\s]*(.*)',
            r'final[:\s]*(.*)',
        ]
        
        response_lower = response. lower()
        
        for marker in markers:
            match = re.search(marker, response_lower, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1)[: 500]  # Limit length
        
        # Return last 500 chars as fallback
        return response[-500:] if len(response) > 500 else response
    
    def _score_completeness(self, assignments: Dict, variables: List[str]) -> float:
        """Score based on variables solved."""
        if not variables:
            return 0
        
        found = len(assignments)
        total = len(variables)
        
        return (found / total) * 50
    
    def _score_consistency(self, response: str, assignments: Dict, variables: List[str]) -> float:
        """Score based on consistency."""
        score = 30
        
        for var in variables: 
            pattern = rf'\b{var}\s*=\s*(-?\d+\.?\d*)'
            matches = re.findall(pattern, response, re. IGNORECASE)
            
            if len(matches) > 1:
                values = set()
                for m in matches:
                    try:
                        values.add(round(float(m), 2))
                    except ValueError: 
                        pass
                
                if len(values) > 1:
                    # Check if values are actually different (not just float precision)
                    sorted_vals = sorted(list(values))
                    for idx in range(len(sorted_vals) - 1):
                        if abs(sorted_vals[idx] - sorted_vals[idx+1]) > 0.01:
                            score -= 10
                            break
        
        return max(0, score)
    
    def _score_reasoning(self, response: str) -> float:
        """Score based on reasoning quality."""
        response_lower = response. lower()
        
        # Count keywords
        keyword_count = sum(1 for kw in self.reasoning_keywords if kw in response_lower)
        
        # Check for structure
        has_steps = bool(re.search(r'(step|level|branch)\s*[1-9]', response_lower))
        has_tree = any(word in response_lower for word in ['tree', 'branch', 'node', 'level', 'merge'])
        has_verify = any(word in response_lower for word in ['verify', 'check', 'verification', 'substitute back'])
        
        score = 0
        
        if keyword_count >= 5:
            score += 8
        elif keyword_count >= 3:
            score += 5
        elif keyword_count >= 1:
            score += 2
        
        if has_steps: 
            score += 5
        
        if has_tree:
            score += 4
        
        if has_verify: 
            score += 3
        
        return min(20, score)


def quick_score(response: str, variables: List[str]) -> Tuple[int, bool]:
    """Quick scoring helper."""
    scorer = ResponseScorer()
    result = scorer.score(response, variables)
    return result["total"], result["success"]