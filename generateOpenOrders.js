const puppeteer = require('puppeteer'); // Use Puppeteer with bundled Chromium
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3001;

// Serve a basic HTML page with a button
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>Puppeteer Report</title></head>
            <body>
                <button onclick="fetch('/generate-report').then(() => alert('Report generation started!'))">Generate Report</button>
            </body>
        </html>
    `);
});

// Set a safer download path inside the container
const downloadPath = path.join('/app', 'downloads');

// Check and create the directory if it doesn't exist
if (!fs.existsSync(downloadPath)) {
    console.log('Creating downloads directory in /app...');
    fs.mkdirSync(downloadPath, { recursive: true });
} else {
    console.log('Downloads directory already exists:', downloadPath);
}

async function launchPuppeteer() {
    try {
        console.log('Launching Puppeteer with headless mode disabled and security args set.');
        const browser = await puppeteer.launch({
            headless: "new", 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--single-process',
                '--disable-extensions'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });
        
        
        console.log('Puppeteer browser launched successfully.');
        return browser;
    } catch (error) {
        console.error('Error launching Puppeteer:', error.message);
        throw error;
    }
}

async function generateAndDownloadReport() {
    try {
        console.log('Initiating the report generation process...');

        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Configuring download behavior...');
        const client = await page.target().createCDPSession();
await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
});


        console.log('Navigating to the login page...');
        await page.goto('https://vanirlive.omnna-lbm.live/index.php?action=Login&module=Users');

        console.log('Checking for the presence of login fields...');
        const loginFieldExists = await page.$('#user_name');
        if (loginFieldExists) {
            console.log('Login fields detected. Entering credentials...');
            await page.type('#user_name', 'richard.mcgirt');
            await page.type('#user_password', '84625');
            console.log('Submitting login form...');
            await page.keyboard.press('Enter');
            await page.waitForNavigation();
            console.log('Login successful, navigation completed.');
        } else {
            console.log('Login fields not detected. Already logged in or page structure changed.');
        }

        console.log('Navigating to the report page...');
        await page.goto('https://vanirlive.omnna-lbm.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        console.log('Report template dropdown detected. Selecting template...');
        await page.select('select#ddlSavedTemplate', '248');

        console.log('Triggering report generation...');
        await page.click('input#generatenw');

        console.log('Waiting for the report to be generated (30 seconds delay)...');
        await new Promise((resolve) => setTimeout(resolve, 30000));

        console.log('Looking for CSV export button...');
        await page.waitForSelector('input#btnExport[value="Export To CSV"]', { visible: true });
        console.log('Export button located. Initiating CSV export...');
        await page.click('input#btnExport[value="Export To CSV"]');

        console.log('Waiting for CSV download to complete...');
        let csvFile;
        for (let i = 0; i < 60; i++) {
            const files = fs.readdirSync(downloadPath);
            console.log(`Download check ${i + 1}: Checking for CSV files...`);
            csvFile = files.find((file) => file.endsWith('.csv'));
            if (csvFile) {
                console.log(`CSV file detected: ${csvFile}`);
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!csvFile) {
            console.error('CSV file not downloaded within the timeout period.');
            throw new Error('Download failed or timed out.');
        }

        const filePath = path.join(downloadPath, csvFile);
        console.log(`CSV report successfully downloaded at: ${filePath}`);

        console.log('Closing the browser...');
        await browser.close();
        console.log('Browser closed. Report generation process completed successfully.');
    } catch (error) {
        console.error('An error occurred during the report generation process:', error.message);
        process.exit(1);
    }
}

// Start the server and listen for button click
app.get('/generate-report', (req, res) => {
    generateAndDownloadReport().then(() => res.send('Report generation triggered successfully!')).catch(error => res.status(500).send(error.message));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
