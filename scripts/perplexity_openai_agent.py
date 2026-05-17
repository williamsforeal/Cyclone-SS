"""
Run a Perplexity Sonar-backed agent through the OpenAI Agents SDK.

Setup:
  python -m pip install -r scripts/requirements-perplexity-agent.txt
  $env:PERPLEXITY_API_KEY = "pplx-..."
  python scripts/perplexity_openai_agent.py "What changed in Meta ads this week?"
"""

import asyncio
import os
import sys

from openai import AsyncOpenAI

try:
    from agents import Agent, OpenAIChatCompletionsModel, Runner, function_tool, set_tracing_disabled
except ImportError as exc:
    raise SystemExit(
        "Missing OpenAI Agents SDK. Install dependencies with:\n"
        "  python -m pip install -r scripts/requirements-perplexity-agent.txt"
    ) from exc


def load_dotenv(path: str = ".env") -> None:
    """Load simple KEY=value entries without adding a runtime dependency."""
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_dotenv()

BASE_URL = os.getenv("PERPLEXITY_BASE_URL", "https://api.perplexity.ai")
API_KEY = os.getenv("PERPLEXITY_API_KEY")
MODEL_NAME = os.getenv("PERPLEXITY_MODEL_NAME", "sonar-pro")


if not API_KEY:
    raise SystemExit(
        "Missing PERPLEXITY_API_KEY. Set it in your shell or .env before running this script."
    )


client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)
set_tracing_disabled(disabled=True)


@function_tool
def format_research_brief(topic: str, key_findings: str) -> str:
    """Format research findings into a compact ad-ops brief."""
    return (
        f"Topic: {topic}\n\n"
        "Ad-ops brief:\n"
        f"{key_findings.strip()}\n\n"
        "Next step: turn the strongest finding into a testable hook, angle, or offer."
    )


async def main() -> None:
    prompt = " ".join(sys.argv[1:]).strip()
    if not prompt:
        prompt = "Find three current ecommerce ad creative trends and summarize why they matter."

    agent = Agent(
        name="Perplexity Research Assistant",
        instructions=(
            "You are a concise ecommerce research assistant. Use current, grounded information. "
            "When useful, call format_research_brief to make the output operational for ad testing."
        ),
        model=OpenAIChatCompletionsModel(model=MODEL_NAME, openai_client=client),
        tools=[format_research_brief],
    )

    result = await Runner.run(agent, prompt)
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
