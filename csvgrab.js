const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

const app = express();
const PORT = 3000;
const downloadsDir = path.join(require('os').homedir(), 'Downloads');

// Get the latest CSV file from Downloads
function getLatestCSV() {
    const files = fs.readdirSync(downloadsDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => ({ file, time: fs.statSync(path.join(downloadsDir, file)).mtime }))
        .sort((a, b) => b.time - a.time);

    return files.length > 0 ? path.join(downloadsDir, files[0].file) : null;
}

app.get('/export-csv', (req, res) => {
    const latestCSV = getLatestCSV();

    if (!latestCSV) {
        return res.status(404).send('No CSV files found in Downloads.');
    }

    // Read and parse the CSV file
    const data = fs.readFileSync(latestCSV, 'utf8');
    const rows = data.split('\n').map(line => line.split(','));

    // Filter rows or process data as needed
    const filteredRows = rows.filter(row => row[1]?.toLowerCase() === req.query.city?.toLowerCase()); // Example filter by city

    // Convert back to CSV
    const csv = parse(filteredRows, { header: rows[0] });
    res.header('Content-Type', 'text/csv');
    res.attachment('export.csv');
    res.send(csv);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
