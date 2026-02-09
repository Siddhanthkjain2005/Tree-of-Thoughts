"""
Standardized experiment runner for Linear vs DET.
"""
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional
from tqdm import tqdm
import numpy as np
import concurrent.futures

from core.llm_client import get_llm_client
from core.scorer import ResponseScorer
from core import storage
from prompts.templates import get_linear_prompt, get_det_prompt
from data.equations import get_equations
from config.settings import NUM_TRIALS, RESULTS_DIR, LLM_PROVIDER, MODEL_NAME


class ExperimentRunner: 
    """
    Standardized experiment runner comparing LINEAR vs DET.
    """
    
    def __init__(self, provider: Optional[str] = None, model_name: Optional[str] = None):
        self.provider = provider or LLM_PROVIDER
        self.model_name = model_name or MODEL_NAME
        self.llm = get_llm_client(self.provider, self.model_name)
        self.scorer = ResponseScorer()
        self.session_id: Optional[int] = None
    
    def get_prompt(self, equations: List[str], method: str) -> str:
        """Get prompt based on method."""
        if method == "det": 
            return get_det_prompt(equations)
        return get_linear_prompt(equations)
    
    def run_single_trial(self, equations: List[str], variables: List[str], 
                         method: str, temperature: float = 0.7) -> Dict:
        """Run a single trial."""
        prompt = self.get_prompt(equations, method)
        response, tokens, time_taken = self.llm.generate(prompt, temperature)
        score_result = self.scorer.score(response, variables)
        
        return {
            "response": response,
            "tokens": tokens,
            "time": round(time_taken, 2),
            "score": score_result["total"],
            "completeness": score_result["completeness"],
            "consistency": score_result["consistency"],
            "reasoning": score_result["reasoning"],
            "success": score_result["success"],
            "variables_found": score_result["variables_found"],
            "assignments": score_result["assignments"]
        }
    
    def run_condition(self, size: int, method: str, num_trials: int = NUM_TRIALS) -> Dict:
        """Run all trials for one condition in parallel."""
        eq_data = get_equations(size)
        equations = eq_data["equations"]
        variables = eq_data["variables"]
        
        print(f"\n📊 Running {method.upper()} on {size}-variable system ({num_trials} trials) [Provider: {self.provider.upper()} | Model: {self.model_name}]")
        
        trials = [None] * num_trials
        
        def run_indexed_trial(idx):
            res = self.run_single_trial(equations, variables, method)
            res["trial"] = idx + 1
            return idx, res

        with concurrent.futures.ThreadPoolExecutor(max_workers=min(num_trials, 5)) as executor:
            future_to_idx = {executor.submit(run_indexed_trial, i): i for i in range(num_trials)}
            for future in tqdm(concurrent.futures.as_completed(future_to_idx), total=num_trials, desc=f"{method}_{size}var"):
                idx, trial_result = future.result()
                trials[idx] = trial_result
                
                if self.session_id:
                    storage.insert_trial(
                        session_id=self.session_id,
                        size=size,
                        method=method,
                        trial_num=idx + 1,
                        result=trial_result,
                    )
        
        scores = [t["score"] for t in trials]
        tokens = [t["tokens"] for t in trials]
        times = [t["time"] for t in trials]
        successes = [t["success"] for t in trials]
        
        stats = {
            "size": size,
            "method": method,
            "num_trials": num_trials,
            "scores": {
                "mean": round(np.mean(scores), 2),
                "std": round(np.std(scores), 2),
                "min": round(min(scores), 2),
                "max": round(max(scores), 2)
            },
            "success_rate": round(sum(successes) / len(successes) * 100, 1),
            "tokens": {
                "mean": round(np.mean(tokens), 1),
                "total": sum(tokens)
            },
            "time": {
                "mean": round(np.mean(times), 2),
                "total": round(sum(times), 2)
            },
            "trials": trials
        }
        
        if self.session_id:
            storage.insert_condition(
                session_id=self.session_id,
                size=size,
                method=method,
                stats=stats,
            )

        return stats
    
    def run_full_experiment(self, methods: List[str] = None) -> Dict:
        """Run the complete experiment."""
        if methods is None: 
            methods = ["linear", "det"]
        
        num_conditions = len(methods) * 3
        total_trials = NUM_TRIALS * num_conditions
        
        print("=" * 60)
        print("🧪 DYNAMIC EXPRESSION TREE EXPERIMENT (CONSOLIDATED)")
        print("=" * 60)

        storage.init_db()
        self.session_id = storage.create_session(
            mode="experiment",
            provider=self.provider,
            model=self.model_name,
            config={
                "trials_per_condition": NUM_TRIALS,
                "sizes": [3, 5, 7],
                "methods": methods,
            },
        )
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "config": {
                "trials_per_condition": NUM_TRIALS,
                "sizes": [3, 5, 7],
                "methods": methods,
                "provider": self.provider,
                "model": self.model_name,
                "session_id": self.session_id,
            },
            "conditions": {},
            "summary": {}
        }
        
        for size in [3, 5, 7]:
            for method in methods: 
                key = f"{method}_{size}var"
                results["conditions"][key] = self.run_condition(size, method)
        
        results["summary"] = self._calculate_summary(results["conditions"], methods)
        self._save_results(results)
        
        return results
    
    def _calculate_summary(self, conditions: Dict, methods: List[str]) -> Dict:
        """Calculate summary statistics for visualization."""
        summary = {
            "by_method": {},
            "by_size": {},
            "scaling_analysis": {},
            "efficiency": {},
            "best_method": {}
        }
        
        for method in methods:
            m_scores = []
            m_success = []
            m_tokens = []
            
            for key, data in conditions.items():
                if data["method"] == method: 
                    m_scores.append(data["scores"]["mean"])
                    m_success.append(data["success_rate"])
                    m_tokens.append(data["tokens"]["mean"])
            
            summary["by_method"][method] = {
                "avg_score": round(np.mean(m_scores), 2),
                "avg_success_rate": round(np.mean(m_success), 1),
                "avg_tokens": round(np.mean(m_tokens), 1)
            }
        
        # By Size and Scaling
        sizes = [3, 5, 7]
        linear_scores = []
        det_scores = []
        
        for size in sizes:
            lin = conditions.get(f"linear_{size}var", {})
            det = conditions.get(f"det_{size}var", {})
            
            l_score = lin.get("scores", {}).get("mean", 0)
            d_score = det.get("scores", {}).get("mean", 0)
            linear_scores.append(l_score)
            det_scores.append(d_score)
            
            summary["by_size"][f"{size}var"] = {
                "linear_score": l_score,
                "det_score": d_score,
                "linear_success": lin.get("success_rate", 0),
                "det_success": det.get("success_rate", 0),
                "det_advantage": round(d_score - l_score, 1)
            }
            
        # Scaling (Simple slopes)
        l_slope = np.polyfit(sizes, linear_scores, 1)[0]
        d_slope = np.polyfit(sizes, det_scores, 1)[0]
        
        summary["scaling_analysis"] = {
            "linear_slope": round(l_slope, 2),
            "det_slope": round(d_slope, 2),
            "interpretation": "DET scales better" if d_slope > l_slope else "Linear scales better"
        }
        
        # Efficiency
        l_total = sum(conditions.get(f"linear_{s}var", {}).get("tokens", {}).get("total", 0) for s in sizes)
        d_total = sum(conditions.get(f"det_{s}var", {}).get("tokens", {}).get("total", 0) for s in sizes)
        
        summary["efficiency"] = {
            "linear_total_tokens": l_total,
            "det_total_tokens": d_total,
            "ratio": round(d_total / l_total, 2) if l_total > 0 else 0
        }
        
        best_method = max(summary["by_method"].items(), key=lambda x: x[1]["avg_score"])
        summary["best_method"] = {
            "name": best_method[0],
            "avg_score": best_method[1]["avg_score"]
        }
        return summary
    
    def _save_results(self, results: Dict):
        """Save results to file."""
        os.makedirs(RESULTS_DIR, exist_ok=True)
        filepath = os.path.join(RESULTS_DIR, "experiment_results.json")
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n✅ Results saved to {filepath}")


def run_experiment(methods: List[str] = None, provider: str = None, model_name: str = None) -> Dict:
    """Main entry point."""
    runner = ExperimentRunner(provider=provider, model_name=model_name)
    return runner.run_full_experiment(methods)
