const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3010;

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/download-report', async (req, res) => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: puppeteer.executablePath(),
        });

        const page = await browser.newPage();
        const downloadPath = path.resolve(__dirname, 'downloads');

        // Ensure the download directory exists
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        }

        // Set download behavior
        console.log('Setting download path...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');
        await page.type('#user_name', 'richard.mcgirt');
        await page.type('#user_password', '84625');
        await page.keyboard.press('Enter');
        await page.waitForNavigation();

        console.log('Navigating to report page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        await page.select('select#ddlSavedTemplate', '297');
        await page.waitForSelector('input#generatenw', { visible: true });
        await page.click('input#generatenw');

        console.log('Waiting for the report to generate...');

        // Countdown function
        const countdown = async (seconds) => {
            for (let i = seconds; i > 0; i--) {
                console.log(`Time remaining: ${i} seconds`);
                await new Promise((resolve) => setTimeout(resolve, 550)); // Wait for 1 second
            }
        };
        
        // Start the countdown
        await countdown(30); // 1-minute countdown
        
        console.log('Exporting report to CSV...');
        await page.waitForSelector('input#btnExport', { visible: true });
        await page.click('input#btnExport');
        

        const files = fs.readdirSync(downloadPath);
        const csvFile = files.find((file) => file.endsWith('.csv'));

        if (csvFile) {
            console.log(`Serving file: ${csvFile}`);
            res.download(path.join(downloadPath, csvFile), 'report.csv');
        } else {
            res.status(404).json({ error: 'CSV file not found' });
        }
    } catch (error) {
        console.error('Error occurred during Puppeteer execution:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
