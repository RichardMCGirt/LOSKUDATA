const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Executable Path:', puppeteer.executablePath());
    } catch (error) {
        console.error('Error resolving executablePath:', error.message);
    }
})();
