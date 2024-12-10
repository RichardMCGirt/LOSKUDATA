const cityDropdown = document.getElementById('city-dropdown');
const fileInput = document.getElementById('file-input');
const tableBody = document.querySelector('#result-table tbody');
const exportButton = document.getElementById('export-button');

let rows = []; // To store the parsed data from the uploaded file
let filteredRows = []; // Store filtered rows based on dropdown selection

// Function to display filtered rows in the table
function displayRows(filteredRows) {
    console.log("Filtered Rows to Display:", filteredRows); // Log the filtered rows
    tableBody.innerHTML = ''; // Clear previous rows
    if (filteredRows.length === 0) {
        console.warn("No rows match the selected city.");
    }
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
              <td>${row.sellprice}</td>
              <td>${row.productcost}</td>
              <td>${row.xsellprice}</td>
            <td>${row.xproductcost}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Handle file upload
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        console.log("File Uploaded:", file.name); // Log file upload
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            console.log("File Content:", text); // Log raw file content
            const lines = text.split('\n'); // Split by line
            console.log("Lines Extracted from File:", lines); // Log extracted lines
            // Skip the first two rows and extract headers from the third row
const headers = lines[2].split(',').map(header => header.trim());
console.log("Headers:", headers);

// Skip the first three rows to process only the data rows
rows = lines.slice(3)
    .map(line => line.split(','))
    .filter(columns => columns.length > 11) // Ensure at least 12 columns
    .map(columns => ({
        cperson: columns[0]?.trim(),
        branch: columns[1]?.trim(),
        jobname: columns[2]?.trim(),
        sonumber: columns[3]?.trim(),
        productnumber: columns[5]?.trim(),
        Description: columns[6]?.trim(),
        sellqty: columns[7]?.trim(),
        sellprice: columns[8]?.trim(),
        productcost: columns[9]?.trim(),
        xsellprice: columns[10]?.trim(),
        xproductcost: columns[11]?.trim(),
    }))
    .filter(row => row.branch); // Filter out empty rows


            console.log("Parsed Rows:", rows); // Log parsed rows
            console.log("Header Rows:", lines.slice(0, 3));
            console.log("Data Rows Start:", lines.slice(3, 6)); // Log first few data rows
            
            // Enable the dropdown after file is uploaded
            cityDropdown.disabled = false;
            console.log("Dropdown enabled.");
        };
        reader.readAsText(file);
    } else {
        console.error("No file selected.");
    }
});

// Handle city selection from the dropdown
cityDropdown.addEventListener('change', (event) => {
    const selectedCity = event.target.value.toLowerCase(); // Convert selected city to lowercase
    console.log("City Selected:", selectedCity); // Log the selected city
    if (selectedCity) {
        filteredRows = rows.filter(row => 
            row.branch?.toLowerCase().includes(selectedCity) // Use 'branch' instead of 'city'
        );
        console.log("Rows Matching Selected City:", filteredRows); // Log rows matching the city
        displayRows(filteredRows);
    } else {
        console.log("No city selected, clearing table.");
        tableBody.innerHTML = ''; // Clear table if no city selected
        filteredRows = []; // Clear filtered rows
    }
});


// Handle CSV export
exportButton.addEventListener('click', () => {
    if (!filteredRows.length) {
        alert('No data available for the selected city.');
        return;
    }

    // Escape special characters and generate CSV content
    const escapeValue = (value) => `"${(value || '').replace(/"/g, '""')}"`;
    const headers = ['Master Account Name', 'Branch', 'SO Number', 'Date', 'Total', 'SO Total'];
    const csvContent = [
        headers.join(','),
        ...filteredRows.map(row =>
            [escapeValue(row.master), escapeValue(row.city), escapeValue(row.soNumber), escapeValue(row.date), escapeValue(row.total), escapeValue(row.SOtotal)].join(',')
        )
    ].join('\n').trim();

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cityDropdown.value}_filtered_export.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Display success alert
    alert(`CSV file for "${cityDropdown.value}" has been successfully exported.`);
});
