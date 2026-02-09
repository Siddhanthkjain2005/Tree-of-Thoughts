"""
Analysis and visualization of results.
"""
import json
import os
import numpy as np
import matplotlib.pyplot as plt
from config.settings import RESULTS_DIR


def load_results() -> dict:
    """Load experiment results."""
    filepath = os.path.join(RESULTS_DIR, "experiment_results.json")
    with open(filepath, 'r') as f:
        return json.load(f)


def print_summary(results: dict):
    """Print summary statistics."""
    from config.settings import LLM_PROVIDER

    provider = results.get("config", {}).get("provider", LLM_PROVIDER).upper()
    model = results.get("config", {}).get("model", "n/a")

    print("\n" + "=" * 70)
    print(f"📊 EXPERIMENT RESULTS SUMMARY ({provider} | {model})")
    print("=" * 70)

    summary = results["summary"]

    # By Method
    print("\n📈 OVERALL BY METHOD:")
    print("-" * 50)
    for method, stats in summary["by_method"].items():
        avg_score = stats["avg_score"]
        avg_success = stats["avg_success_rate"]
        avg_tokens = stats["avg_tokens"]
        print(
            f"  {method.upper():10} | Score: {avg_score:5.1f} | "
            f"Success: {avg_success:5.1f}% | Tokens: {avg_tokens:7.1f}"
        )

    # By Size
    print("\n📏 PERFORMANCE BY PROBLEM SIZE:")
    print("-" * 65)
    print(f"  {'Size':<10} | {'Linear':^15} | {'DET':^15} | {'DET Advantage':^14}")
    print("-" * 65)
    for size, stats in summary["by_size"].items():
        adv = stats["det_advantage"]
        adv_str = f"+{adv:.1f}" if adv > 0 else f"{adv:.1f}"
        linear_score = stats["linear_score"]
        det_score = stats["det_score"]
        print(
            f"  {size:<10} | {linear_score:^15.1f} | "
            f"{det_score:^15.1f} | {adv_str:^14}"
        )

    # Scaling
    print("\n📉 SCALING ANALYSIS:")
    print("-" * 50)
    scaling = summary["scaling_analysis"]
    print(f"  Linear slope: {scaling['linear_slope']}")
    print(f"  DET slope:     {scaling['det_slope']}")
    print(f"  --> {scaling['interpretation']}")

    # Efficiency
    print("\n⚡ TOKEN EFFICIENCY:")
    print("-" * 50)
    eff = summary["efficiency"]
    print(f"  Linear total tokens: {eff['linear_total_tokens']}")
    print(f"  DET total tokens:    {eff['det_total_tokens']}")
    print(f"  Ratio (DET/Linear):  {eff['ratio']:.2f}x")

    # Key Findings
    print("\n" + "=" * 70)
    print("🎯 KEY FINDINGS")
    print("=" * 70)

    linear_avg = summary["by_method"]["linear"]["avg_score"]
    det_avg = summary["by_method"]["det"]["avg_score"]
    diff = det_avg - linear_avg

    if diff > 0:
        print(f"\n✅ DET outperforms Linear by {diff:.1f} points on average!")
    else:
        print(f"\n📊 Linear outperforms DET by {abs(diff):.1f} points on average")

    print("\n📈 DET advantage by complexity:")
    for size, stats in summary["by_size"].items():
        adv = stats["det_advantage"]
        symbol = "✅" if adv > 0 else "❌"
        sign = "+" if adv > 0 else ""
        print(f"   {symbol} {size}: {sign}{adv:.1f} points")

    print("\n" + "=" * 70)


def create_visualizations(results: dict):
    """Create comparison charts."""

    os.makedirs(RESULTS_DIR, exist_ok=True)

    conditions = results["conditions"]
    methods = results.get("config", {}).get("methods", ["linear", "det"])
    sizes = [3, 5, 7]

    det_methods = [m for m in methods if m.startswith("det")]
    preferred_det = "det" if "det" in det_methods else (det_methods[0] if det_methods else None)

    # Extract data
    linear_scores = [conditions[f"linear_{s}var"]["scores"]["mean"] for s in sizes]
    if preferred_det:
        det_scores = [conditions[f"{preferred_det}_{s}var"]["scores"]["mean"] for s in sizes]
        det_success = [conditions[f"{preferred_det}_{s}var"]["success_rate"] for s in sizes]
    else:
        det_scores = [0 for _ in sizes]
        det_success = [0 for _ in sizes]
    linear_success = [conditions[f"linear_{s}var"]["success_rate"] for s in sizes]

    # Create figure
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle("Linear vs DET: Performance Comparison", fontsize=14, fontweight="bold")

    x = np.arange(len(sizes))
    width = 0.35

    # Chart 1: Scores
    axes[0].bar(x - width / 2, linear_scores, width, label="Linear")
    axes[0].bar(x + width / 2, det_scores, width, label="DET")
    axes[0].set_ylabel("Average Score")
    axes[0].set_xlabel("Problem Size (variables)")
    axes[0].set_title("Score by Problem Size")
    axes[0].set_xticks(x)
    axes[0].set_xticklabels([f"{s}-var" for s in sizes])
    axes[0].legend()
    axes[0].set_ylim(0, 100)
    axes[0].grid(axis="y", alpha=0.3)

    # Chart 2: Success Rate
    axes[1].bar(x - width / 2, linear_success, width, label="Linear")
    axes[1].bar(x + width / 2, det_success, width, label="DET")
    axes[1].set_ylabel("Success Rate (%)")
    axes[1].set_xlabel("Problem Size (variables)")
    axes[1].set_title("Success Rate by Problem Size")
    axes[1].set_xticks(x)
    axes[1].set_xticklabels([f"{s}-var" for s in sizes])
    axes[1].legend()
    axes[1].set_ylim(0, 100)
    axes[1].grid(axis="y", alpha=0.3)

    # Chart 3: Scaling
    axes[2].plot(sizes, linear_scores, "o-", label="Linear", linewidth=2)
    axes[2].plot(sizes, det_scores, "s-", label="DET", linewidth=2)
    axes[2].set_ylabel("Average Score")
    axes[2].set_xlabel("Problem Size (variables)")
    axes[2].set_title("Scaling Behavior")
    axes[2].legend()
    axes[2].set_ylim(0, 100)
    axes[2].grid(True, alpha=0.3)
    axes[2].set_xticks(sizes)

    plt.tight_layout()

    filepath = os.path.join(RESULTS_DIR, "comparison_charts.png")
    plt.savefig(filepath, dpi=150, bbox_inches="tight")
    print(f"\n📊 Charts saved to {filepath}")

    plt.close()


def analyze():
    """Run full analysis."""
    results = load_results()
    print_summary(results)
    create_visualizations(results)


if __name__ == "__main__":
    analyze()
