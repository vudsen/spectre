---
name: cpu_spike_diagnosis
description: Diagnose Java application CPU spikes with Arthas. Use when users report high CPU, load average spikes, container throttling, or unstable response time suspected to be CPU-bound. Identify hottest threads, map stack frames to business classes, and guide focused decompilation with `jad` for code-level inspection.
---

# CPU Spike Diagnosis Workflow

## Goal

Find whether the process currently has abnormal hot threads and quickly narrow to suspicious business code lines.

## 1. Capture Hottest Threads

Before running a sampling command, tell the user:
`This command may take some time. Please be patient.`

Run:

```bash
thread -n 3 -i 1000
```

Then evaluate:

- If top threads do not show clear abnormal CPU usage, reply:
  `No abnormal threads found. You can try using thread -n 3 -i 5000 for further observation.`
- Stop after the normal result message.
- If one or more threads are clearly hot, continue.

## 2. Locate the Suspicious Execution Frame

From the hottest thread stack:

- Start from the top stack frames and locate the first business-method frame.
- Ignore obvious framework/JDK frames when possible.
- Extract:
  - fully qualified class name
  - method name
  - line number (if present)

## 3. Guide Decompilation

Ask the user to inspect the class with:

```bash
jad <fully.qualified.ClassName>
```

Then explicitly tell the user:

- which method is suspicious
- which line (or nearby region) to focus on first
- why this frame is likely related to CPU spike (loop, lock contention, heavy serialization, frequent retries, etc.)

## 4. Output Requirements

In the final diagnosis message, include:

- sampled hot thread id and key stack frame
- suggested `jad` command
- exact method/line to inspect first
- one short hypothesis of root cause
