// Global Variables for Data Storage
let jobReportData = []; // To hold job report data
let checkboxStates = {}; // To track checkbox states
let qohMap = {}; // Maps stockSku -> QOH Before

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
                        productnumber: columns[4]?.trim().replace(/^"|"$/g, '') || '',
                        Description: columns[5]?.trim().replace(/^"|"$/g, ''),
                        sellqty: sellQty,
                    };
                })
                .filter(row => 
                    row &&
                    row.productnumber &&
                    !row.productnumber.toLowerCase().includes('labor') &&
                    !row.productnumber.toLowerCase().includes('delivery')
                );
                
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
        console.warn("⚠️ Product Number is empty for row:", rowData);
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
    finalTableBody.innerHTML = ''; // Clear existing table rows

    if (finalCountsData.length === 0) {
        finalTableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }

    finalCountsData.forEach((row, index) => {
        const sku = row.stockSku.toUpperCase();
        const qohValue = qohMap[sku];
        const warehouseValue = row.warehouseCount || qohValue || 0;
        row.warehouseCount = warehouseValue;

        // ✅ Add log for expected behavior
        if (typeof qohValue === 'number' && row.warehouseCount === qohValue) {
            console.log(`✅ Appended ${qohValue} into warehouseCount for SKU: ${sku}`);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.stockSku}</td>
            <td>${row.fieldCount}</td>
            <td><input type="number" value="${warehouseValue}" min="0" id="warehouse-${index}" /></td>
            <td>${row.fieldCount}</td>
            <td>${row.currentQOH}</td>
            <td>${row.discrepancy}</td>
        `;

        // Attach event listener to update warehouseCount
        tr.querySelector(`#warehouse-${index}`).addEventListener('input', (e) => {
            row.warehouseCount = parseFloat(e.target.value) || 0;
            renderFinalCountsTable(); // Re-render table to reflect changes
        });

        finalTableBody.appendChild(tr);
    });

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

async function loadQOHData() {
    const qohUrl = 'https://raw.githubusercontent.com/RichardMCGirt/LOSKUDATA/refs/heads/test/PhysicalInventoryReportbylinecode-1747063922-481340921.csv';

    try {
        const response = await fetch(qohUrl);
        const text = await response.text();
        const lines = text.split('\n');
        const headers = lines[2].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        console.log("📌 QOH CSV Headers:", headers);


        const stockIndex = headers.indexOf("Product Number");
        const qohIndex = headers.indexOf("QOH Before");
        const descIndex = headers.indexOf("Product Description");
        
        lines.slice(3).forEach(line => {
            const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (!columns || columns.length <= Math.max(stockIndex, qohIndex, descIndex)) return;

            const stock = columns[stockIndex]?.replace(/^"|"$/g, '').trim().toUpperCase();
            const qoh = parseFloat(columns[qohIndex]?.replace(/^"|"$/g, '').trim()) || 0;
            const description = columns[descIndex]?.replace(/^"|"$/g, '').trim();

            if (stock) {
                qohMap[stock] = qoh;
            }

            if (description === "JUMBOB") {
                console.log(`🟡 Found JUMBOB: Stock = ${stock}, QOH Before = ${qoh}`);
            }
            
        });

        console.log("✅ Loaded QOH Map:", qohMap);
    } catch (err) {
        console.error("❌ Failed to load QOH CSV:", err);
    }
}

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
let hasJumbobRow = false; // Add this flag at the top of your script

function loadCSV() {
    const filePath = 'https://raw.githubusercontent.com/RichardMCGirt/LOSKUDATA/aaadeaf01c389da8972a54c7429bd96ce5b4fbef/downloads/OpenOrdersByCounterPerson-Detail-1736179445-745847148.csv';
    fetch(filePath)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            const headers = lines[2].split(',').map(header => header.trim());

            rows = lines.slice(3)
                .map(line => {
                    const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!columns || columns.length < 9) return null;

                    const description = columns[6]?.trim().replace(/^"|"$/g, '');
                    if (description === "JUMBOB") {
                        hasJumbobRow = true;
                    }

                    const rawSellQty = columns[7]?.trim().replace(/^"|"$/g, '');
                    const sellQty = parseFloat(rawSellQty) || 0;

                    return {
                        branch: columns[1]?.trim().replace(/^"|"$/g, ''),
                        jobname: columns[2]?.trim().replace(/^"|"$/g, ''),
                        productnumber: columns[5]?.trim().replace(/^"|"$/g, ''),
                        Description: description,
                        sellqty: sellQty,
                    };
                })
                .filter(row => 
                    row &&
                    row.productnumber &&
                    !row.productnumber.toLowerCase().includes('labor') &&
                    !row.productnumber.toLowerCase().includes('delivery')
                );
                
                if (hasJumbobRow) {
                    console.log("✅ Loaded Rows (JUMBOB present):", rows);
                }
                            cityDropdown.disabled = false;
        })
        .catch(error => console.error("Error loading CSV:", error));
}



// Display Filtered Rows in the Result Table
function displayFilteredRows() {
    tableBody.innerHTML = '';
    filteredRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = '#1e1e1e'; // Dark gray/black
        tr.style.color = '#f1f1f1'; // Light text for contrast
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
tr.style.backgroundColor = '#1e1e1e'; // Dark gray/black
tr.style.color = '#f1f1f1'; // Light text for contrast
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
function updateFinalTable(clickedRow, isChecked) {
    const jobName = clickedRow.jobname.trim();
    const branch = clickedRow.branch.trim();
    
    // Apply the checkbox change to all matching rows (same jobname and branch)
    filteredRows.forEach((row, index) => {
        const matchesJob = row.jobname.trim() === jobName && row.branch.trim() === branch;
        if (!matchesJob) return;

        const checkbox = document.getElementById(`checkbox-${index}`);
        if (checkbox) {
            checkbox.checked = isChecked;
        }

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
    });

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
        const sku = row.stockSku.toUpperCase();
        const qohValue = qohMap[sku];

        // ✅ Force-load QOH into warehouseCount
        row.warehouseCount = typeof qohValue === 'number' ? qohValue : 0;

        // ✅ Calculate discrepancy
        row.discrepancy = row.fieldCount - row.warehouseCount;

        // ✅ Optional: Log only when QOH exists and JUMBOB was in loaded rows
        if (typeof qohValue === 'number' && hasJumbobRow) {
            console.log(`✅ Appended ${qohValue} into warehouseCount for SKU: ${sku}`);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.stockSku}</td>
            <td>${row.fieldCount}</td>
            <td><input type="number" value="${row.warehouseCount}" min="0" id="warehouse-${index}" /></td>
            <td>${row.fieldCount}</td>
<td>${(parseInt(row.warehouseCount || 0) + parseInt(row.fieldCount || 0))}</td>
            <td>${row.discrepancy}</td>
        `;

        tr.querySelector(`#warehouse-${index}`).addEventListener('input', (e) => {
            row.warehouseCount = parseFloat(e.target.value) || 0;
            row.discrepancy = row.fieldCount - row.warehouseCount; // ✅ Recalculate on input
            renderFinalCountsTable(); // Re-render table
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

    filteredRows = rows
    .filter(row => row.branch?.toLowerCase().includes(selectedCity))
    .filter(row => 
        row &&
        row.productnumber &&
        !row.productnumber.toLowerCase().includes('labor') &&
        !row.productnumber.toLowerCase().includes('delivery')
    );
        displayFilteredRows(); // Populate filtered rows in Result Table
    displayJobReportTable(); // Populate rows in Job Report Table
    finalCountsData = []; // Reset Final Table
    renderFinalCountsTable(); // Clear Final Table
});





// Initialize Data Loading
document.addEventListener('DOMContentLoaded', async () => {
    await loadQOHData();
    loadCSV();
});

