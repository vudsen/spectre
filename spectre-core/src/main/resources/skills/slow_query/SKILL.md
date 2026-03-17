---
name: slow_query
description: Diagnose slow API/database query paths with Arthas trace. Use when users report high latency, timeout, or intermittent slow responses and need to locate the most time-consuming method path from an entry method to likely downstream bottlenecks.
nameI18nKey: skill.slow.query
descriptionI18nKey: skill.slow.query.desc
---

# Slow Query Diagnosis Workflow
## Goal

Determine whether the given entry method is actually slow, then drill down along the highest-cost call path to locate the likely bottleneck.

## 1. Confirm the Query Entry Point

Use the provided entry class and method directly. Do not request extra information unless entry point is missing.

## 2. Trace the Entry Method

Run:

```
trace <class> <method> -n 2 '#cost > 3000' --skipJDKMethod true
```

Notes:

- `3000` ms is the initial threshold.
- If timeout or no hit appears, treat it as no invocation above the current threshold.
- Lower threshold and retry.
- Never use threshold below `500` ms.

## 3. Retry Strategy

For entry method tracing, allow at most 4 attempts.

Use binary-search style narrowing:

- Start at `3000`
- If no hit, lower threshold toward `500`
- If hit, optionally raise threshold to isolate slower calls
- Keep adjustments fast and bounded

If no slow invocation is found after 4 attempts, stop the workflow and tell the user:

`This method currently appears normal, and there is no sign of slow calls.`

## 4. Continue Deeper Tracing

If entry method is slow, continue top-down drilling:

- Pick the highest-cost downstream method in current trace output
- Trace that method next with a reasonable threshold inferred from current cost
- Repeat for at most 3 deeper levels

Before each deeper trace, state:

- what method is currently hottest
- observed cost
- why it is chosen as next target

## 5. Communication Rules

During the investigation:

- Report each finding before issuing the next trace
- Keep focus on highest-cost path only
- Stop after 3 deeper levels even if deeper calls exist

## 6. Expected Outcome

Final output must include:

- whether entry method is slow
- slowest downstream method chain discovered
- likely bottleneck location (class/method)
- actionable next inspection point (SQL call site, RPC, cache miss path, lock/wait)
