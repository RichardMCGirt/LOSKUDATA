// Retrieve the data from localStorage
let finalCountsData = JSON.parse(localStorage.getItem('finalCountsData') || '[]');
console.log('Retrieved Final Counts Data:', finalCountsData);

const tableBody = document.querySelector('#final-table tbody');

// Remove duplicates from finalCountsData and accumulate quantities
function removeDuplicatesAndAccumulate(data) {
    console.log("Removing duplicates and accumulating fieldCount...");
    const uniqueData = [];
    const seenSkus = new Map(); // Map to track seen SKUs and their fieldCount

    data.forEach(row => {
        console.log(`Processing SKU: ${row.stockSku}, Current Field Count: ${row.fieldCount}`);
        if (seenSkus.has(row.stockSku)) {
            // Accumulate fieldCount if SKU already exists
            const existingRow = seenSkus.get(row.stockSku);
            const prevFieldCount = parseFloat(existingRow.fieldCount || 0);
            const addedFieldCount = parseFloat(row.fieldCount || 0);
            existingRow.fieldCount = prevFieldCount + addedFieldCount;
            console.log(`Accumulated Field Count for SKU: ${row.stockSku}, Previous: ${prevFieldCount}, Added: ${addedFieldCount}, New: ${existingRow.fieldCount}`);
        } else {
            // Add new SKU to uniqueData and Map
            const newRow = { ...row };
            seenSkus.set(newRow.stockSku, newRow);
            uniqueData.push(newRow);
            console.log(`Added new SKU: ${newRow.stockSku}, Initial Field Count: ${newRow.fieldCount}`);
        }
    });

    console.log("Final unique data after duplicate removal:", uniqueData);
    return uniqueData;
}


// Save unique finalCountsData back to localStorage
finalCountsData = removeDuplicatesAndAccumulate(finalCountsData);
localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
console.log('Final Counts Data after duplicate removal and accumulation:', finalCountsData);

// Render table rows
function renderFinalCountsTable() {
    console.log("Rendering Final Counts Table...");
    tableBody.innerHTML = ''; // Clear existing rows

    finalCountsData.forEach((row, index) => {
        console.log(`Rendering Row for SKU: ${row.stockSku}, Field Count: ${row.fieldCount}, Warehouse Count: ${row.warehouseCount}`);
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
    console.log(`Updating Final Inventory for Row Index: ${index}...`);
    const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);
    const finalInventoryCell = document.querySelector(`#finalInventory-${index}`);

    let warehouseCount = parseFloat(warehouseCountInput.value) || 0;
    const fieldCount = parseFloat(finalCountsData[index].fieldCount) || 0;

    console.log(`Original Warehouse Count: ${warehouseCount}, Field Count: ${fieldCount}`);

    if (warehouseCount < 0) {
        warehouseCount = 0;
        warehouseCountInput.value = 0;
    }

    const finalInventory = warehouseCount + fieldCount;
    console.log(`New Final Inventory: ${finalInventory}`);
    finalInventoryCell.textContent = finalInventory;

    finalCountsData[index].warehouseCount = warehouseCount;
    localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
    console.log('Updated Final Counts Data saved to localStorage:', finalCountsData);
}

// Attach event listeners to Warehouse Count inputs
function attachWarehouseListeners() {
    console.log("Attaching event listeners to Warehouse Count inputs...");
    finalCountsData.forEach((_, index) => {
        const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);
        warehouseCountInput.addEventListener('input', () => updateFinalInventory(index));
    });
}

// Listen for changes in localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'finalCountsData' || e.key === 'finalCountsUpdated') {
        console.log("Detected changes in finalCountsData...");
        finalCountsData = removeDuplicatesAndAccumulate(JSON.parse(localStorage.getItem('finalCountsData') || '[]'));
        localStorage.setItem('finalCountsData', JSON.stringify(finalCountsData)); // Save the unique data
        console.log('Final Counts Data updated after storage change:', finalCountsData);
        renderFinalCountsTable();
        attachWarehouseListeners();
    }
});

// Initial render
console.log("Initial Table Rendering...");
renderFinalCountsTable();
attachWarehouseListeners();

if (finalCountsData.length === 0) {
    console.warn('No data to display.');
}