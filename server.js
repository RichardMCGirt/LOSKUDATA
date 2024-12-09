const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3010;
app.use(cors());

// Ensure the download directory exists
const downloadPath = path.resolve('/tmp', 'downloads'); // Use /tmp for Render
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

// Reusable Puppeteer Launcher
async function launchPuppeteer() {
    console.log('Launching Puppeteer...');
    return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Render-specific flags
        executablePath: puppeteer.executablePath(), // Use Puppeteer's bundled Chromium
    });
}

// Route to test Puppeteer with example.com
app.get('/test-puppeteer', async (req, res) => {
    try {
        const browser = await launchPuppeteer();
        const page = await browser.newPage();
        await page.goto('https://example.com');
        const title = await page.title();
        console.log('Page title:', title);
        await browser.close();
        res.json({ message: `Page title: ${title}` });
    } catch (error) {
        console.error('Error occurred during Puppeteer test:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to download the report
app.get('/download-report', async (req, res) => {
    try {
        console.log('Launching Puppeteer...');
        const browser = await launchPuppeteer();

        const page = await browser.newPage();

        // Set download behavior
        console.log('Setting download path...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');
        
        // Log in or skip if already logged in
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

        console.log(`Serving file: ${csvFile}`);
        res.download(path.join(downloadPath, csvFile), 'report.csv');

        await browser.close();
    } catch (error) {
        console.error('Error occurred during Puppeteer execution:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
