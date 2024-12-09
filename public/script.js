document.getElementById('downloadReport').addEventListener('click', () => {
    fetch('/download-report')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then((data) => {
            alert(data.message);
        })
        .catch((err) => {
            console.error('Error:', err);
            alert('Error: ' + err.message);
        });
});
