# Use Node.js with Debian-based image
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-fund --no-audit && npm cache clean --force

# Install dependencies for headless Chromium in Cloud Run
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libasound2 \
    libnspr4 \
    libnss3 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# Copy all source files
COPY . .

# Create downloads directory
RUN mkdir -p /app/downloads

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "generateOpenOrders.js"]
