#!/usr/bin/env bash
apt-get update && apt-get install -y \
    gconf-service libasound2 libatk1.0-0 libcups2 libdbus-1-3 \
    libgdk-pixbuf2.0-0 libnspr4 libnss3 libxcomposite1 libxrandr2 \
    libxss1 libxtst6 fonts-liberation libappindicator1 libcurl4 \
    libexif12 libgconf-2-4 libindicator7 libpango1.0-0 \
    libv4l-0 xdg-utils
npx puppeteer install
