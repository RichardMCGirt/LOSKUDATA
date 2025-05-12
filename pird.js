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


function renderJobReportTable() {
    console.log('Rendering Job Report Table...');
    jobTableBody.innerHTML = ''; // Clear current table rows

    jobReportData.forEach((row, index) => {
        if (!row) return;

        const isChecked = !!checkboxStates[index];

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.jobname || ''}</td>
            <td>${row.productnumber || ''}</td>
            <td>${row.Description || ''}</td>
            <td>${row.sellqty || ''}</td>
            <td>
                <input 
                    type="checkbox" 
                    class="nav-checkbox" 
                    id="checkbox-${index}" 
                    data-index="${index}" 
                    ${isChecked ? 'checked' : ''} 
                    tabindex="0"
                />
            </td>
        `;
        jobTableBody.appendChild(tr);
    });

    // 🔁 Attach navigation events AFTER checkboxes exist in DOM
    setTimeout(() => {
        const allCheckboxes = document.querySelectorAll('.nav-checkbox');

        allCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener('keydown', (e) => {
                const currentIndex = parseInt(checkbox.dataset.index, 10);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = document.querySelector(`.nav-checkbox[data-index="${currentIndex + 1}"]`);
                    if (next) next.focus();
                }

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = document.querySelector(`.nav-checkbox[data-index="${currentIndex - 1}"]`);
                    if (prev) prev.focus();
                }

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    }, 0); // Ensure all checkboxes are rendered first

    // ✅ Delegated change listener
    jobTableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('nav-checkbox')) {
            const rowIndex = parseInt(e.target.dataset.index, 10);
            if (isNaN(rowIndex) || !jobReportData[rowIndex]) return;

            checkboxStates[rowIndex] = e.target.checked;
            handleCheckboxChange(e.target.checked, jobReportData[rowIndex]);
        }
    });
}




function handleCheckboxChange(isChecked, rowData) {
    console.log("---- HANDLE CHECKBOX CHANGE ----");
    console.log(`Checkbox State: ${isChecked ? 'Checked' : 'Unchecked'}`);
    console.log("Row Data Received:", rowData);

    // Extract and normalize data
    const jobName = rowData.jobname.trim();
    const productNumber = rowData.productnumber.trim().toUpperCase();
    const sellQty = rowData.sellqty;
    const branch = rowData.branch.trim().toUpperCase();

    // Prevent adding rows with empty product numbers or zero sell quantity
    if (!productNumber) {
        console.warn("Product Number is empty. Skipping row addition.");
        return;
    }

    if (sellQty <= 0) {
        console.warn("Sell Quantity is zero or invalid. Skipping row addition.");
        return;
    }

    console.log(`Job Name: "${jobName}", Product Number: "${productNumber}", Branch: "${branch}", Sell Qty: ${sellQty}`);

    // Check if the product already exists in finalCountsData
    let existingRow = finalCountsData.find(r => r.stockSku === productNumber);

    if (isChecked) {
        if (existingRow) {
            console.log(`Updating existing row for product ${productNumber}`);
            existingRow.fieldCount += sellQty;
        } else {
            console.log(`Adding new row for product ${productNumber}`);
            finalCountsData.push({
                stockSku: productNumber,
                fieldCount: sellQty,
                warehouseCount: 0,
                currentQOH: 0,
                discrepancy: 0
            });
        }
    } else {
        if (existingRow) {
            console.log(`Reducing row count for product ${productNumber}`);
            existingRow.fieldCount -= sellQty;
            if (existingRow.fieldCount <= 0) {
                finalCountsData = finalCountsData.filter(r => r.stockSku !== productNumber);
            }
        }
    }

    // ✅ Ensure checkboxes in the UI reflect the state correctly
    jobReportData.forEach((row, index) => {
        if (row.jobname.trim() === jobName && row.branch.trim().toUpperCase() === branch) {
            const checkboxElement = document.getElementById(`checkbox-${index}`);
            if (checkboxElement) {
                checkboxElement.checked = isChecked;
                checkboxStates[index] = isChecked;
            }
        }
    });

    console.log("Updated Final Counts Data:", finalCountsData);
    console.log("---- END HANDLE CHECKBOX CHANGE ----");

    renderFinalCountsTable(); // Re-render the final table
}


// Render Final Counts Table with Logging for Second Row
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
            <td><input type="number" value="${row.warehouseCount}" min="0" id="warehouse-${index}" /></td>
            <td>${row.fieldCount + row.warehouseCount}</td>
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

    // Log the second row in finalCountsData if it exists
    if (finalCountsData.length > 1) {
        console.log('Logging Second Row in Final Table:', finalCountsData[1]);
    } else {
        console.warn('Second row does not exist in Final Table.');
    }
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

document.addEventListener('keydown', function (e) {
    if (e.target.classList.contains('nav-checkbox')) {
        const currentIndex = parseInt(e.target.getAttribute('data-index'), 10);

        if (e.key === 'ArrowDown') {
            const nextCheckbox = document.querySelector(`.nav-checkbox[data-index="${currentIndex + 1}"]`);
            if (nextCheckbox) nextCheckbox.focus();
            e.preventDefault();
        }

        if (e.key === 'ArrowUp') {
            const prevCheckbox = document.querySelector(`.nav-checkbox[data-index="${currentIndex - 1}"]`);
            if (prevCheckbox) prevCheckbox.focus();
            e.preventDefault();
        }
    }
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
    const filePath = 'https://raw.githubusercontent.com/RichardMCGirt/LOSKUDATA/aaadeaf01c389da8972a54c7429bd96ce5b4fbef/downloads/OpenOrdersByCounterPerson-Detail-1736179445-745847148.csv';
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
            <td>
                <input 
                    type="checkbox" 
                    class="nav-checkbox"
                    id="checkbox-${index}" 
                    data-index="${index}"
                    tabindex="0"
                />
            </td>
        `;
        const checkbox = tr.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            updateFinalTable(row, e.target.checked);
        });

        // Add arrow key navigation
        checkbox.addEventListener('keydown', (e) => {
            const currentIndex = parseInt(checkbox.dataset.index, 10);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = document.querySelector(`.nav-checkbox[data-index="${currentIndex + 1}"]`);
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = document.querySelector(`.nav-checkbox[data-index="${currentIndex - 1}"]`);
                if (prev) prev.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
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
