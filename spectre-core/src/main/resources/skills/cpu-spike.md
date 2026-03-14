---
name: cpu_spike_diagnosis
description: Troubleshooting high CPU usage issues
---
# CPU Spike Diagnosis

When troubleshooting CPU spikes on a production JVM:
1. Use `thread -n 10` to identify top CPU threads.
2. Use `thread <id>` for stack trace details of hot threads.
3. Use `trace` carefully and summarize findings.
