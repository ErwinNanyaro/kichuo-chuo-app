let locationsData = []; // Store locations data globally

// Connect to the WebSocket server
const socket = io(' https://71c7-197-186-5-3.ngrok-free.app', {
    transports: ['websocket']  // Force WebSocket transport
});

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

// Listen for ride confirmation notifications
socket.on('ride_confirmed', (data) => {
    alert(`New ride confirmed: ${JSON.stringify(data)}`);
});

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
    const zoneInput = document.getElementById('from-zone'); // Get the hidden input field

    console.log('Selected Location:', selectedLocation); // Debugging
    console.log('Zone Input Element:', zoneInput); // Debugging

    if (selectedLocation && zoneInput) {
        // Handle the extra space in the "Zone " property
        const zone = selectedLocation['Zone '] || selectedLocation.Zone; // Use 'Zone ' or 'Zone'
        zoneInput.value = zone; // Update the hidden input field
        console.log('Updated Zone:', zoneInput.value); // Debugging
    } else {
        console.error('Error: Could not update zone. Check if the "from-zone" input field exists.');
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
                    // Only display options with valid prices
                    if (route.MotorcyclePrice > 0 || route.BajajiPrice > 0 || route.CarPrice > 0) {
                        const carPrice = route.CarPrice === 0 ? 'N/A' : route.CarPrice;
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
                    }
                });

                // Show vehicle selection if at least one valid route is found
                if (resultsDiv.innerHTML !== '') {
                    document.getElementById('vehicle-selection').style.display = 'block';
                } else {
                    resultsDiv.innerHTML = '<p>No valid routes found for the selected locations.</p>';
                }
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
    const zoneInput = document.getElementById('from-zone'); // Get the hidden input field

    console.log('Zone Input Element:', zoneInput); // Debugging

    if (!zoneInput) {
        console.error('Error: The "from-zone" input field is missing or not found.');
        return;
    }

    const zone = zoneInput.value; // Get the zone value

    console.log('Selected Vehicle Type:', vehicleType); // Debugging
    console.log('Selected Zone:', zone); // Debugging

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
            console.log('Riders Data:', data); // Debugging
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

// Confirm ride
function confirmRide() {
    const riderName = document.getElementById('rider-name').textContent;
    const riderPhone = document.getElementById('rider-phone').textContent;
    const riderVehicleType = document.getElementById('rider-vehicle-type').textContent;
    const riderZone = document.getElementById('rider-zone').textContent;

    const rideDetails = {
        riderName,
        riderPhone,
        riderVehicleType,
        riderZone,
        from: document.getElementById('from').value,
        to: document.getElementById('to').value,
        vehicleType: document.getElementById('vehicle-type').value,
        timestamp: new Date().toISOString()
    };

    // Send ride details to the backend
    fetch('http://127.0.0.1:5000/confirm-ride', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(rideDetails)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Ride confirmed! The rider has been notified.');
        console.log('Ride Details:', data);
    })
    .catch(error => {
        console.error('Error confirming ride:', error);
        alert('An error occurred while confirming the ride. Please try again.');
    });
}
