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
            headless: false, // Non-headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-infobars',
                '--disable-popup-blocking',
                '--window-size=1920,1080',
                '--enable-features=NetworkService',
            ],
            userDataDir: './user_data', // Ensure consistent session for downloads
        });

        const page = await browser.newPage();

        // Set download behavior
        console.log('Setting download path...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Navigating to login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');
        
        try {
            // Check if the login field exists
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
        } catch (error) {
            console.log('Error during login check:', error.message);
        }
        
        console.log('Navigating to report page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        await page.select('select#ddlSavedTemplate', '248');
        await page.waitForSelector('input#generatenw', { visible: true });
        await page.click('input#generatenw');

        console.log('Waiting for the report to generate...');
        const countdown = async (seconds) => {
            for (let i = seconds; i > 0; i--) {
                console.log(`Time remaining: ${i} seconds`);
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
            }
        };
        await countdown(30);

        console.log('Exporting report to CSV...');
        const isButtonVisible = await page.$eval('input#btnExport', (el) => el && !el.disabled);
console.log('Is Export Button Visible and Enabled:', isButtonVisible);

await page.waitForSelector('input#btnExport[value="Export To CSV"]', { visible: true });
const exportButtons = await page.$$('input#btnExport');
await exportButtons[1].click(); // Click the second button

        console.log('Waiting for CSV file to be downloaded...');
        let csvFile;
        for (let i = 0; i < 60; i++) { // Poll for up to 60 seconds
            const files = fs.readdirSync(downloadPath);
            csvFile = files.find((file) => file.endsWith('.csv'));
            if (csvFile) break;
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
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
