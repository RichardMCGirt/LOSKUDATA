document.getElementById('downloadReport').addEventListener('click', () => {
    console.log('Download Report button clicked.');

fetch('https://loskudata-2.onrender.com/')
        .then((response) => {
            console.log('Received response:', response);

            if (!response.ok) {
                console.error('Response not OK:', response.status, response.statusText);
                throw new Error('Failed to fetch the report. Status: ' + response.status + ' ' + response.statusText);
            }

            return response.json();
        })
        .then((data) => {
            console.log('Report generation successful:', data);
            alert('Success: ' + data.message);
        })
        .catch((err) => {
            console.error('Error during fetch:', err);

            if (err.message.includes('Failed to fetch')) {
                alert('Error: Unable to reach the server. Please try again later.');
            } else if (err.message.includes('Network response')) {
                alert('Error: Server responded with a bad status. Check logs for details.');
            } else {
                alert('Unexpected error occurred: ' + err.message);
            }
        });
});
