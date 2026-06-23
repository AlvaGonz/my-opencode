"""
EvoAgentX — Workflow Runner
=============================
Core 4-Step Pattern:
  1. Initialize LLM
  2. Generate Workflow Graph
  3. Instantiate Agents
  4. Execute Workflow

Usage:
  python -m src.workflow_runner
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Ensure src/ is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from evoagentx.workflow import WorkFlowGenerator, WorkFlowGraph, WorkFlow
from evoagentx.agents import AgentManager
from llm_config import get_llm

# ── PROJECT CONFIG ───────────────────────────────────────────────
GOAL = os.getenv("GOAL", "Analyze a dataset and generate a summary report")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "outputs")
SRC_DIR = os.getenv("SRC_DIR", "src")
REQUIRES_TOOLS = os.getenv("REQUIRES_TOOLS", "false").lower() == "true"
REQUIRES_HITL = os.getenv("REQUIRES_HITL", "false").lower() == "true"
REQUIRES_OPTIMIZER = os.getenv("REQUIRES_OPTIMIZER", "false").lower() == "true"

os.makedirs(OUTPUT_DIR, exist_ok=True)


def main():
    print("╔══════════════════════════════════════════════════╗")
    print("║        EvoAgentX — Workflow Runner v0.1          ║")
    print("╠══════════════════════════════════════════════════╣")
    print(f"║  GOAL:      {GOAL[:72]:72s} ║")
    print(f"║  Provider:  {os.getenv('LLM_PROVIDER', 'openai'):16s}           ║")
    print(f"║  Model:     {os.getenv('DEFAULT_MODEL', 'gpt-4o-mini'):16s}           ║")
    print("╚══════════════════════════════════════════════════╝")
    print()

    # ── STEP 0: Validate environment ────────────────────────────
    if not os.getenv("OPENAI_API_KEY"):
        print("[WARN] OPENAI_API_KEY not set. Set it in .env or use LLM_PROVIDER=litellm.")
        print()

    # ── STEP 1: Initialize LLM ──────────────────────────────────
    print("[1/4] Initializing LLM ...")
    llm, llm_config = get_llm()
    print(f"  ✓ LLM ready: {type(llm).__name__}")
    print()

    # ── STEP 2: Generate Workflow Graph ─────────────────────────
    print("[2/4] Generating workflow graph from goal ...")
    generator = WorkFlowGenerator()
    workflow_graph: WorkFlowGraph = generator.generate_workflow(goal=GOAL)

    print(f"  ✓ Workflow graph generated")
    print(f"  • Nodes: {len(workflow_graph.nodes) if hasattr(workflow_graph, 'nodes') else 'N/A'}")
    print(f"  • Edges: {len(workflow_graph.edges) if hasattr(workflow_graph, 'edges') else 'N/A'}")

    # Visualize
    try:
        workflow_graph.display()
        print("  ✓ Graph visualization displayed")
    except Exception as e:
        print(f"  ⚠ Graph display skipped ({e})")

    # Persist
    graph_path = os.path.join(OUTPUT_DIR, "workflow_graph.json")
    workflow_graph.save_module(path=graph_path)
    print(f"  ✓ Graph saved to {graph_path}")
    print()

    # ── STEP 3: Instantiate Agents ──────────────────────────────
    print("[3/4] Instantiating agents ...")
    agent_manager = AgentManager()
    agent_manager.add_agents_from_workflow(
        workflow_graph=workflow_graph,
        llm_config=llm_config,
    )
    print(f"  ✓ Agents instantiated")
    print(f"  • Agents: {agent_manager.size() if hasattr(agent_manager, 'size') else 'N/A'}")
    print()

    # ── STEP 3b: HITL Approval Gate (optional) ─────────────────
    if REQUIRES_HITL:
        print("[3b] Adding HITL approval gate ...")
        from evoagentx.hitl import (
            HITLManager,
            HITLInterceptorAgent,
            HITLMode,
            HITLInteractionType,
        )

        hitl_manager = HITLManager()
        # Find the last agent in the graph to attach HITL gate
        agent_names = agent_manager.list_agents() if hasattr(agent_manager, 'list_agents') else []
        target_agent = agent_names[-1] if agent_names else None

        if target_agent:
            hitl_agent = HITLInterceptorAgent(
                target_agent_name=target_agent,
                target_action_name="execute",
                name="HITL_Gate",
                interaction_type=HITLInteractionType.APPROVE_REJECT,
                mode=HITLMode.PRE_EXECUTION,
            )
            # Wire into the workflow graph
            workflow_graph.add_node(hitl_agent)
            print(f"  ✓ HITL gate attached before agent: {target_agent}")
        else:
            print("  ⚠ No agents found to attach HITL gate")
        print()

    # ── STEP 4: Execute Workflow ────────────────────────────────
    print("[4/4] Executing workflow ...")
    workflow = WorkFlow(
        graph=workflow_graph,
        agent_manager=agent_manager,
        llm=llm,
    )
    result = workflow.execute()
    print()

    # ── OUTPUT ──────────────────────────────────────────────────
    print("═══ WORKFLOW OUTPUT ═══════════════════════════════════")
    print(result)
    print("═══════════════════════════════════════════════════════")

    # ── STEP 5: Optimizer (optional) ────────────────────────────
    if REQUIRES_OPTIMIZER:
        print()
        print("[5/4] Running TextGrad optimizer ...")
        try:
            from evoagentx.optimizers import TextGradOptimizer

            optimizer = TextGradOptimizer(workflow=workflow, llm=llm)
            optimizer.optimize(epochs=3)
            print("  ✓ Optimization complete")
        except Exception as e:
            print(f"  ⚠ Optimization skipped ({e})")

    print()
    print("✓ Workflow run complete.")


if __name__ == "__main__":
    main()
