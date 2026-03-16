---
name: resolve_application_context
description: Resolve the runtime Spring `ApplicationContext` for the current request flow. Use when users need to inspect context state, verify bean wiring, or troubleshoot environment/configuration issues in a live application.
---

# Resolve Application Context

Use this skill when the user wants to capture a Spring MVC request handling invocation and inspect its `ApplicationContext`.

## Steps

1. Run:
```bash
tt -t org.springframework.context.support.ApplicationObjectSupport getApplicationContext -n 1
```

2. After the command finishes, capture the generated `tt` record id.

3. Verify the captured invocation context by running:
```bash
tt -i <captured_id> -w 'returnObj.active'
```

4. If step 3 succeeds and returns the expected context, remind the user:
```bash
tt -i <captured_id> -w 'returnObj'
```
This command can be used directly to retrieve the application context.

