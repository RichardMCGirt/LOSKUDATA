// Retrieve the filtered rows and checkbox states from sessionStorage
let jobReportData = JSON.parse(sessionStorage.getItem('jobReportData') || '[]');
const checkboxStates = JSON.parse(sessionStorage.getItem('checkboxStates') || '{}'); // Load saved checkbox states
console.log('Retrieved Job Report Data:', jobReportData);

// Populate the table with the retrieved data
const tableBody = document.querySelector('#job-report-table tbody');
jobReportData
    .filter(row => row.productnumber &&
        !row.productnumber.trim().toUpperCase().includes('DELIVERY') &&
        !row.productnumber.trim().toUpperCase().includes('LABOR')) // Filter out rows with "DELIVERY" or "LABOR" in productnumber
    .forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td tabindex="0">${row.cperson}</td>
            <td tabindex="0">${row.jobname}</td>
            <td tabindex="0">${row.productnumber}</td>
            <td tabindex="0">${row.Description}</td>
            <td tabindex="0">${row.sellqty}</td>
            <td tabindex="0">
                <input type="checkbox" id="checkbox-${index}" ${checkboxStates[index] ? 'checked' : ''} />
            </td>
        `;
        tableBody.appendChild(tr);
    });

if (jobReportData.length === 0) {
    console.warn('No data to display.');
    alert('No data available for the selected city.');
}

// Save checkbox states and update field count
function saveCheckboxStates() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const states = {};
    checkboxes.forEach((checkbox, index) => {
        states[index] = checkbox.checked;

        const row = jobReportData[index];
        if (row) {
            const sellqty = parseFloat(row.sellqty) || 0;

            if (checkbox.checked) {
                console.log(`Checked: Product: ${row.productnumber}, Quantity: ${sellqty}`);
                row.fieldCount = (parseFloat(row.fieldCount) || 0) + sellqty;
                updateFinalCount(row.productnumber, sellqty, true);
            } else {
                console.log(`Unchecked: Product: ${row.productnumber}, Quantity: ${sellqty}`);
                row.fieldCount = Math.max((parseFloat(row.fieldCount) || 0) - sellqty, 0);
                updateFinalCount(row.productnumber, sellqty, false);
            }
        }
    });

    sessionStorage.setItem('checkboxStates', JSON.stringify(states));
    sessionStorage.setItem('jobReportData', JSON.stringify(jobReportData));
}

function updateFinalCount(productnumber, quantity, isChecked) {
    console.log(`Updating Final Count: Product: ${productnumber}, Quantity: ${quantity}, Checked: ${isChecked}`);
    const finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');

    // Find the record in finalCountsData
    let skuRow = finalCountsData.find(row => row.stockSku === productnumber);

    if (skuRow) {
        // Update existing SKU
        if (isChecked) {
            skuRow.fieldCount = (parseFloat(skuRow.fieldCount) || 0) + quantity;
            console.log(`Updated existing SKU: ${productnumber}, New Field Count: ${skuRow.fieldCount}`);
        } else {
            skuRow.fieldCount = Math.max((parseFloat(skuRow.fieldCount) || 0) - quantity, 0);
            console.log(`Updated existing SKU: ${productnumber}, New Field Count: ${skuRow.fieldCount}`);
        }
    } else if (isChecked) {
        // Add new SKU to finalCountsData
        skuRow = {
            stockSku: productnumber,
            fieldCount: quantity,
            warehouseCount: 0,
            currentQOH: 0,
            discrepancy: 0
        };
        finalCountsData.push(skuRow);
        console.log(`Added new SKU: ${productnumber}, Field Count: ${quantity}`);
    }

    // Save updated finalCountsData to localStorage
    localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
    console.log('Final Counts Data saved to localStorage:', finalCountsData);

    // Trigger a storage event manually for instant sync
    localStorage.setItem('finalCountsUpdated', Date.now().toString());
}

// Attach event listener to checkboxes
tableBody.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        saveCheckboxStates();
    }
});
