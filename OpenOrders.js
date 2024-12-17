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
    const filePath = '/custom/downloads/OpenOrdersByCounterPerson-Detail-1734033634-1221046826.csv';
    fetch(filePath)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            const headers = lines[2].split(',').map(header => header.trim());

            rows = lines.slice(3)
                .map(line => line.split(','))
                .filter(columns => columns.length > 11) // Ensure valid rows
                .map(columns => ({
                    cperson: columns[0]?.trim(),
                    branch: columns[1]?.trim(),
                    jobname: columns[2]?.trim(),
                    sonumber: columns[3]?.trim(),
                    productnumber: columns[5]?.trim(),
                    Description: columns[6]?.trim(),
                    sellqty: parseFloat(columns[7]?.trim()) || 0,
                }))
                .filter(row => row.branch);

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
            <td>${row.cperson}</td>
            <td>${row.branch}</td>
            <td>${row.jobname}</td>
            <td>${row.sonumber}</td>
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

// Render Final Counts Table
function renderFinalCountsTable() {
    finalTableBody.innerHTML = '';
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
        tr.querySelector(`#warehouse-${index}`).addEventListener('input', (e) => {
            row.warehouseCount = parseFloat(e.target.value) || 0;
            renderFinalCountsTable();
        });
        finalTableBody.appendChild(tr);
    });
}

// Handle Dropdown Change
cityDropdown.addEventListener('change', () => {
    const selectedCity = cityDropdown.value.toLowerCase();
    filteredRows = rows.filter(row => row.branch?.toLowerCase().includes(selectedCity));
    displayFilteredRows(); // Show filtered rows in the Result Table
    displayJobReportTable(); // Show rows in Job Report Table
    finalCountsData = []; // Reset Final Table
    renderFinalCountsTable(); // Clear Final Table
});

// Export Filtered Rows as CSV
exportButton.addEventListener('click', () => {
    const headers = ['Counter Person', 'Branch', 'Job Name', 'SO Number', 'Product #', 'Description', 'Sell Qty'];
    const csvContent = [
        headers.join(','),
        ...filteredRows.map(row => [
            `"${row.cperson}"`, `"${row.branch}"`, `"${row.jobname}"`, 
            `"${row.sonumber}"`, `"${row.productnumber}"`, `"${row.Description}"`, `"${row.sellqty}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cityDropdown.value}_export.csv`;
    a.click();
});

// Initialize Data Loading
document.addEventListener('DOMContentLoaded', () => {
    loadCSV();
});
