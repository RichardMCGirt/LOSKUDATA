const puppeteer = require('puppeteer'); // Use Puppeteer with bundled Chromium
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer'); // Use inquirer for enhanced user input

// Ensure the download directory exists
const downloadPath = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
    console.log('Creating downloads directory...');
    fs.mkdirSync(downloadPath);
} else {
    console.log('Downloads directory already exists:', downloadPath);
}

// Mapping of location names to template IDs
const locationToId = {
    "Greenville Inventory Report": "246",
    "Raleigh Inventory Report": "247",
    "Wilmington Inventory Report": "293",
};

async function getLocationId() {
    const locations = Object.keys(locationToId);
    const { selectedLocation } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedLocation',
            message: 'Please select a location:',
            choices: locations,
        },
    ]);

    return locationToId[selectedLocation];
}

async function launchPuppeteer() {
    try {
        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 120000, // Set a global timeout for Puppeteer
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

        const idlocation = await getLocationId();

        const browser = await launchPuppeteer();
        const page = await browser.newPage();

        console.log('Setting download behavior...');
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('Clearing previous downloads...');
        const files = fs.readdirSync(downloadPath);
        files.forEach((file) => fs.unlinkSync(path.join(downloadPath, file)));
        console.log('Previous downloads cleared.');

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
        await page.goto('https://vanirlive.omnna-lbm.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=3729859');
        await page.waitForSelector('select#ddlSavedTemplate', { visible: true });
        console.log(`Selecting report template for location ID: ${idlocation}`);

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Add 5-second delay

        await page.evaluate((id) => {
            const dropdown = document.querySelector('select#ddlSavedTemplate');
            if (dropdown) {
                dropdown.value = id; // Set the dropdown value
                dropdown.dispatchEvent(new Event('change', { bubbles: true })); // Trigger the change event
            }
        }, idlocation);

        console.log('Taking screenshot after template selection...');
        await page.screenshot({ path: path.join(downloadPath, 'template_selection.png') });

        console.log('Selecting all line codes and ensuring proper rendering...');
        await page.waitForSelector('input#chkalllinecode', { visible: true });
        
        // Select the checkbox and force state change
        await page.evaluate(() => {
            const checkbox = document.querySelector('input#chkalllinecode');
            checkbox.scrollIntoView({ behavior: "smooth", block: "center" });
            checkbox.focus();
            checkbox.click();
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Checkbox manually selected and events dispatched.');
        });
        
        // Confirm checkbox state after selection
        const checkboxState = await page.evaluate(() => {
            const checkbox = document.querySelector('input#chkalllinecode');
            return checkbox.checked;
        });
        console.log('Checkbox state after selection:', checkboxState ? '✅ Selected' : '❌ Not Selected');
        
        if (!checkboxState) {
            throw new Error('❌ Checkbox was not successfully selected. Stopping execution.');
        }
        
        // ✅ Add delay to allow UI update
        console.log('Waiting 8 seconds for the checkbox to visually update...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // ✅ Clicking the Generate Now button and waiting for navigation
        console.log('Clicking the Generate Now button...');
        await page.waitForSelector('input#generatenw[value=" Generate Now "]', { visible: true });
        await Promise.all([
            page.click('input#generatenw[value=" Generate Now "]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }) // Wait for page navigation to complete
        ]);
        console.log('✅ Generate Now button clicked and navigation completed.');
        
        // ✅ Clicking Export to CSV button and waiting for download
        console.log('Clicking the Export to CSV button...');
        await page.waitForSelector('input#btnExport[value="Export To CSV"]', { visible: true });
        await page.click('input#btnExport[value="Export To CSV"]');
        console.log('✅ Export to CSV button clicked.');
        
        // ✅ Waiting for the CSV download confirmation
        console.log('Waiting for CSV file to download...');
        let csvFile;
        for (let i = 0; i < 120; i++) { 
            const files = fs.readdirSync(downloadPath);
            csvFile = files.find((file) => file.endsWith('.csv') || file.endsWith('.crdownload'));
            if (csvFile && csvFile.endsWith('.csv')) {
                console.log(`✅ CSV file downloaded: ${csvFile}`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // ✅ Handle timeout for CSV download
        if (!csvFile) {
            throw new Error('❌ CSV file not downloaded within the timeout period.');
        }
        
        // ✅ Renaming the file
        const oldFilePath = path.join(downloadPath, csvFile);
        const newFilePath = path.join(downloadPath, `PhysicalInventory_${Object.keys(locationToId).find(key => locationToId[key] === idlocation)}.csv`);
        fs.renameSync(oldFilePath, newFilePath);
        console.log(`✅ Report renamed to: ${newFilePath}`);
        console.log('✅ Report generation completed successfully.');
                
    } catch (error) {
        console.error('Error during report generation:', error.message);
        process.exit(1); // Exit with failure
    }
}

// Run the report generation
generateAndDownloadReport();
