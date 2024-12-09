fetch('http://localhost:3010/download-report')
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(err => alert('Error: ' + err));
