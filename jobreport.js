// Retrieve the filtered rows from sessionStorage
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

// Save checkbox states to sessionStorage
function saveCheckboxStates() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const states = {};
    checkboxes.forEach((checkbox, index) => {
        states[index] = checkbox.checked;

        // Update the fieldCount value when the checkbox is checked
        if (checkbox.checked) {
            const row = jobReportData[index];
            if (row) {
                row.fieldCount = (parseFloat(row.fieldCount) || 0) + 1; // Increment fieldCount
            }
        }
    });
    sessionStorage.setItem('checkboxStates', JSON.stringify(states));
    sessionStorage.setItem('jobReportData', JSON.stringify(jobReportData)); // Save updated data
}

// Attach event listener to checkboxes
tableBody.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        saveCheckboxStates();
    }
});

// Enable arrow key navigation
document.addEventListener('keydown', (e) => {
    const focusedElement = document.activeElement;

    // Ensure the focused element is inside the table
    if (focusedElement.tagName === 'TD' || focusedElement.tagName === 'INPUT') {
        const currentCell = focusedElement;
        const currentRow = currentCell.parentElement;
        const table = currentRow.parentElement;

        // Get the row and column index
        const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
        const rowIndex = Array.from(table.children).indexOf(currentRow);

        // Determine action based on key pressed
        switch (e.key) {
            case 'ArrowRight': // Move right
                if (cellIndex < currentRow.children.length - 1) {
                    currentRow.children[cellIndex + 1].focus();
                }
                break;
            case 'ArrowLeft': // Move left
                if (cellIndex > 0) {
                    currentRow.children[cellIndex - 1].focus();
                }
                break;
            case 'ArrowDown': // Move down
                if (rowIndex < table.children.length - 1) {
                    table.children[rowIndex + 1].children[cellIndex].focus();
                }
                break;
            case 'ArrowUp': // Move up
                if (rowIndex > 0) {
                    table.children[rowIndex - 1].children[cellIndex].focus();
                }
                break;
            case 'Enter': // Toggle checkbox on Enter
                if (focusedElement.tagName === 'INPUT' && focusedElement.type === 'checkbox') {
                    focusedElement.checked = !focusedElement.checked;
                    saveCheckboxStates(); // Save updated state
                }
                break;
        }
    }
});
