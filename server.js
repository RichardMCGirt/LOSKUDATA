const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3010;

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/download-report', async (req, res) => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        console.log('Navigating to the login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');

        console.log('Filling in username...');
        await page.type('#user_name', 'richard.mcgirt');

        console.log('Filling in password...');
        await page.type('#user_password', '84625');

        console.log('Pressing Enter to log in...');
        await page.keyboard.press('Enter');

        console.log('Waiting for login navigation to complete...');
        await page.waitForNavigation();

        console.log('Login successful! Navigating to the report page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');

        console.log('Waiting for the dropdown to appear...');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });

        console.log('Selecting the "inventory audit" option...');
        await page.select('select#ddlSavedTemplate', '297');

        console.log('Waiting for the "Generate Now" button to appear...');
        await page.waitForSelector('input#generatenw', { visible: true });

        console.log('Clicking the "Generate Now" button...');
        await page.click('input#generatenw');

        console.log('Waiting one minute for the report to generate...');
        await delay(40000); // Custom delay function

        console.log('Waiting for the "Export To CSV" button to appear...');
        await page.waitForSelector('input#btnExport', { visible: true });

        console.log('Clicking the "Export To CSV" button...');
        await page.click('input#btnExport');

        console.log('"Export To CSV" button clicked successfully!');
        res.json({ message: '"Export To CSV" button clicked and export initiated!' });

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ message: 'Error occurred during navigation or interaction.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
