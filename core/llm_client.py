"""
Multi-modal LLM Client supporting Groq Cloud and local Ollama.
"""
from groq import Groq
from openai import OpenAI
import time
from typing import Tuple
from config.settings import (
    GROQ_API_KEY,
    OLLAMA_BASE_URL,
    LLM_PROVIDER,
    MODEL_NAME,
    MAX_RETRIES,
    API_DELAY_SECONDS,
    TEMPERATURE,
    MAX_TOKENS,
)


class LLMClient:
    """Multi-provider API client with usage tracking."""
    
    def __init__(self, provider: str | None = None, model_name: str | None = None):
        # Allow override at call-site; fall back to settings
        self.provider = provider or LLM_PROVIDER
        self.model_name = model_name or MODEL_NAME

        if self.provider == "groq":
            self.client = Groq(api_key=GROQ_API_KEY)
        elif self.provider == "ollama":
            # Ollama provides an OpenAI-compatible API
            self.client = OpenAI(
                api_key="ollama",  # Dummy key required by the client
                base_url=OLLAMA_BASE_URL,
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
            
        self.total_requests = 0
        self.total_tokens = 0
        self.last_request_time = 0
    
    def generate(self, prompt: str, temperature: float = TEMPERATURE) -> Tuple[str, int, float]:
        """
        Generate response and return (text, tokens_used, time_taken).
        """
        # Rate limiting
        elapsed = time.time() - self.last_request_time
        if elapsed < API_DELAY_SECONDS:
            time.sleep(API_DELAY_SECONDS - elapsed)
        
        start_time = time.time()
        
        for attempt in range(MAX_RETRIES):
            try: 
                self.last_request_time = time.time()
                
                if self.provider == "groq":
                    response = self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=temperature,
                        max_tokens=MAX_TOKENS,
                    )
                    text = response.choices[0].message.content if response.choices else ""
                    tokens = response.usage.total_tokens if response.usage else 0
                
                elif self.provider == "ollama":
                    # Ollama uses the same OpenAI-compatible interface
                    response = self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=temperature,
                        max_tokens=MAX_TOKENS,
                    )
                    text = response.choices[0].message.content if response.choices else ""
                    tokens = response.usage.total_tokens if response.usage else 0

                self.total_requests += 1
                self.total_tokens += tokens
                time_taken = time.time() - start_time
                
                return text, tokens, time_taken
                
            except Exception as e:
                error_str = str(e).lower()
                if "insufficient_quota" in error_str or "check your plan and billing" in error_str:
                    print(f"\n❌ Permanent Quota Error ({self.provider}): Your OpenAI account balance is likely $0. Please add credits at https://platform.openai.com/settings/organization/billing")
                    raise e
                
                if "429" in error_str or "resource_exhausted" in error_str or "quota" in error_str:
                    wait_time = 15 * (attempt + 1)
                    print(f"⏳ Rate limited ({self.provider}). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                elif attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise Exception(f"Failed after {MAX_RETRIES} attempts ({self.provider}): {e}")
        
        return "", 0, 0.0
    
    def get_stats(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "total_tokens": self.total_tokens,
            "model": self.model_name,
            "provider": self.provider
        }


_client_instance: LLMClient | None = None

def get_llm_client(provider: str | None = None, model_name: str | None = None) -> LLMClient:
    """Singleton-style accessor with optional override for provider/model.

    If overrides are supplied, a new client is created each call to avoid
    cross-contamination of stats between different models/providers.
    """
    global _client_instance

    if provider or model_name:
        return LLMClient(provider=provider, model_name=model_name)

    if _client_instance is None:
        _client_instance = LLMClient()
    return _client_instance
