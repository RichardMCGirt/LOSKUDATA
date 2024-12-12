require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const http = require('http');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3010;

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads'); // Use local directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
}

// Reusable Puppeteer Launcher
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.static(path.join(__dirname, 'public')));



async function launchPuppeteer() {
    try {
        // Replace this with the path to Google Chrome on your system
        const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

        console.log('Using Google Chrome executable at:', executablePath);

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath, // Use Google Chrome
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for many hosting platforms
        });

        console.log('Google Chrome launched successfully.');
        return browser;
    } catch (error) {
        console.error('Error launching Puppeteer:', error.message);
        throw error;
    }
}

// Serve index3.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index3.html'));
});


// Route to download the report
app.get('/download-report', async (req, res) => {
    const socketId = req.query.socketId;
    try {
        io.to(socketId).emit('status', 'Generating report...');
        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        io.to(socketId).emit('status', 'Setting download path...');
        await page._client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        io.to(socketId).emit('status', 'Navigating to login page...');
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
        io.to(socketId).emit('status', 'Error occurred during report generation.');
        res.status(500).json({ error: 'Failed to generate the report.' });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
