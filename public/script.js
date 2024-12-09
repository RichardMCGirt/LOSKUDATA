document.getElementById('downloadReport').addEventListener('click', () => {
    fetch('/download-report')
        .then(response => response.json())
        .then(data => alert(data.message)) // Use alert in browser
        .catch(err => console.error('Error: ', err));
});
