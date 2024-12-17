// Global Variables for Data Storage
let jobReportData = []; // To hold job report data
let checkboxStates = {}; // To track checkbox states

// Identify DOM Elements
const jobTableBody = document.querySelector('#job-report-table tbody');

// Function to Load CSV Data and Populate Job Report Table
function loadAndParseFile(fileName) {
    fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error(`Could not fetch the file: ${fileName}`);
            return response.text();
        })
        .then(text => {
            const lines = text.split('\n');
            const headers = lines[2].split(',').map(header => header.trim());
            console.log("Headers:", headers);
         
            
            jobReportData = lines.slice(3)
            .map(line => {
                const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g); // Split CSV safely
                console.log("Raw Columns:", columns); // Debug raw columns
        
                if (!columns || columns.length < 7) { // Check for valid row
                    console.warn("Skipping invalid row:", line);
                    return null;
                }
        
                // Clean and log sellqty value
                const rawSellQty = columns[8]?.trim().replace(/^"|"$/g, '');
                console.log("Raw Sell Qty:", rawSellQty);
        
                const row = {
                    cperson: columns[0]?.trim().replace(/^"|"$/g, ''),
                    branch: columns[1]?.trim().replace(/^"|"$/g, ''),
                    jobname: columns[2]?.trim().replace(/^"|"$/g, ''),
                    sonumber: columns[3]?.trim().replace(/^"|"$/g, ''),
                    productnumber: columns[4]?.trim().replace(/^"|"$/g, ''),
                    Description: columns[5]?.trim().replace(/^"|"$/g, ''),
                    sellqty: parseFloat(rawSellQty) || 0, // Safely parse the sellqty
                };
        
                console.log("Parsed Row:", row);
                return row;
            })
            .filter(row => row); // Remove null rows
        
        


            renderJobReportTable();
        })
        .catch(error => console.error("Error loading file:", error));
        
}

// Render Job Report Table
function renderJobReportTable() {
    console.log('Rendering Job Report Table...');
    jobTableBody.innerHTML = ''; // Clear table content

    jobReportData.forEach((row, index) => {
        if (!row) return; // Skip invalid rows

        const tr = document.createElement('tr');
        const isChecked = !!checkboxStates[index];
        tr.innerHTML = `
            <td>${row.jobname || ''}</td>
            <td>${row.productnumber || ''}</td>
            <td>${row.Description || ''}</td>
            <td>${row.sellqty || ''}</td>
            <td><input type="checkbox" id="checkbox-${index}" ${isChecked ? 'checked' : ''} /></td>
        `;
        jobTableBody.appendChild(tr);
    });

    // Attach Event Listener to Table (Delegated)
    jobTableBody.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const rowIndex = parseInt(e.target.id.split('-')[1], 10);

            // Validate rowIndex and rowData
            if (isNaN(rowIndex) || !jobReportData[rowIndex]) {
                console.warn(`Invalid row index: ${rowIndex}`);
                return;
            }

            const rowData = jobReportData[rowIndex];
            console.log(`Checkbox Change Detected: Row ${rowIndex}, Checked: ${e.target.checked}`);
            handleCheckboxChange(e.target.checked, rowData);
        }
    });
}


// Handle Checkbox State Change
function handleCheckboxChange(isChecked, rowData) {
    const productNumber = rowData.productnumber.trim().toUpperCase(); // Use Product Number as Stock SKU
    const sellQty = rowData.sellqty;

    // Find if the row already exists in finalCountsData
    let existingRow = finalCountsData.find(r => r.stockSku === productNumber);

    if (isChecked) {
        if (existingRow) {
            existingRow.fieldCount += sellQty; // Update field count if row exists
        } else {
            finalCountsData.push({
                stockSku: productNumber, // Product number as Stock SKU
                fieldCount: sellQty,     // Sell qty as Field Count
                warehouseCount: 0,       // Initialize warehouse count as 0
                currentQOH: 0,           // Initialize current QOH as 0
                discrepancy: 0           // Initialize discrepancy as 0
            });
        }
    } else {
        // If unchecked, reduce or remove the row
        if (existingRow) {
            existingRow.fieldCount -= sellQty;
            if (existingRow.fieldCount <= 0) {
                // Remove the row if field count becomes zero or less
                finalCountsData = finalCountsData.filter(r => r.stockSku !== productNumber);
            }
        }
    }

    renderFinalCountsTable(); // Re-render the final table
}


// Render Final Counts Table
function renderFinalCountsTable() {
    const finalTableBody = document.querySelector('#final-table tbody');
    finalTableBody.innerHTML = ''; // Clear existing table rows

    if (finalCountsData.length === 0) {
        finalTableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }

    finalCountsData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.stockSku}</td>
            <td>${row.fieldCount}</td>
            <td><input type="number" id="warehouseCount-${index}" value="${row.warehouseCount}" min="0" /></td>
            <td id="finalInventory-${index}">${row.fieldCount + row.warehouseCount}</td>
            <td>${row.currentQOH}</td>
            <td>${row.discrepancy}</td>
        `;
        finalTableBody.appendChild(tr);

        // Attach Input Event for Warehouse Count
        tr.querySelector(`#warehouseCount-${index}`).addEventListener('input', (e) => {
            updateWarehouseCount(index, e.target.value);
        });
    });
}

// Update Warehouse Count and Recalculate Inventory
function updateWarehouseCount(index, value) {
    finalCountsData[index].warehouseCount = parseFloat(value) || 0;
    document.getElementById(`finalInventory-${index}`).textContent =
        finalCountsData[index].fieldCount + finalCountsData[index].warehouseCount;
}

// Initial CSV Load Simulation
document.addEventListener('DOMContentLoaded', () => {
    loadAndParseFile('pird.csv'); // Replace 'pird.csv' with your actual file path
});
