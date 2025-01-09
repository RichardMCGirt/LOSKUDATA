# Base Image for ARM64 compatibility with Puppeteer
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for Chromium on ARM64
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libgbm1 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using puppeteer-core (no bundled Chromium)
RUN npm install puppeteer-core

# Copy the app
COPY . .

# Set the environment variable for Chromium binary location
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose the port for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
