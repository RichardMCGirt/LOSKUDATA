const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

async function launchPuppeteer() {
    try {
        // Get the executable path dynamically
        const executablePath = await chromium.executablePath;
        console.log('Resolved Executable Path:', executablePath);

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath,
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
        });

        console.log('Puppeteer launched successfully.');
        return browser;
    } catch (error) {
        console.error('Error launching Puppeteer:', error.message);
        throw error;
    }
}

(async () => {
    await launchPuppeteer();
})();
