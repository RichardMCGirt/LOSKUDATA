const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: false }); // Set to true for headless mode
        const page = await browser.newPage();
        
        console.log('Navigating to the login page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?action=Login&module=Users');

        console.log('Filling in username...');
        await page.type('#user_name', 'richard.mcgirt'); // Replace with the correct input selector

        console.log('Filling in password...');
        await page.type('#user_password', '84625'); // Replace with the correct password selector

        console.log('Pressing Enter to submit the form...');
        await page.keyboard.press('Enter'); // Simulates pressing the Enter key

        console.log('Waiting for navigation to complete...');
        await page.waitForNavigation();

        console.log('Logged in successfully! Navigating to the Reports page...');
        await page.goto('https://vanirlive.lbmlo.live/index.php?module=Reports&action=ListView');

        console.log('Reports page loaded successfully!');

        // Optional: Perform further actions on the Reports page

        // Optional: Close the browser
        // console.log('Closing browser...');
        // await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
