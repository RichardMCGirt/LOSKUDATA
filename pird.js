// Global Variables for Data Storage
let jobReportData = []; // To hold job report data
let checkboxStates = {}; // To track checkbox states

// Identify DOM Elements
const jobTableBody = document.querySelector('#job-report-table tbody');
const finalTableBody = document.querySelector('#final-table tbody');

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
                    const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!columns || columns.length < headers.length) return null;
                    return {
                        department: columns[0]?.trim(),
                        jobname: columns[1]?.trim(),
                        productnumber: columns[2]?.trim(),
                        Description: columns[3]?.trim(),
                        sellqty: parseFloat(columns[5]?.trim()) || 0,
                    };
                })
                .filter(row => row);

            renderJobReportTable();
        })
        .catch(error => console.error("Error loading file:", error));
}

// Render Job Report Table
function renderJobReportTable() {
    jobTableBody.innerHTML = ''; // Clear table content

    jobReportData.forEach((row, index) => {
        const tr = document.createElement('tr');
        const isChecked = !!checkboxStates[index];
        tr.innerHTML = `
            <td>${row.jobname}</td>
            <td>${row.productnumber}</td>
            <td>${row.Description}</td>
            <td>${row.sellqty}</td>
            <td><input type="checkbox" id="checkbox-${index}" ${isChecked ? 'checked' : ''} /></td>
        `;
        jobTableBody.appendChild(tr);

        // Attach Event Listener for Checkboxes
        tr.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            handleCheckboxChange(e.target.checked, row);
        });
    });
}

// Handle Checkbox State Change
function handleCheckboxChange(isChecked, rowData) {
    const productNumber = rowData.productnumber.trim().toUpperCase();
    const sellQty = rowData.sellqty;

    let existingRow = finalCountsData.find(r => r.stockSku === productNumber);

    if (isChecked) {
        if (existingRow) {
            existingRow.fieldCount += sellQty;
        } else {
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
            existingRow.fieldCount -= sellQty;
            if (existingRow.fieldCount <= 0) {
                finalCountsData = finalCountsData.filter(r => r.stockSku !== productNumber);
            }
        }
    }

    renderFinalCountsTable();
}

// Render Final Counts Table
function renderFinalCountsTable() {
    finalTableBody.innerHTML = ''; // Clear existing rows

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
