---
description: 'Guidelines for building safe, governed AI agent systems. Apply when writing code that uses agent frameworks, tool-calling LLMs, or multi-agent orchestration to ensure proper safety boundaries, policy enforcement, and auditability.'
applyTo: '**'
---

# Agent Safety & Governance

## Core Principles

- **Fail closed**: If a governance check errors or is ambiguous, deny the action rather than allowing it
- **Policy as configuration**: Define governance rules in YAML/JSON files, not hardcoded in application logic
- **Least privilege**: Agents should have the minimum tool access needed for their task
- **Append-only audit**: Never modify or delete audit trail entries — immutability enables compliance
- **Policy load integrity**: If a policy file fails to load or validate against the schema, refuse to start the agent rather than falling back to a default permissive policy

## Tool Access Controls

- Always define an explicit allowlist of tools an agent can use — never give unrestricted tool access
- Separate tool registration from tool authorization — the framework knows what tools exist, the policy controls which are allowed
- Use blocklists for known-dangerous operations (shell execution, file deletion, database DDL)
- Require human-in-the-loop approval for high-impact tools — defined as any tool that (a) writes to external systems, (b) modifies persistent state, or (c) incurs cost; mark such tools with `requires_approval: true` in the policy. If approval is rejected or times out (default 5 minutes), return a denial to the agent with a structured reason so it can choose an alternative path or terminate cleanly.
- Enforce rate limits on tool calls per request to prevent infinite loops and resource exhaustion. When the rate limit is exceeded, return a terminal error to the agent loop and end the session; do not allow the agent to retry or recover, since exceeding the limit indicates a loop or runaway behavior.

## Content Safety

- Scan all user inputs for threat signals before passing to the agent (data exfiltration, prompt injection, privilege escalation)
- Filter agent arguments for sensitive patterns: API keys, credentials, PII, SQL injection. When sensitive patterns are detected, deny the call and emit a violation event — do not attempt to auto-redact and proceed, since silent redaction can produce incorrect tool behavior.
- Use regex pattern lists that can be updated without code changes
- Check both the user's original prompt AND the agent's generated tool arguments

## Multi-Agent Safety

- Each agent in a multi-agent system should have its own governance policy
- When agents delegate to other agents, compose policies by: (1) intersecting allowed_tools, (2) unioning blocked_patterns, (3) taking min(max_calls_per_request), (4) unioning required-approval tools
- Track trust scores for agent delegates using a concrete formula: initial trust = 1.0; on governance violation, trust *= 0.5; on successful call, trust = min(1.0, trust + 0.05); block delegation when trust < 0.3
- Never allow an inner agent to have broader permissions than the outer agent that called it

## Audit & Observability

- Log every tool call with: timestamp, agent ID, tool name, allow/deny decision, policy name
- Log every governance violation with the matched rule, violation type, and metadata identifiers — do not log raw prompt content or tool argument values
- Export audit trails in JSON Lines format for integration with log aggregation systems
- Include session boundaries (start/end) in audit logs for correlation
- If the audit log write fails, fail closed and deny the tool call — auditability is a precondition for execution

## Code Patterns

When writing agent tool functions:
```python
# Good: Governed tool with explicit policy
@govern(policy)
async def search(query: str) -> str:
    ...

# Bad: Unprotected tool with no governance
async def search(query: str) -> str:
    ...
```

When defining policies:
```yaml
# Good: Explicit allowlist, content filters, rate limit
name: my-agent
allowed_tools: [search, summarize]
blocked_patterns: ["(?i)(api_key|password)\\s*[:=]"]
max_calls_per_request: 25

# Bad: No restrictions
name: my-agent
allowed_tools: ["*"]
```

When composing multi-agent policies:
```python
# Good: Most-restrictive-wins composition
final_policy = compose_policies(org_policy, team_policy, agent_policy)

# Bad: Only using agent-level policy, ignoring org constraints
final_policy = agent_policy
```

## Framework-Specific Notes

- **PydanticAI**: Use `@agent.tool` with a governance decorator wrapper. PydanticAI's upcoming Traits feature is designed for this pattern.
- **CrewAI**: Apply governance at the Crew level to cover all agents. Use `before_kickoff` callbacks for policy validation.
- **OpenAI Agents SDK**: Wrap `@function_tool` with governance. Use handoff guards for multi-agent trust.
- **LangChain/LangGraph**: Use `RunnableBinding` or tool wrappers for governance. Apply at the graph edge level for flow control.
- **AutoGen**: Implement governance in the `ConversableAgent.register_for_execution` hook.

## Common Mistakes

- Relying only on output guardrails (post-generation) instead of pre-execution governance
- Hardcoding policy rules instead of loading from configuration
- Allowing agents to self-modify their own governance policies
- Forgetting to governance-check tool *arguments*, not just tool *names*
- Not decaying trust scores over time — stale trust is dangerous
- Logging raw prompt content or tool argument values in audit trails — log the matched rule, violation type, and metadata identifiers only; inspecting content for safety checks is required, but raw content must not be persisted to the audit log
