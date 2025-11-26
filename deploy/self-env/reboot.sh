#!/bin/bash
export SPECTRE_VERSION=$1

sudo docker compose --project-directory /opt/spectre ps | grep -q "spectre-web" \
    && (docker compose --project-directory /opt/spectre down && docker compose --project-directory /opt/spectre up -d) \
    || docker compose --project-directory /opt/spectre up -d