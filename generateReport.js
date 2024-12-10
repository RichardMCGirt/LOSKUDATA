require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Skip Chromium download for Puppeteer
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads'); // Use local directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

// Reusable Puppeteer Launcher
async function launchPuppeteer() {
    console.log('Starting Puppeteer launch process...');
    try {
        console.log('Configuring Puppeteer launch options...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Render-specific flags
        });

        console.log('Puppeteer launched successfully.');
        return browser;
    } catch (error) {
        console.error('Error occurred during Puppeteer launch:', error.message);
        throw error; // Re-throw the error to handle it in the calling function
    }
}

// Function to generate and download the report
async function generateAndDownloadReport() {
    try {
        console.log('Generating report...');
        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Setting download path...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');

        // Check and perform login
        const loginFieldExists = await page.$('#user_name');
        if (loginFieldExists) {
            console.log('Login fields detected. Proceeding to log in...');
            await page.type('#user_name', 'richard.mcgirt');
            await page.type('#user_password', '84625');
            await page.keyboard.press('Enter');
            await page.waitForNavigation();
        } else {
            console.log('Login skipped as the user is already logged in.');
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

        console.log(`Report downloaded: ${csvFile}`);
        const filePath = path.join(downloadPath, csvFile);
        console.log(`File is saved at: ${filePath}`);
        console.log('Report generation completed successfully.');

    } catch (error) {
        console.error('Error occurred during Puppeteer execution:', error);
    }
}

// Execute the function directly
generateAndDownloadReport();
