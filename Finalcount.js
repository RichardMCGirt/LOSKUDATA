// Retrieve data from sessionStorage and localStorage
let jobReportData = JSON.parse(sessionStorage.getItem('jobReportData') || '[]');
const checkboxStates = JSON.parse(sessionStorage.getItem('checkboxStates') || '{}');
let finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');

console.log('Retrieved Job Report Data:', jobReportData);
console.log('Retrieved Final Counts Data:', finalCountsData);

// Identify DOM elements
const jobTableBody = document.querySelector('#job-report-table tbody');
const finalTableBody = document.querySelector('#final-table tbody');

// Render Job Report Table
function renderJobReportTable() {
    if (!jobTableBody) {
        console.log('Job Report Table not found on this page. Skipping rendering.');
        return;
    }

    jobTableBody.innerHTML = ''; // Clear existing rows
    jobReportData
        .filter(row => row.productnumber &&
            !row.productnumber.trim().toUpperCase().includes('DELIVERY') &&
            !row.productnumber.trim().toUpperCase().includes('LABOR')) // Filter out unwanted rows
        .forEach((row, index) => {
            const tr = document.createElement('tr');
            const isChecked = !!checkboxStates[index]; // Ensure checkbox state is boolean
            tr.innerHTML = `
                <td tabindex="0">${row.cperson}</td>
                <td tabindex="0">${row.jobname}</td>
                <td tabindex="0">${row.productnumber}</td>
                <td tabindex="0">${row.Description}</td>
                <td tabindex="0">${row.sellqty}</td>
                <td tabindex="0">
                    <input type="checkbox" id="checkbox-${index}" ${isChecked ? 'checked' : ''} />
                </td>
            `;
            jobTableBody.appendChild(tr);
        });

    // Attach checkbox event listener
    jobTableBody.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            saveCheckboxStates();
        }
    });
}

// Save checkbox states and update final counts
function saveCheckboxStates() {
    const checkboxes = document.querySelectorAll('#job-report-table input[type="checkbox"]');
    const states = {};
    checkboxes.forEach((checkbox, index) => {
        states[index] = checkbox.checked;
        const row = jobReportData[index];
        if (row) {
            const sellqty = parseFloat(row.sellqty.replace(/[^0-9.]/g, '')) || 0;
            const productnumber = row.productnumber.trim().toUpperCase();
            updateFinalCount(productnumber, sellqty, checkbox.checked);
        }
    });
    sessionStorage.setItem('checkboxStates', JSON.stringify(states));
    sessionStorage.setItem('jobReportData', JSON.stringify(jobReportData));
    localStorage.setItem('finalCountsUpdated', Date.now().toString());
}

// Update Final Count in localStorage
function updateFinalCount(productnumber, quantity, isChecked) {
    let finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');
    productnumber = productnumber.trim().toUpperCase();

    let skuRow = finalCountsData.find(row => row.stockSku.trim().toUpperCase() === productnumber);

    if (skuRow) {
        const oldFieldCount = parseFloat(skuRow.fieldCount) || 0;
        if (isChecked) {
            skuRow.fieldCount = oldFieldCount + quantity;
        } else {
            skuRow.fieldCount = Math.max(0, oldFieldCount - quantity);
        }
    } else if (isChecked) {
        skuRow = {
            stockSku: productnumber,
            fieldCount: quantity,
            warehouseCount: 0,
            currentQOH: 0,
            discrepancy: 0
        };
        finalCountsData.push(skuRow);
    }

    localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
    console.log('Updated Final Counts Data (First Record Only):', finalCountsData[0]);

    renderFinalCountsTable();
}

// Render Final Counts Table
function renderFinalCountsTable() {
    if (!finalTableBody) {
        console.log('Final Counts Table not found on this page. Skipping rendering.');
        return;
    }

    finalTableBody.innerHTML = ''; // Clear existing rows
    if (!finalCountsData || finalCountsData.length === 0) {
        finalTableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }

    finalCountsData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.stockSku}</td>
            <td>${row.fieldCount}</td>
            <td><input type="number" id="warehouseCount-${index}" value="${row.warehouseCount}" min="0" /></td>
            <td id="finalInventory-${index}">${parseFloat(row.fieldCount || 0) + parseFloat(row.warehouseCount || 0)}</td>
            <td>${row.currentQOH}</td>
            <td>${row.discrepancy}</td>
        `;
        finalTableBody.appendChild(tr);

        const warehouseCountInput = tr.querySelector(`#warehouseCount-${index}`);
        if (warehouseCountInput) {
            warehouseCountInput.addEventListener('input', () => {
                updateFinalInventory(index, warehouseCountInput.value);
            });
        }
    });
}

// Update Final Inventory
function updateFinalInventory(index, value) {
    const warehouseCount = parseFloat(value) || 0;
    const fieldCount = parseFloat(finalCountsData[index].fieldCount) || 0;

    finalCountsData[index].warehouseCount = Math.max(0, warehouseCount);
    document.querySelector(`#finalInventory-${index}`).textContent = warehouseCount + fieldCount;

    localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
}

// Listen for Storage Updates
window.addEventListener('storage', (e) => {
    if (e.key === 'finalCountsUpdated') {
        renderFinalCountsTable();
    }
});

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderJobReportTable();
    renderFinalCountsTable();
});
