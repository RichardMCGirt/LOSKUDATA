// Retrieve the data from localStorage
let finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');
console.log('Retrieved Final Counts Data:', finalCountsData);

const tableBody = document.querySelector('#final-table tbody');

// Remove duplicates from finalCountsData based on stockSku
function removeDuplicates(data) {
    const uniqueData = [];
    const seenSkus = new Set();

    data.forEach(row => {
        if (!seenSkus.has(row.stockSku)) {
            uniqueData.push(row);
            seenSkus.add(row.stockSku);
        }
    });

    return uniqueData;
}

// Save unique finalCountsData back to localStorage
finalCountsData = removeDuplicates(finalCountsData);
localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
console.log('Final Counts Data after duplicate removal:', finalCountsData);

// Render table rows
function renderFinalCountsTable() {
    tableBody.innerHTML = ''; // Clear existing rows

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
        tableBody.appendChild(tr);
    });
}

// Update Final Inventory and Save Changes to localStorage
function updateFinalInventory(index) {
    const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);
    const finalInventoryCell = document.querySelector(`#finalInventory-${index}`);

    let warehouseCount = parseFloat(warehouseCountInput.value) || 0;
    const fieldCount = parseFloat(finalCountsData[index].fieldCount) || 0;

    if (warehouseCount < 0) {
        warehouseCount = 0;
        warehouseCountInput.value = 0;
    }

    const finalInventory = warehouseCount + fieldCount;
    finalInventoryCell.textContent = finalInventory;

    finalCountsData[index].warehouseCount = warehouseCount;
    localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
    console.log('Updated Final Counts Data saved to localStorage:', finalCountsData);
}

// Attach event listeners to Warehouse Count inputs
function attachWarehouseListeners() {
    finalCountsData.forEach((_, index) => {
        const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);
        warehouseCountInput.addEventListener('input', () => updateFinalInventory(index));
    });
}

// Listen for changes in localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'finalCountsData' || e.key === 'finalCountsUpdated') {
        finalCountsData = removeDuplicates(JSON.parse(localStorage.getItem('finalCountsData') || '[]'));
        localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData)); // Save the unique data
        console.log('Final Counts Data updated:', finalCountsData);
        renderFinalCountsTable();
        attachWarehouseListeners();
    }
});

// Initial render
renderFinalCountsTable();
attachWarehouseListeners();

if (finalCountsData.length === 0) {
    console.warn('No data to display.');
}
