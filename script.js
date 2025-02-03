// Fetch locations from the backend
fetch('http://127.0.0.1:5000/locations')
    .then(response => response.json())
    .then(data => {
        const fromSelect = document.getElementById('from');
        const toSelect = document.getElementById('to');
        data.forEach(location => {
            const option = document.createElement('option');
            option.value = location.LocationName;
            option.text = location.LocationName;
            fromSelect.add(option);
            toSelect.add(option.cloneNode(true));
        });
    });

// Fetch locations from the backend
fetch('http://127.0.0.1:5000/locations')
    .then(response => response.json())
    .then(data => {
        const fromSelect = document.getElementById('from');
        const toSelect = document.getElementById('to');
        data.forEach(location => {
            const option = document.createElement('option');
            option.value = location.LocationName;
            option.text = location.LocationName;
            fromSelect.add(option);
            toSelect.add(option.cloneNode(true));
        });
    });

// Fetch routes and prices
function getRoutes() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    fetch(`http://127.0.0.1:5000/routes?from=${from}&to=${to}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';
            if (data.length === 0) {
                resultsDiv.innerHTML = '<p>No routes found for the selected locations.</p>';
            } else {
                data.forEach(route => {
                    const carPrice = route.CarPrice === null ? 'N/A' : route.CarPrice;
                    resultsDiv.innerHTML += `
                        <p>Motorcycle: ${route.MotorcyclePrice} TZS</p>
                        <p>Bajaji: ${route.BajajiPrice} TZS</p>
                        <p>Car: ${carPrice} TZS</p>
                        <hr>
                    `;
                });
            }
        })
        .catch(error => {
            console.error('Error fetching routes:', error);
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p>An error occurred while fetching routes. Please try again.</p>';
        });
}
