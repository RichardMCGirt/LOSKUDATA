require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const chromium = require('chrome-aws-lambda');


const app = express();
const PORT = process.env.PORT || 3010;

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads'); // Use local directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

// Reusable Puppeteer Launcher
async function launchPuppeteer() {
    try {
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


// Route to download the report
app.get('/download-report', async (req, res) => {
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

        console.log(`Serving file: ${csvFile}`);
        const filePath = path.join(downloadPath, csvFile);

        // Serve the file
        res.download(filePath, 'report.csv', (err) => {
            if (err) {
                console.error('Error while sending file:', err);
                res.status(500).send('Failed to send file.');
            } else {
                console.log('File downloaded successfully.');
            }
        });

    } catch (error) {
        console.error('Error occurred during Puppeteer execution:', error);
        res.status(500).json({ error: 'Failed to generate the report.' });
    }
});

// Serve the HTML page
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
