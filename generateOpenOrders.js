const puppeteer = require('puppeteer'); // Use Puppeteer with bundled Chromium
const path = require('path');
const fs = require('fs');

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
    console.log('Creating downloads directory...');
    fs.mkdirSync(downloadPath);
} else {
    console.log('Downloads directory already exists:', downloadPath);
}

async function launchPuppeteer() {
    try {
        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Setting download behavior...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.omnna-lbm.live/index.php?action=Login&module=Users');

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
        await page.goto('https://vanirlive.omnna-lbm.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
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
        process.exit(1); // Exit with failure
    }
}

// Run the report generation
generateAndDownloadReport();
