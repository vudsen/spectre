FROM testcontainers/sshd:1.3.0 AS base

# v28, download from https://github.com/docker/cli
ADD docker-linux-amd64 /usr/bin/docker

RUN ["chmod", "u+x", "/usr/bin/docker"]

FROM testcontainers/sshd:1.3.0

ENV USERNAME=root
ENV PASSWORD=P@ssw0rd
EXPOSE 22

COPY --from=base /usr/bin/docker /usr/bin/docker

CMD ["echo ${USERNAME}:${PASSWORD} | chpasswd && /usr/sbin/sshd -D -o PermitRootLogin=yes -o AddressFamily=inet -o GatewayPorts=yes -o AllowAgentForwarding=yes -o AllowTcpForwarding=yes -o KexAlgorithms=+diffie-hellman-group1-sha1 -o HostkeyAlgorithms=+ssh-rsa -p 22"]
