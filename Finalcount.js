// Retrieve the data from sessionStorage
let finalCountsData = JSON.parse(sessionStorage.getItem('finalCountsData') || '[]');
console.log('Retrieved Final Counts Data:', finalCountsData);

// Populate the table with the retrieved data
const tableBody = document.querySelector('#final-table tbody');

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

// Update Final Inventory and Save Changes to sessionStorage
function updateFinalInventory(index) {
    const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);
    const finalInventoryCell = document.querySelector(`#finalInventory-${index}`);

    let warehouseCount = parseFloat(warehouseCountInput.value) || 0; // Get updated Warehouse Count
    const fieldCount = parseFloat(finalCountsData[index].fieldCount) || 0; // Retrieve fieldCount from finalCountsData

    // Ensure values are not negative
    if (warehouseCount < 0) {
        warehouseCount = 0;
        warehouseCountInput.value = 0; // Reset input value to 0
    }

    // Calculate finalInventory as the sum of fieldCount and warehouseCount
    const finalInventory = warehouseCount + fieldCount;

    // Update the table cell
    finalInventoryCell.textContent = finalInventory;

    // Update the finalCountsData array
    finalCountsData[index].warehouseCount = warehouseCount;

    // Save the updated data back to sessionStorage
    sessionStorage.setItem('finalCountsData', JSON.stringify(finalCountsData));
    console.log('Updated Final Counts Data saved to sessionStorage:', finalCountsData);
}

// Attach event listeners to Warehouse Count inputs
finalCountsData.forEach((_, index) => {
    const warehouseCountInput = document.querySelector(`#warehouseCount-${index}`);

    // Listen for changes to recalculate final inventory and save changes
    warehouseCountInput.addEventListener('input', () => updateFinalInventory(index));
});

if (finalCountsData.length === 0) {
    console.warn('No data to display.');
}
