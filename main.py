"""
DET Linear Solver - Main Entry Point (Consolidated)

Usage: 
    python3 main.py --mode demo --provider ollama --model deepseek-v3.1:671b-cloud
    python3 main.py --mode experiment --provider ollama --model deepseek-v3.1:671b-cloud
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import (
    LLM_PROVIDER,
    MODEL_NAME,
    GROQ_MODEL_PRESETS,
    OLLAMA_MODEL_PRESETS,
)

def test_connection(provider: str, model: str):
    """Test API connection."""
    print("=" * 60)
    print("🔌 TESTING API CONNECTION")
    print("=" * 60)

    try:
        from core.llm_client import get_llm_client
        from core import storage

        print(f"\n🔄 Connecting to {provider.capitalize()} API (model: {model})...")
        client = get_llm_client(provider, model)

        response, tokens, time_taken = client.generate(
            "Say 'API working!' and nothing else."
        )

        print(f"✅ Response: {response.strip()}")
        print(f"   Tokens: {tokens}")
        print(f"   Time: {time_taken:.2f}s")
        print("\n✅ API connection successful!")

        # Store in DB
        storage.init_db()
        session_id = storage.create_session(
            mode="test", provider=provider, model=model, config={"prompt": "connection"}
        )
        storage.insert_trial(
            session_id=session_id,
            size=None,
            method="ping",
            trial_num=1,
            result={
                "score": None,
                "completeness": None,
                "consistency": None,
                "reasoning": None,
                "success": True,
                "tokens": tokens,
                "time": time_taken,
                "response": response.strip(),
                "variables_found": None,
                "assignments": None,
            },
        )

    except Exception as e:
        print(f"\n❌ Error: {e}")


def run_demo(provider: str, model: str):
    """Run a quick demo comparing LINEAR vs DET."""
    print("=" * 60)
    print("🎯 DEMO: Linear vs Consolidated DET Comparison")
    print("=" * 60)

    from core.llm_client import get_llm_client
    from core.scorer import ResponseScorer
    from core import storage
    from prompts.templates import get_linear_prompt, get_det_prompt
    from data.equations import get_equations

    llm = get_llm_client(provider, model)
    scorer = ResponseScorer()

    storage.init_db()
    session_id = storage.create_session(
        mode="demo",
        provider=provider,
        model=model,
        config={"size": 3, "methods": ["linear", "det"]},
    )

    eq_data = get_equations(3)
    equations = eq_data["equations"]
    variables = eq_data["variables"]

    print("\n📋 Equations:")
    for eq in equations:
        print(f"   {eq}")

    methods = [
        ("linear", "LINEAR", get_linear_prompt),
        ("det", "DET (Standard)", get_det_prompt),
    ]

    results = []

    for method_key, name, prompt_fn in methods:
        print(f"\n{'─' * 50}")
        print(f"📝 {name}:")
        print("─" * 50)

        prompt = prompt_fn(equations)
        response, tokens, time_taken = llm.generate(prompt)
        score_result = scorer.score(response, variables)

        print(f"Response preview: {response[:300]}...")

        total_score = score_result["total"]
        is_success = score_result["success"]
        status = "✅" if is_success else "❌"

        print(f"\n📊 Score: {total_score:.1f}/100 ({status})")
        print(f"   Tokens: {tokens} | Time: {time_taken:.2f}s")

        results.append((name, total_score, is_success))

        storage.insert_trial(
            session_id=session_id,
            size=3,
            method=method_key,
            trial_num=len(results),
            result={
                "score": total_score,
                "completeness": score_result["completeness"],
                "consistency": score_result["consistency"],
                "reasoning": score_result["reasoning"],
                "success": is_success,
                "tokens": tokens,
                "time": time_taken,
                "response": response[:500],
                "variables_found": score_result["variables_found"],
                "assignments": score_result["assignments"],
            },
        )

    # Summary
    print("\n" + "=" * 50)
    print("📊 DEMO SUMMARY")
    print("=" * 50)

    for name, score, success in results:
        status = "✅" if success else "❌"
        print(f"  {name:<12}: {score:5.1f}/100 {status}")


def run_full_experiment(methods=None, provider=None, model_name=None):
    """Run the full experiment comparing Linear vs DET."""
    from core.experiment import run_experiment
    from analysis.visualize import print_summary, create_visualizations

    if methods is None:
        methods = ["linear", "det"]

    results = run_experiment(methods, provider=provider, model_name=model_name)
    print_summary(results)
    create_visualizations(results)


def analyze_results():
    """Analyze existing results."""
    from analysis.visualize import analyze
    analyze()


def main():
    parser = argparse.ArgumentParser(
        description="DET Linear Solver - Dynamic Expression Tree Consolidation"
    )
    parser.add_argument(
        "--mode",
        choices=["test", "demo", "experiment", "analyze"],
        default="demo",
        help="Execution mode",
    )
    parser.add_argument(
        "--provider",
        choices=["groq", "ollama"],
        default=LLM_PROVIDER,
        help="LLM provider to use",
    )
    parser.add_argument(
        "--model",
        default=MODEL_NAME,
        help="Model name.",
    )

    args = parser.parse_args()

    if args.mode == "test":
        test_connection(args.provider, args.model)
    elif args.mode == "demo":
        run_demo(args.provider, args.model)
    elif args.mode == "experiment":
        run_full_experiment(provider=args.provider, model_name=args.model)
    elif args.mode == "analyze":
        analyze_results()


if __name__ == "__main__":
    main()
