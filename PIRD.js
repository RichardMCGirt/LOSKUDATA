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

    // Add "Total" to the productn field of the last row
    if (rows.length > 0) {
        rows[rows.length - 1].productn = 'Total'; // Modify the last row's productn
    }

    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        if (index === rows.length - 1) {
            // Add top border style to the last row
            tr.style.borderTop = '2px solid black';
        }
        tr.innerHTML = `
            <td class="hidden">${row.department}</td> 
            <td class="hidden">${row.class}</td> 
            <td>${row.productn}</td>
            <td>${row.productd}</td>
            <td>${row.qohb}</td>
            <td>${row.qoha}</td>
            <td>${row.costb}</td>
            <td>${row.costa}</td>
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
    loadAndParseFile('pird.csv');
});

// Function to load and parse the file content
function loadAndParseFile(fileName) {
    fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error(`Could not fetch the file: ${fileName}`);
            return response.text();
        })
        .then(text => {
            const lines = text.split('\n');

            console.log("Raw Lines:", lines); // Debug: Log all lines

            if (lines.length < 4) {
                console.error("File does not contain enough rows.");
                return;
            }

            // Parse headers and data
            const headers = lines[2].split(',').map(header => header.trim());
            console.log("Headers:", headers); // Debug: Log headers

            rows = lines.slice(3)
                .map((line, index) => {
                    const columns = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g); // Improved parsing
                    console.log(`Row ${index + 4} Columns:`, columns); // Debug: Log columns for each row

                    if (!columns || columns.length < headers.length) {
                        console.warn(`Row ${index + 4} has insufficient columns:`, columns);
                        return null; // Skip malformed rows
                    }

                    return {
                        department: columns[0]?.trim(),
                        class: columns[1]?.trim(),
                        productn: columns[2]?.trim(),
                        productd: columns[3]?.trim(),
                        qohb: columns[5]?.trim(),
                        qoha: columns[6]?.trim(),
                        costb: columns[7]?.trim(),
                        costa: columns[8]?.trim(),
                        qa: columns[11]?.trim(),
                        qoo: columns[12]?.trim(),
                    };
                })
                .filter(row => row); // Remove null rows

            console.log("Parsed Rows:", rows); // Debug: Log parsed rows
            displayRows();
        })
        .catch(error => console.error("Error loading file:", error));
}


// Function to export data to finalCounts.html
function exportToFinalCounts() {
    if (!rows.length) {
        alert('No data available to export.');
        return;
    }

    // Prepare the data for finalCounts.html (only stockSku)
    const finalData = rows.map(row => ({
        stockSku: row.productn || '' // Replace with appropriate field
    }));

    console.log('Final Data:', finalData); // Debug final data

    // Store the data in sessionStorage
    sessionStorage.setItem('finalCountsData', JSON.stringify(finalData));
    console.log('Data successfully stored in sessionStorage.');

    // Redirect to finalCounts.html
    window.location.href = 'finalcounts.html';
}

// Add event listener for exporting to finalCounts.html
document.getElementById('export-button').addEventListener('click', exportToFinalCounts);
