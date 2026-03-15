---
name: cpu_spike_diagnosis
description: Troubleshooting high CPU usage issues
---

# High CPU Usage Troubleshooting
## 1. Identify High CPU Threads

Use the `thread -n 3 -i 1000` command to view the stack trace of the three busiest threads. 
Before running the command, remind the user: `This command may take some time. Please be patient`.

After the command completes, examine the corresponding threads. If CPU usage appears normal, inform the user: No abnormal threads found. You can try using thread -n 3 -i 5000 for further observation. Then, exit the process.

## 2. Suggest Code Inspection Commands

Once a high CPU thread is identified, locate the method currently being executed.
Extract the class of the method and instruct the user to use `jad <specific class>` to decompile the suspicious class. 
Additionally, provide information on which line to focus on for further inspection.