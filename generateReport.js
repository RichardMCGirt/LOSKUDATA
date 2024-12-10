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
    console.log('Creating downloads directory...');
    fs.mkdirSync(downloadPath);
} else {
    console.log('Downloads directory already exists:', downloadPath);
}

async function logExecutablePath() {
    console.log('Checking Puppeteer executable path...');
    const executablePath = await chromium.executablePath || puppeteer.executablePath();
    console.log('Executable Path:', executablePath || 'No executable path found');
}

async function launchPuppeteer() {
    console.log('Launching Puppeteer...');
    try {
        const executablePath = await chromium.executablePath || puppeteer.executablePath();
        console.log('Using executablePath:', executablePath);

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
        console.log('Starting report generation...');
        await logExecutablePath();

        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Setting download behavior...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');

        console.log('Checking for login fields...');
        const loginFieldExists = await page.$('#user_name');
        if (loginFieldExists) {
            console.log('Login fields detected. Proceeding to login...');
            await page.type('#user_name', 'richard.mcgirt');
            await page.type('#user_password', '84625');
            console.log('Submitting login...');
            await page.keyboard.press('Enter');
            await page.waitForNavigation();
            console.log('Login successful.');
        } else {
            console.log('Already logged in or login fields not found.');
        }

        console.log('Navigating to report page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        console.log('Selecting report template...');
        await page.select('select#ddlSavedTemplate', '248');
        console.log('Generating report...');
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
            console.log(`Download attempt ${i + 1}: Checking for CSV files...`);
            csvFile = files.find((file) => file.endsWith('.csv'));
            if (csvFile) {
                console.log(`CSV file found: ${csvFile}`);
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
        }

        if (!csvFile) {
            throw new Error('CSV file not downloaded within timeout period');
        }

        const filePath = path.join(downloadPath, csvFile);
        console.log(`Report downloaded successfully: ${filePath}`);
        console.log('Report generation completed.');

        await browser.close();
    } catch (error) {
        console.error('Error during report generation:', error.message);
        process.exit(1); // Ensure process exits with failure
    }
}

// Run the report generation
generateAndDownloadReport();
