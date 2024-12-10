require('dotenv').config();
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// Set Puppeteer cache directory
process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads'); // Local directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

console.log('Starting Puppeteer script...');
console.log('Executable Path:', await chromium.executablePath || puppeteer.executablePath());

async function launchPuppeteer() {
    console.log('Launching Puppeteer...');
    try {
        const executablePath = await chromium.executablePath || puppeteer.executablePath();

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

async function generateAndDownloadReport() {
    try {
        console.log('Generating report...');
        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Setting download behavior...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');

        const loginFieldExists = await page.$('#user_name');
        if (loginFieldExists) {
            console.log('Login fields detected. Logging in...');
            await page.type('#user_name', 'richard.mcgirt');
            await page.type('#user_password', '84625');
            await page.keyboard.press('Enter');
            await page.waitForNavigation();
        } else {
            console.log('Already logged in.');
        }

        console.log('Navigating to report page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        await page.select('select#ddlSavedTemplate', '248');
        await page.click('input#generatenw');

        console.log('Waiting for the report to generate...');
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait for 30 seconds

        console.log('Exporting report to CSV...');
        await page.waitForSelector('input#btnExport[value="Export To CSV"]', { visible: true });
        await page.click('input#btnExport[value="Export To CSV"]');

        console.log('Waiting for CSV file to download...');
        let csvFile;
        for (let i = 0; i < 60; i++) {
            const files = fs.readdirSync(downloadPath);
            csvFile = files.find((file) => file.endsWith('.csv'));
            if (csvFile) break;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!csvFile) {
            throw new Error('CSV file not downloaded within timeout period');
        }

        const filePath = path.join(downloadPath, csvFile);
        console.log(`Report downloaded: ${filePath}`);
        console.log('Report generation completed successfully.');

        await browser.close();
    } catch (error) {
        console.error('Error generating report:', error.message);
        process.exit(1); // Ensure process exits with failure
    }
}

// Run the report generation
generateAndDownloadReport();
