document.getElementById('downloadReport').addEventListener('click', async () => {
    try {
        const progressContainer = document.getElementById('progressContainer');
        const progressMessage = document.getElementById('progressMessage');
        const progressBar = document.getElementById('progressBar');

        progressContainer.style.display = 'block';
        progressMessage.textContent = 'Generating report...';
        progressBar.value = 0;

        const response = await fetch('/download-report');
        if (response.ok) {
            progressMessage.textContent = 'Report generated! Downloading now...';
            progressBar.value = 100;

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'report.csv';
            link.click();

            progressMessage.textContent = 'Report downloaded successfully!';
        } else {
            throw new Error('Failed to generate report.');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});
