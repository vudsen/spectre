# CPU Spike Diagnosis

When troubleshooting CPU spikes on a production JVM:
1. Start with `dashboard` to verify process load and thread count.
2. Use `thread -n 10` to identify top CPU threads.
3. Use `thread <id>` for stack trace details of hot threads.
4. If needed, use `trace` or `profiler start/stop` carefully and summarize findings.
5. Prefer safe, read-only commands unless the user explicitly requests risky actions.
