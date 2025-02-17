let locationsData = []; // Store locations data globally
let selectedVehicle = null; // Store the selected vehicle type

// Connect to the WebSocket server
const socket = io('http://127.0.0.1:5000', {
    transports: ['websocket']  // Force WebSocket transport
});

// Handle WebSocket connection errors
socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    alert('Failed to connect to the server. Please try again.');
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

    fetch(`https://a5af-197-186-3-150.ngrok-free.app/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
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
                const route = data[0]; // Assuming only one route is returned

                // Hide all vehicle cards initially
                document.querySelectorAll('.vehicle-card').forEach(card => {
                    card.style.display = 'none';
                });

                // Show only available vehicles
                const vehicleTypes = ['Motorcycle', 'Bajaji', 'Car'];
                vehicleTypes.forEach(vehicleType => {
                    const price = route[`${vehicleType}Price`];
                    if (price > 0) {
                        const card = document.querySelector(`.vehicle-card[data-vehicle="${vehicleType}"]`);
                        if (card) {
                            card.style.display = 'block';
                            const priceSpan = card.querySelector('.price');
                            priceSpan.textContent = `${price} TZS`;
                        }
                    }
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

// Add click event listeners to vehicle cards
document.querySelectorAll('.vehicle-card').forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        document.querySelectorAll('.vehicle-card').forEach(c => {
            c.classList.remove('active');
        });

        // Add active class to the clicked card
        card.classList.add('active');

        // Store the selected vehicle type
        selectedVehicle = card.getAttribute('data-vehicle');

        // Fetch riders automatically
        getRiders();
    });
});

// Fetch riders for the selected vehicle type and zone
function getRiders() {
    if (!selectedVehicle) {
        alert('Please select a vehicle first.');
        return;
    }

    const zoneInput = document.getElementById('from-zone'); // Get the hidden input field
    const zone = zoneInput.value; // Get the zone value

    if (!zone) {
        alert('Please select a "From" location first.');
        return;
    }

    fetch(`http://127.0.0.1:5000/riders?vehicle_type=${selectedVehicle}&zone=${zone}`)
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
    const passengerName = prompt("Enter your name:"); // Get passenger name
    const passengerPhone = prompt("Enter your phone number:"); // Get passenger phone

    if (!passengerName || !passengerPhone) {
        alert("Please provide your name and phone number.");
        return;
    }

    const riderName = document.getElementById('rider-name').textContent;
    const riderPhone = document.getElementById('rider-phone').textContent;
    const riderVehicleType = document.getElementById('rider-vehicle-type').textContent;
    const riderZone = document.getElementById('rider-zone').textContent;

    const rideDetails = {
        passengerName,
        passengerPhone,
        riderName,
        riderPhone,
        riderVehicleType,
        riderZone,
        from: document.getElementById('from').value,
        to: document.getElementById('to').value,
        vehicleType: selectedVehicle,
        timestamp: new Date().toISOString()
    };

    // Send ride details to the backend
    fetch('https://a5af-197-186-3-150.ngrok-free.app/confirm-ride', {
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
        alert(`Ride confirmed!\n
               Ride Price: ${data.ride_price_tzs} TZS\n
               Commission: ${data.commission_tzs} TZS\n
               Net Amount: ${data.net_amount_tzs} TZS`);
        console.log('Ride Details:', data);
    })
    .catch(error => {
        console.error('Error confirming ride:', error);
        alert('An error occurred while confirming the ride. Please try again.');
    });
}
// Fetch and display confirmed rides
function fetchConfirmedRides() {
    fetch('http://127.0.0.1:5000/confirmed-rides')
        .then(response => response.json())
        .then(data => {
            console.log('Confirmed Rides:', data);
            const confirmedRidesDiv = document.getElementById('confirmed-rides');
            confirmedRidesDiv.innerHTML = '<h2>Confirmed Rides</h2>';
            data.forEach(ride => {
                confirmedRidesDiv.innerHTML += `
                    <div class="ride-details">
                        <p><strong>Rider:</strong> ${ride.riderName}</p>
                        <p><strong>From:</strong> ${ride.from}</p>
                        <p><strong>To:</strong> ${ride.to}</p>
                        <p><strong>Vehicle:</strong> ${ride.vehicleType}</p>
                        <p><strong>Commission:</strong> ${ride.commission} TZS</p>
                        <p><strong>Total Price:</strong> ${ride.total_price} TZS</p>
                        <hr>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error fetching confirmed rides:', error);
        });
}

// Call fetchConfirmedRides to display confirmed rides when the page loads
fetchConfirmedRides();
