FROM node:16-bullseye

# Install required system libraries
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
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
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install Node.js dependencies
RUN npm install

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Start the application
CMD ["node", "generateReport.js"]
