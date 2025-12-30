#!/bin/bash

# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

sudo useradd -m spectre
#sudo usermod -aG docker spectre

sudo mkdir -p /opt/spectre/data
sudo mkdir -p /opt/spectre/logs

sudo chown -R ubuntu:ubuntu /opt/spectre

sudo cat << EOF > /opt/spectre/docker-compose.yaml
name: Spectre
services:
  web:
    user: spectre
    environment:
      SPECTRE_HOME: '/home/spectre/data'
    ports:
      - "80:8080"
    volumes:
      - ./application.yaml:/home/spectre/application.yaml
      - ./data:/home/spectre/data
      - ./logs:/home/spectre/logs
    working_dir: /home/spectre
    image: public.ecr.aws/b9z8l9n7/vudsen/spectre:\${SPECTRE_VERSION}
    command:
      - java
      - -Xmx1g
      - -jar
      - spectre.jar
EOF

cat << EOF > /opt/spectre/application.yaml
spring:
  profiles:
    active: prod
  datasource:
    url: jdbc:sqlite:data/identifier.sqlite
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.community.dialect.SQLiteDialect
EOF

sudo chown -R spectre:spectre /opt/spectre
sudo chmod -R g+w /opt/spectre

# Add test user for docker attach.
sudo useradd -m tester
sudo usermod -aG docker tester
sudo usermod -aG spectre tester
ssh-keygen -t rsa -f /tmp/tester_id_rsa
sudo mkdir -p /home/tester/.ssh
sudo cp /tmp/tester_id_rsa.pub /home/tester/.ssh/authorized_keys
sudo chmod 600 /home/tester/.ssh/authorized_keys
sudo chown -R tester:tester /home/tester/.ssh
echo 'Tester private key:'
sudo cat /tmp/tester_id_rsa
sudo rm /tmp/tester_id_rsa.pub /tmp/tester_id_rsa
# sudo SPECTRE_VERSION=latest docker compose --project-directory /opt/spectre up