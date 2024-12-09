const puppeteer = require('puppeteer');

const isRender = process.env.RENDER === 'true'; // Add this as an environment variable on Render
const executablePath = isRender
    ? '/opt/render/.cache/puppeteer/chrome-linux/chrome' // Render's default Puppeteer path
    : '/Users/richardmcgirt/.cache/puppeteer/chrome/mac_arm-131.0.6778.87/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'; // Local path

const browser = await puppeteer.launch({
    headless: false,
    executablePath,
});
