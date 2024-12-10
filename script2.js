const cityDropdown = document.getElementById('city-dropdown');
const fileInput = document.getElementById('file-input');
const tableBody = document.querySelector('#result-table tbody');

let rows = []; // To store the parsed data from the uploaded file

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
            <td>${row.master}</td>
            <td>${row.city}</td>
            <td>${row.soNumber}</td>
            <td>${row.date}</td>
            <td>${row.total}</td>
             <td>${row.SOtotal}</td>

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
            const headers = lines.shift().split(','); // Extract headers
            console.log("Headers:", headers); // Log headers

            rows = lines.map(line => {
                const columns = line.split(',');
                return {
                    master: columns[0]?.trim(), // Master Account Name (First Column)
                    city: columns[1]?.trim(),   // City (Second Column)
                    soNumber: columns[2]?.trim(),
                    date: columns[3]?.trim(),
                    total: columns[4]?.trim(),   // SO Total (Fifth Column)
                    SOtotal: columns[5]?.trim()   // SO Total (Fifth Column)

                };
            }).filter(row => row.city); // Filter out empty rows

            console.log("Parsed Rows:", rows); // Log parsed rows

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
        const filteredRows = rows.filter(row => 
            row.city.toLowerCase().includes(selectedCity) // Case-insensitive contains check on the second column (city)
        );
        console.log("Rows Matching Selected City:", filteredRows); // Log rows matching the city
        displayRows(filteredRows);
    } else {
        console.log("No city selected, clearing table.");
        tableBody.innerHTML = ''; // Clear table if no city selected
    }
});
