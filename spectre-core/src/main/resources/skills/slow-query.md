---
name: slow_query
description: Find the cause of slow API queries
---

# Slow Query Troubleshooting
## Goal

Identify whether a specified entry method contains a slow query, and if so, progressively trace into the most time-consuming call path.

## 1. Confirm the Query Entry Point

First, determine the entry class and method of the query to investigate.

Do not ask for any extra information unless the skill explicitly requires it. If the entry class and method are already known, proceed directly to tracing.

## 2. Trace the Entry Method

Once the entry method is confirmed, use:

```
trace <class> <method> -n 2 '#cost > 3000' --skipJDKMethod true
```

Notes:

- 3000 is only an initial reference threshold in milliseconds.
- If the tool call times out or produces no matching result, treat it as a sign that the current invocation cost likely does not exceed `3000` ms.
- In that case, retry with a smaller threshold.
- The minimum allowed threshold is `500`.

## 3. Retry Strategy

You may trace at most 4 times for the entry method.

Use a binary search style strategy to quickly find a reasonable threshold:

- Start from `3000`
- If no result is found, lower the threshold
- Continue narrowing until a useful value is found, but never go below 500

If no slow invocation is found after 4 attempts, stop the workflow and tell the user:

`This method currently appears normal, and there is no sign of slow calls.`

## 4. Continue Deeper Tracing

If the trace result confirms that the entry method is indeed slow, continue the investigation based on the trace output:

- Find the method with the highest cost in the current trace result
- Trace into that method next
- Repeat this process for up to 3 levels

Before each deeper trace, clearly tell the user what you found and why you are tracing the next method.

## 5. Communication Rules

During the investigation:

- Be explicit about the current finding before each next trace
- Focus on the most time-consuming method at each step
- Stop after 3 deeper tracing rounds, even if more depth is possible

## 6. Expected Outcome

The final result should help the user identify:

- whether the entry method is actually slow
- which downstream method contributes the most latency
- the likely location of the slow query problem