const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3010;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/download-report', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: true, // Ensure headless mode for cloud environments
            executablePath: puppeteer.executablePath(),
        });
        

        const page = await browser.newPage();
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');
        await page.type('#user_name', 'richard.mcgirt');
        await page.type('#user_password', '84625');
        await page.keyboard.press('Enter');
        await page.waitForNavigation();

        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309241');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        await page.select('select#ddlSavedTemplate', '297');
        await page.waitForSelector('input#generatenw', { visible: true });
        await page.click('input#generatenw');

        await new Promise((resolve) => setTimeout(resolve, 35000));
        await page.waitForSelector('input#btnExport', { visible: true });
        await page.click('input#btnExport');

        await browser.close();
        res.json({ message: '"Export To CSV" button clicked and export initiated!' });
    } catch (error) {
        console.error('Error occurred during Puppeteer execution:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
