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
                        <div class="route-option">
                            <img src="motorbike.png" alt="Motorcycle">
                            <p>Motorcycle: ${route.MotorcyclePrice} TZS</p>
                        </div>
                        <div class="route-option">
                            <img src="tuktuk.png" alt="Bajaji">
                            <p>Bajaji: ${route.BajajiPrice} TZS</p>
                        </div>
                        <div class="route-option">
                            <img src="taxi.png" alt="Car">
                            <p>Car: ${carPrice} TZS</p>
                        </div>
                        <hr>
                    `;
                });
                // Show vehicle selection
                document.getElementById('vehicle-selection').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching routes:', error);
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p>An error occurred while fetching routes. Please try again.</p>';
        });
}

// Fetch riders for the selected vehicle type
function getRiders() {
    const vehicleType = document.getElementById('vehicle-type').value;
    fetch(`http://127.0.0.1:5000/riders?vehicle_type=${vehicleType}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const rider = data[0]; // Select the first rider for now
                document.getElementById('rider-name').textContent = rider.Name;
                document.getElementById('rider-phone').textContent = rider.Phone;
                document.getElementById('rider-vehicle-type').textContent = rider.VehicleType;
                document.getElementById('rider-vehicle-details').textContent = rider.VehicleDetails;
                document.getElementById('rider-details').style.display = 'block';
            } else {
                alert('No riders available for the selected vehicle type.');
            }
        })
        .catch(error => {
            console.error('Error fetching riders:', error);
            alert('An error occurred while fetching riders. Please try again.');
        });
}

// Confirm the ride
function confirmRide() {
    alert('Ride confirmed! The rider will contact you shortly.');
    // Reset the form
    document.getElementById('vehicle-selection').style.display = 'none';
    document.getElementById('rider-details').style.display = 'none';
}
