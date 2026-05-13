#!/bin/sh

echo ${USERNAME}:${PASSWORD} | chpasswd && /usr/sbin/sshd -D -o PermitRootLogin=yes -o AddressFamily=inet -o GatewayPorts=yes -o AllowAgentForwarding=yes -o AllowTcpForwarding=yes -o KexAlgorithms=+diffie-hellman-group1-sha1 -o HostkeyAlgorithms=+ssh-rsa -p 22 &
PID1=$!

/opt/java/openjdk/bin/java -jar /opt/math-game.jar &
PID2=$!

wait -n

kill $PID1 $PID2 2>/dev/null