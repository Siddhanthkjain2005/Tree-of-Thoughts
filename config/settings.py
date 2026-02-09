import os
from dotenv import load_dotenv

load_dotenv()

# API + provider config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

# Provider: "groq" (Groq-hosted Llama) or "ollama" (local Ollama with cloud-tagged models)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")

# Preset lists per provider (for help/validation)
GROQ_MODEL_PRESETS = [
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
]

OLLAMA_MODEL_PRESETS = [
    "deepseek-v3.1:671b-cloud",
    "qwen3-coder:480b-cloud",
    "gpt-oss:120b-cloud",

]

# Model names can be overridden via env so CLI can switch at runtime
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", GROQ_MODEL_PRESETS[1])
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", OLLAMA_MODEL_PRESETS[0])

if LLM_PROVIDER == "groq":
    MODEL_NAME = GROQ_MODEL_NAME
else:
    MODEL_NAME = OLLAMA_MODEL_NAME

NUM_TRIALS = 5
TEMPERATURE = 0.7
MAX_TOKENS = 25000
API_DELAY_SECONDS = 0.05
MAX_RETRIES = 3

RESULTS_DIR = "data/results"
RESULTS_DB_PATH = os.getenv("RESULTS_DB_PATH", os.path.join(RESULTS_DIR, "experiments.db"))
LINEAR_RESULTS_FILE = "data/results/linear_results.json"
DET_RESULTS_FILE = "data/results/det_results.json"
COMPARISON_FILE = "data/results/comparison.json"

# Quick env hints:
#   LLM_PROVIDER=groq   GROQ_MODEL_NAME=llama-3.1-70b-versatile
#   LLM_PROVIDER=ollama OLLAMA_MODEL_NAME=deepseek-v3.1:671b-cloud
