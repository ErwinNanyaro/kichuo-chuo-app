let locationsData = []; // Store locations data globally

// Fetch locations from the backend
fetch('http://127.0.0.1:5000/locations')
    .then(response => response.json())
    .then(data => {
        locationsData = data; // Store locations data
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

// Update the FromLocation zone when a location is selected
function updateZone() {
    const fromLocation = document.getElementById('from').value;
    const selectedLocation = locationsData.find(location => location.LocationName === fromLocation);
    if (selectedLocation) {
        document.getElementById('from-zone').value = selectedLocation.Zone;
    }
}

// Fetch routes and prices
function getRoutes() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    if (!from || !to) {
        alert('Please select both "From" and "To" locations.');
        return;
    }

    fetch(`http://127.0.0.1:5000/routes?from=${from}&to=${to}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
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
// Fetch riders for the selected vehicle type and zone
function getRiders() {
    const vehicleType = document.getElementById('vehicle-type').value;
    const zone = document.getElementById('from-zone').value; // Get the zone from the hidden input field

    if (!zone) {
        alert('Please select a "From" location first.');
        return;
    }

    fetch(`http://127.0.0.1:5000/riders?vehicle_type=${vehicleType}&zone=${zone}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.length > 0) {
                const rider = data[Math.floor(Math.random() * data.length)]; // Select a random rider
                document.getElementById('rider-name').textContent = rider.Name;
                document.getElementById('rider-phone').textContent = rider['Mobile Contact'];
                document.getElementById('rider-vehicle-type').textContent = rider.VehicleType;
                document.getElementById('rider-zone').textContent = rider.RiderZone;
                document.getElementById('rider-details').style.display = 'block';
            } else {
                alert('No riders available for the selected vehicle type and zone.');
            }
        })
        .catch(error => {
            console.error('Error fetching riders:', error);
            alert('An error occurred while fetching riders. Please try again.');
        });
}
