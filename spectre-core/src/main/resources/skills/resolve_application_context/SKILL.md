---
name: resolve_application_context
description: Resolve the runtime Spring `ApplicationContext` for the current request flow. Use when users need to inspect context state, verify bean wiring, or troubleshoot environment/configuration issues in a live application.
nameI18nKey: skill.resolve.application.context
descriptionI18nKey: skill.resolve.application.context.desc
---

# Resolve Application Context

Use this skill when the user wants to capture a Spring MVC request handling invocation and inspect its `ApplicationContext`.

## Output Policy (Strict)

- Treat `vmtool -a getInstances --className org.springframework.context.ApplicationContext --express 'instances[0]'` and `tt -i <captured_id> -w 'returnObj'` as **user-run commands only**.
- **Never execute** the two commands above.
- After validation succeeds, only remind the user with plain text like: "Run the following command yourself:" and then show the command.
- If you accidentally executed one of those commands, stop and do not run it again.

You should try one of the following method.

## Method 1

Run: 

```
vmtool -a getInstances --className org.springframework.context.ApplicationContext --express 'instances[0].active'
```

If succeeds returns the expected value, remind the user (do not execute):

```
vmtool -a getInstances --className org.springframework.context.ApplicationContext --express 'instances[0]'
```

This command can be used directly to retrieve the application context.

## Method 2

1. Run:
```bash
tt -t org.springframework.context.support.ApplicationObjectSupport getApplicationContext -n 1
```

2. After the command finishes, capture the generated `tt` record id.

3. Verify the captured invocation context by running:
```bash
tt -i <captured_id> -w 'returnObj.active'
```

4. If step 3 succeeds and returns the expected context, remind the user (do not execute):
```bash
tt -i <captured_id> -w 'returnObj'
```
This command can be used directly to retrieve the application context.
