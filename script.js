document.addEventListener("DOMContentLoaded", () => {
    const sheet1Config = {
        headers: [
            "Counter Person",
            "Master Account Name",
            "Job Name",
            "SO Number",
            "Created Date",
            "Product#",
            "Description",
            "Sell Qty",
            "Sell Price",
            "Product Cost",
            "Ext Sellprice",
            "Ext Product Cost",
        ],
        data: [],
        columns: [],
    };

    let hotInstance;

    // Initialize Handsontable for Sheet 1
    const initHandsontable = () => {
        const container = document.getElementById("sheet1");
        const config = sheet1Config;
    
        console.log("Initializing Handsontable for sheet1", config);
    
        if (!hotInstance) {
            hotInstance = new Handsontable(container, {
                data: config.data,
                colHeaders: config.headers,
                rowHeaders: true,
                contextMenu: true,
                copyPaste: true,
                manualColumnResize: true,
                manualRowResize: true,
                stretchH: "all",
                columns: config.columns,
                licenseKey: "non-commercial-and-evaluation",
            });
            console.log("Handsontable initialized for sheet1");
        } else {
            hotInstance.updateSettings({
                data: config.data,
                colHeaders: config.headers,
            });
            console.log("Handsontable updated for sheet1");
        }
    };
    

    // CSV Upload
    const csvUploadInput = document.getElementById("csv-upload");
    csvUploadInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        console.log(`CSV file selected: ${file?.name}`);
        if (file) {
            Papa.parse(file, {
                header: false, // Do not treat the first row as headers
                skipEmptyLines: true, // Skip empty rows
                complete: (result) => {
                    console.log("CSV parsing complete:", result);
    
                    // Extract all rows
                    const allRows = result.data;
    
                    // Check if there are enough rows for headers and data
                    if (allRows.length < 4) {
                        console.error("Insufficient rows in CSV for headers and data.");
                        return;
                    }
    
                    // Hardcoded headers
                    const headers = [
                        "Counter Person",
                        "Master Account Name",
                        "Job Name",
                        "SO Number",
                        "Created Date",
                        "Product#",
                        "Description",
                        "Sell Qty",
                        "Sell Price",
                        "Product Cost",
                        "Ext Sellprice",
                        "Ext Product Cost",
                    ];
                    console.log("Hardcoded Headers:", headers);
    
                    // Extract data starting from the fourth row
                    const data = allRows.slice(3).map((row) => {
                        return row.length === headers.length ? row : row.slice(0, headers.length);
                    });
                    console.log("Processed Data Rows:", data);
    
                    // Update sheet1 config
                    sheet1Config.headers = headers;
                    sheet1Config.data = data;
    
                    // Dynamically configure columns for Handsontable
                    sheet1Config.columns = headers.map(() => ({ data: null })); // Generate column configurations
    
                    console.log("Sheet1 Config:", sheet1Config);
    
                    // Reinitialize Handsontable for Sheet 1
                    initHandsontable();
                },
                error: (error) => {
                    console.error("Error parsing CSV file:", error);
                },
            });
        }
    });
    

    // Initialize first sheet
    console.log("Initializing first sheet (sheet1)...");
    initHandsontable();
});
