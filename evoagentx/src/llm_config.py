"""
EvoAgentX — LLM Bootstrap Factory
===================================
Returns (llm_instance, llm_config) tuple based on LLM_PROVIDER.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (parent of src/)
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def get_llm(model_name: str = None, stream: bool = True, output_response: bool = True):
    """
    Create LLM instance + config based on LLM_PROVIDER env var.

    Parameters
    ----------
    model_name : str, optional
        Override DEFAULT_MODEL from .env.
    stream : bool, default=True
        Enable streaming responses.
    output_response : bool, default=True
        Print response to stdout.

    Returns
    -------
    tuple : (llm_instance, llm_config)
    """
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    model = model_name or os.getenv("DEFAULT_MODEL", "gpt-4o-mini")

    # ── OpenAI ────────────────────────────────────────────────────
    if provider == "openai":
        from evoagentx.models import OpenAILLMConfig, OpenAILLM

        config = OpenAILLMConfig(
            model=model,
            openai_key=os.getenv("OPENAI_API_KEY"),
            stream=stream,
            output_response=output_response,
        )
        return OpenAILLM(config=config), config

    # ── LiteLLM ──────────────────────────────────────────────────
    elif provider == "litellm":
        from evoagentx.models import LiteLLMConfig, LiteLLM

        config = LiteLLMConfig(
            model=model,
            stream=stream,
            groq_key=os.getenv("GROQ_API_KEY"),
            openai_key=os.getenv("OPENAI_API_KEY"),
        )
        return LiteLLM(config=config), config

    # ── OpenRouter ───────────────────────────────────────────────
    elif provider == "openrouter":
        from evoagentx.models import OpenRouterConfig, OpenRouterModel

        config = OpenRouterConfig(
            model=model,
            api_key=os.getenv("OPENROUTER_API_KEY"),
            stream=stream,
        )
        return OpenRouterModel(config=config), config

    # ── SiliconFlow ─────────────────────────────────────────────
    elif provider == "siliconflow":
        from evoagentx.models import SiliconFlowConfig, SiliconFlowModel

        config = SiliconFlowConfig(
            model=model,
            api_key=os.getenv("SILICONFLOW_API_KEY"),
            stream=stream,
        )
        return SiliconFlowModel(config=config), config

    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER: '{provider}'. "
            f"Expected one of: openai, litellm, openrouter, siliconflow"
        )
