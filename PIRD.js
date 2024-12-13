const tableBody = document.querySelector('#result-table tbody');
const exportButton = document.getElementById('export-button');

let rows = []; // To store the parsed data from the uploaded file

// Function to display rows in the table
function displayRows() {
    console.log("Rows to Display:", rows); // Log the rows to display
    tableBody.innerHTML = ''; // Clear previous rows

    // Debugging: Check if rows is empty
    if (rows.length === 0) {
        console.warn("No rows to display.");
        return;
    }

    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="hidden">${row.department}</td> 
            <td class="hidden">${row.class}</td> 
            <td>${row.productn}</td>
            <td>${row.productd}</td>
            <td>${row.qohb}</td>
            <td>${row.qoha}</td>
            <td>${row.costb}</td>
            <td>${row.costa}</td>
            <td>${row.countv}</td>
            <td>${row.qa}</td>
            <td>${row.qoo}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Add the class to hide the first column
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .hidden {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Simulate the file upload on page load
    loadAndParseFile('PhysicalInventoryReportbylinecode-1734097390-1900905674.csv');
});

// Function to load and parse the file content
function loadAndParseFile(fileName) {
    // For development, you would replace this with a real file path or use a local server to serve the file.
    fetch(fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not fetch the file: ${fileName}`);
            }
            return response.text();
        })
        .then(text => {
            console.log("File Content:", text); // Log raw file content

            const lines = text.split('\n'); // Split by line
            console.log("Lines Extracted from File:", lines); // Log extracted lines

            // Check if the file has enough lines
            if (lines.length < 4) {
                console.error("File does not contain enough lines. Expected at least 4.");
                return;
            }

            // Skip the first two rows and extract headers from the third row
            const headers = lines[2].split(',').map(header => header.trim());
            console.log("Headers:", headers);

            // Skip the first three rows to process only the data rows
            rows = lines.slice(3)
                .map(line => line.split(','))
                .filter(columns => columns.length > 12) // Ensure there are enough columns
                .map(columns => ({
                    department: columns[0]?.trim(),
                    class: columns[1]?.trim(),
                    productn: columns[2]?.trim(),
                    productd: columns[3]?.trim(),
                    qohb: columns[5]?.trim(),
                    qoha: columns[6]?.trim(),
                    costb: columns[7]?.trim(),
                    costa: columns[8]?.trim(),
                    countv: columns[9]?.trim(),
                    costv: columns[10]?.trim(),
                    qa: columns[11]?.trim(),
                    qoo: columns[12]?.trim(),
                }))
                .filter(row => row.department && row.class && row.productn); // Filter out empty rows

            // Debugging: Log the parsed rows to check data processing
            console.log("Parsed Rows:", rows);

            if (rows.length === 0) {
                console.warn("Parsed rows are empty. Check the input file format or processing logic.");
            } else {
                console.log("Parsed rows are available. Displaying them in the table.");
            }

            displayRows(); // Display the rows in the table
        })
        .catch(error => {
            console.error("Error loading file:", error);
        });
}

// Handle CSV export
exportButton.addEventListener('click', () => {
    if (!rows.length) {
        alert('No data available to export.');
        return;
    }

    // Escape special characters and generate CSV content
    const escapeValue = (value) => `"${(value || '').replace(/"/g, '""')}"`;

    // Updated headers based on your row data
    const headers = ['Department', 'Class', 'Product #', 'Product Description', 'QOH B', 'QOH A', 'Cost B', 'Cost A', 'Count V', 'Cost V'];

    // Updated row mapping to match your parsed data structure
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            [
                escapeValue(row.department),
                escapeValue(row.class),
                escapeValue(row.productn),
                escapeValue(row.productd),
                escapeValue(row.qohb),
                escapeValue(row.qoha),
                escapeValue(row.costb),
                escapeValue(row.costa),
                escapeValue(row.countv),
                escapeValue(row.costv)
            ].join(',')
        )
    ].join('\n').trim();

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_data.csv'; // Download filename
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Display success alert
    alert('CSV file has been successfully exported.');
});
