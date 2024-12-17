// Retrieve Job Report Data
const jobReportData = JSON.parse(sessionStorage.getItem('jobReportData') || '[]');
const checkboxStates = JSON.parse(sessionStorage.getItem('checkboxStates') || '{}');
console.log('Retrieved Job Report Data:', jobReportData);

// Initialize Final Counts Data
let finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');
console.log('Retrieved Final Counts Data:', finalCountsData);

// Get Table Bodies
const jobTableBody = document.querySelector('#job-report-table tbody');
const finalTableBody = document.querySelector('#final-table tbody');

// Render Job Report Table
function renderJobReportTable() {
    console.log('Rendering Job Report Table...');
    jobTableBody.innerHTML = ''; // Clear table content

    jobReportData
        .forEach((row, index) => {
            const isChecked = !!checkboxStates[index]; // Ensure checkbox state is boolean
            const tr = document.createElement('tr');
            tr.innerHTML = `
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

    // Attach event listeners to checkboxes
    jobTableBody.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const rowIndex = parseInt(e.target.id.split('-')[1], 10);
            const rowData = jobReportData[rowIndex];
            console.log(`Checkbox Change Detected: Row ${rowIndex}, Checked: ${e.target.checked}`);
            handleCheckboxChange(e.target.checked, rowData);
        }
    });
}

function handleCheckboxChange(isChecked, rowData) {
    const productNumber = rowData.productnumber ? rowData.productnumber.trim().replace(/"/g, '').toUpperCase() : null;
    const rawSellQty = rowData.sellqty ? rowData.sellqty.trim().replace(/"/g, '') : "0";
    const sellQty = parseFloat(rawSellQty) || 0;

    if (!productNumber || sellQty <= 0) {
        console.warn(`Invalid data for row. Product #: "${productNumber}", Sell Qty: ${rawSellQty}`);
        return;
    }

    console.log(`Handling Checkbox Change: Product # ${productNumber}, Sell Qty: ${sellQty}, Checked: ${isChecked}`);

    // Find only visible rows with the matching SKU
    let existingRow = Array.from(finalTableBody.rows).find(
        r => r.style.display !== 'none' && r.cells[0].textContent.trim().toUpperCase() === productNumber
    );

    if (isChecked) {
        if (existingRow) {
            const currentCount = parseFloat(existingRow.cells[1].textContent) || 0;
            const newCount = currentCount + sellQty;
            existingRow.cells[1].textContent = newCount;
            console.log(`Updated Row: Product # ${productNumber}, New Field Count: ${newCount}`);
        } else {
            console.log(`Adding New Row: Product # ${productNumber}, Field Count: ${sellQty}`);
            const tr = document.createElement('tr');
            tr.style.display = ''; // Ensure it's visible
            tr.innerHTML = `
                <td>${productNumber}</td>
                <td>${sellQty}</td>
                <td><input type="number" value="0" min="0" /></td>
                <td>${sellQty}</td>
                <td>0</td>
                <td>0</td>
            `;
            finalTableBody.appendChild(tr);
        }
    } else {
        if (existingRow) {
            const currentCount = parseFloat(existingRow.cells[1].textContent) || 0;
            const newCount = Math.max(0, currentCount - sellQty);
            existingRow.cells[1].textContent = newCount;
            console.log(`Updated Row (Unchecked): Product # ${productNumber}, New Field Count: ${newCount}`);

            if (newCount === 0) {
                console.log(`Removing Row: Product # ${productNumber} as Field Count is 0`);
                existingRow.style.display = 'none'; // Hide instead of removing
            }
        }
    }
}



// Render Final Counts Table
function renderFinalCountsTable() {
    console.log('Rendering Final Counts Table...');
    finalTableBody.innerHTML = ''; // Clear existing rows

    finalCountsData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.stockSku}</td>
            <td>${row.fieldCount}</td>
            <td><input type="number" id="warehouseCount-${index}" value="${row.warehouseCount || 0}" min="0" /></td>
            <td id="finalInventory-${index}">${parseFloat(row.fieldCount || 0) + parseFloat(row.warehouseCount || 0)}</td>
            <td>${row.currentQOH}</td>
            <td>${row.discrepancy}</td>
        `;
        finalTableBody.appendChild(tr);
    });
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Page...');
    renderJobReportTable();
    renderFinalCountsTable();
});
