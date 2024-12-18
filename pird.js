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

            jobReportData = lines.slice(3)
                .map(line => {
                    const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!columns || columns.length < 9) return null;

                    // Clean sellqty properly
                    const rawSellQty = columns[8]?.trim().replace(/^"|"$/g, '');
                    const sellQty = parseFloat(rawSellQty) || 0;

                    return {
                        cperson: columns[0]?.trim().replace(/^"|"$/g, ''),
                        branch: columns[1]?.trim().replace(/^"|"$/g, ''),
                        jobname: columns[2]?.trim().replace(/^"|"$/g, ''),
                        productnumber: columns[4]?.trim().replace(/^"|"$/g, ''),
                        Description: columns[5]?.trim().replace(/^"|"$/g, ''),
                        sellqty: sellQty,
                    };
                })
                .filter(row => row);

            console.log("Loaded Job Report Data:", jobReportData);
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

function handleCheckboxChange(isChecked, rowData) {
    console.log("---- HANDLE CHECKBOX CHANGE ----");
    console.log(`Checkbox State: ${isChecked ? 'Checked' : 'Unchecked'}`);
    console.log("Row Data Received:", rowData);

    // Extract product number and sell quantity
    const productNumber = rowData.productnumber.trim().toUpperCase();
    const sellQty = rowData.sellqty;

    console.log(`Product Number: "${productNumber}", Sell Qty: ${sellQty}`);

    // Find if the row already exists in finalCountsData
    let existingRow = finalCountsData.find(r => r.stockSku === productNumber);

    if (isChecked) {
        console.log("Action: Adding or Updating Row in Final Counts Data");
        if (existingRow) {
            console.log(`Existing Row Found: Increasing Field Count by ${sellQty}`);
            existingRow.fieldCount += sellQty; // Update field count
        } else {
            console.log(`New Row: Adding Product Number "${productNumber}" with Field Count ${sellQty}`);
            finalCountsData.push({
                stockSku: productNumber, // Product number as Stock SKU
                fieldCount: sellQty,     // Sell qty as Field Count
                warehouseCount: 0,       // Initialize warehouse count as 0
                currentQOH: 0,           // Initialize current QOH as 0
                discrepancy: 0           // Initialize discrepancy as 0
            });
        }
    } else {
        console.log("Action: Removing or Reducing Row in Final Counts Data");
        if (existingRow) {
            console.log(`Existing Row Found: Reducing Field Count by ${sellQty}`);
            existingRow.fieldCount -= sellQty;

            if (existingRow.fieldCount <= 0) {
                console.log(`Field Count is 0 or less: Removing Row for Product Number "${productNumber}"`);
                finalCountsData = finalCountsData.filter(r => r.stockSku !== productNumber);
            } else {
                console.log(`Updated Field Count for Product "${productNumber}": ${existingRow.fieldCount}`);
            }
        } else {
            console.warn(`Attempted to remove a non-existing row for Product "${productNumber}"`);
        }
    }

    console.log("Updated Final Counts Data:", finalCountsData);
    console.log("---- END HANDLE CHECKBOX CHANGE ----");

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


// DOM Elements
const cityDropdown = document.getElementById('city-dropdown');
const tableBody = document.querySelector('#result-table tbody');
const jobReportTableBody = document.querySelector('#job-report-table tbody');
const finalTableBody = document.querySelector('#final-table tbody');
const exportButton = document.getElementById('export-button');

let rows = []; // Full data from CSV
let filteredRows = []; // Filtered rows based on dropdown selection
let finalCountsData = []; // Data for Final Table

// Disable city dropdown initially
cityDropdown.disabled = true;

// Function to load CSV data
function loadCSV() {
    const filePath = 'https://raw.githubusercontent.com/RichardMCGirt/LOSKUDATA/test/custom/downloads/OpenOrdersByCounterPerson-Detail-1734529657-928961849.csv';
    fetch(filePath)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            const headers = lines[2].split(',').map(header => header.trim());

            rows = lines.slice(3)
                .map(line => {
                    const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g); // Safely split the line
                    if (!columns || columns.length < 9) return null; // Ensure row has enough columns

                    // Clean up sellqty before parsing
                    const rawSellQty = columns[7]?.trim().replace(/^"|"$/g, ''); // Remove extra quotes
                    const sellQty = parseFloat(rawSellQty) || 0; // Convert to number or fallback to 0

                    return {
                        branch: columns[1]?.trim().replace(/^"|"$/g, ''),
                        jobname: columns[2]?.trim().replace(/^"|"$/g, ''),
                        productnumber: columns[5]?.trim().replace(/^"|"$/g, ''),
                        Description: columns[6]?.trim().replace(/^"|"$/g, ''),
                        sellqty: sellQty, // Use cleaned and parsed sellqty
                    };
                })
                .filter(row => row); // Remove invalid rows

            console.log("Loaded Rows:", rows);
            cityDropdown.disabled = false; // Enable dropdown
        })
        .catch(error => console.error("Error loading CSV:", error));
}


// Display Filtered Rows in the Result Table
function displayFilteredRows() {
    tableBody.innerHTML = '';
    filteredRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.branch}</td>
            <td>${row.jobname}</td>
            <td>${row.productnumber}</td>
            <td>${row.Description}</td>
            <td>${row.sellqty}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Display Rows in Job Report Table
function displayJobReportTable() {
    jobReportTableBody.innerHTML = '';
    filteredRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.jobname}</td>
            <td>${row.productnumber}</td>
            <td>${row.Description}</td>
            <td>${row.sellqty}</td>
            <td><input type="checkbox" id="checkbox-${index}" /></td>
        `;
        tr.querySelector(`#checkbox-${index}`).addEventListener('change', (e) => {
            updateFinalTable(row, e.target.checked);
        });
        jobReportTableBody.appendChild(tr);
    });
}

// Update Final Table based on Checkboxes
function updateFinalTable(row, isChecked) {
    const existing = finalCountsData.find(r => r.stockSku === row.productnumber);

    if (isChecked) {
        if (existing) {
            existing.fieldCount += row.sellqty;
        } else {
            finalCountsData.push({
                stockSku: row.productnumber,
                fieldCount: row.sellqty,
                warehouseCount: 0,
                currentQOH: 0,
                discrepancy: 0
            });
        }
    } else if (existing) {
        existing.fieldCount -= row.sellqty;
        if (existing.fieldCount <= 0) {
            finalCountsData = finalCountsData.filter(r => r.stockSku !== row.productnumber);
        }
    }

    renderFinalCountsTable();
}

// Render Final Counts Table without Summing Columns
function renderFinalCountsTable() {
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
            <td><input type="number" value="${row.warehouseCount}" min="0" id="warehouse-${index}" /></td>
            <td>${row.fieldCount}</td> <!-- Display fieldCount as is -->
            <td>${row.currentQOH}</td>
            <td>${row.discrepancy}</td>
        `;
        // Attach event listener to update warehouseCount without summing
        tr.querySelector(`#warehouse-${index}`).addEventListener('input', (e) => {
            row.warehouseCount = parseFloat(e.target.value) || 0;
            renderFinalCountsTable(); // Re-render table to reflect changes
        });
        finalTableBody.appendChild(tr);
    });
}


// Handle Dropdown Change
cityDropdown.addEventListener('change', () => {
    const selectedCity = cityDropdown.value.toLowerCase();
    const jobReportTable = document.getElementById('job-report-table');
    const resultTable = document.getElementById('result-table');

    // Show/Hide Tables based on dropdown selection
    if (selectedCity) {
        jobReportTable.style.display = 'table'; // Show Job Report Table
        resultTable.style.display = 'none';     // Hide Result Table
    } else {
        jobReportTable.style.display = 'none';  // Hide Job Report Table
        resultTable.style.display = 'table';    // Show Result Table
    }

    filteredRows = rows.filter(row => row.branch?.toLowerCase().includes(selectedCity));
    displayFilteredRows(); // Populate filtered rows in Result Table
    displayJobReportTable(); // Populate rows in Job Report Table
    finalCountsData = []; // Reset Final Table
    renderFinalCountsTable(); // Clear Final Table
});





// Initialize Data Loading
document.addEventListener('DOMContentLoaded', () => {
    loadCSV();
});
