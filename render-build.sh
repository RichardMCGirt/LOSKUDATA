#!/usr/bin/env bash
apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libfontconfig1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libxtst6 \
    xdg-utils \
    fonts-liberation \
    lsb-release \
    wget \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
