// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmv0G4dYFKkq10DA5PJvooFTNSJMnQ59g",
    authDomain: "kichuochuo-aa5fc.firebaseapp.com",
    projectId: "kichuochuo-aa5fc",
    storageBucket: "kichuochuo-aa5fc.firebasestorage.app",
    messagingSenderId: "784485374603",
    appId: "1:784485374603:web:54b97e2042f551bfe7128e",
    measurementId: "G-LKVLSBTVVF"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const messaging = firebase.messaging();

// Function to request notification permission
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get the device token
            getDeviceToken();
        } else if (permission === 'denied') {
            console.log('Notification permission denied.');
            alert('Please enable notifications to receive ride updates.');
        } else {
            console.log('Notification permission blocked.');
            alert('Notifications are blocked. Please enable them in your browser settings.');
        }
    }).catch(error => {
        console.error('Error requesting notification permission:', error);
    });
}

// Function to get the device token
function getDeviceToken() {
    messaging.getToken({ vapidKey: 'BEngFTBc5Zl9kpbnusb3F9WNwtZBimR37sw2fMkzuI6et5J342u2gPULKmpyn99-it-K5k7VObyKNdqlGN1pigY' }).then((currentToken) => {
        if (currentToken) {
            console.log('Device token:', currentToken);
            // Send the token to the backend for registration
            registerDeviceToken(currentToken);
        } else {
            console.log('No registration token available. Request permission to generate one.');
            requestNotificationPermission(); // Request permission again if no token is available
        }
    }).catch((err) => {
        console.error('Error retrieving token:', err);
        if (err.code === 'messaging/permission-blocked') {
            alert('Notifications are blocked. Please enable them in your browser settings.');
        } else {
            console.error('Error retrieving token:', err);
        }
    });
}

// Function to register the device token
function registerDeviceToken(deviceToken) {
    const riderPhone = '754996969'; // Replace with the rider's phone number
    fetch('http://192.168.1.122:5000/register-device-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            riderPhone: riderPhone,
            deviceToken: deviceToken
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Device token registered successfully:', data);
    })
    .catch(error => {
        console.error('Error registering device token:', error);
    });
}

// Function to handle passenger login
function loginPassenger() {
    const phoneNumber = document.getElementById('login-phone').value.trim();

    if (!phoneNumber) {
        alert('Please enter your phone number.');
        return;
    }

    // Send the phone number to the backend for verification
    fetch('http://192.168.1.122:5000/login-passenger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mobileContact: phoneNumber
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Store the passenger's MobileContact in sessionStorage
            sessionStorage.setItem('passengerPhone', phoneNumber);
            alert('Login successful!');
            // Hide the login section and show the main app
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
        } else {
            alert('Login failed. Please check your phone number.');
        }
    })
    .catch(error => {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    });
}

// Store locations data globally
let locationsData = [];

// Fetch locations from the backend
fetch('http://192.168.1.122:5000/locations')
    .then(response => response.json())
    .then(data => {
        locationsData = data; // Store locations data
    })
    .catch(error => {
        console.error('Error fetching locations:', error);
    });

// Function to filter and display locations
function filterLocations(field) {
    const input = document.getElementById(field).value.toLowerCase();
    const suggestionsDiv = document.getElementById(`${field}-suggestions`);
    suggestionsDiv.innerHTML = ''; // Clear previous suggestions

    if (!input || !locationsData.length) {
        suggestionsDiv.style.display = 'none'; // Hide suggestions if input is empty or data is not loaded
        return;
    }

    // Filter locations that match the input
    const filteredLocations = locationsData.filter(location =>
        location.LocationName.toLowerCase().startsWith(input)
    );

    if (filteredLocations.length > 0) {
        // Display matching locations
        filteredLocations.forEach(location => {
            const suggestion = document.createElement('div');
            suggestion.textContent = location.LocationName;
            suggestion.onclick = () => {
                document.getElementById(field).value = location.LocationName;
                suggestionsDiv.style.display = 'none'; // Hide suggestions after selection

                // Update the zone for "From" field
                if (field === 'from') {
                    document.getElementById('from-zone').value = location['Zone '] || location.Zone;
                }
            };
            suggestionsDiv.appendChild(suggestion);
        });
        suggestionsDiv.style.display = 'block'; // Show suggestions
    } else {
        suggestionsDiv.style.display = 'none'; // Hide suggestions if no matches
    }
}

// Close suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.matches('#from, #to')) {
        document.getElementById('from-suggestions').style.display = 'none';
        document.getElementById('to-suggestions').style.display = 'none';
    }
});

// Fetch routes and prices
function getRoutes() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    if (!from || !to) {
        alert('Please type both "From" and "To" locations.');
        return;
    }

    fetch(`http://192.168.1.122:5000/routes?from=${from}&to=${to}`)
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
                const vehicleCards = document.querySelectorAll('.vehicle-card');
                vehicleCards.forEach(card => {
                    const vehicleType = card.getAttribute('data-vehicle');
                    const priceSpan = card.querySelector('.price');
                    priceSpan.textContent = route[`${vehicleType}Price`];
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

    fetch(`http://192.168.1.122:5000/riders?vehicle_type=${selectedVehicle}&zone=${zone}`)
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
    // Retrieve the passenger's MobileContact from sessionStorage
    const passengerPhone = sessionStorage.getItem('passengerPhone');
    if (!passengerPhone) {
        alert('Passenger not logged in. Please log in first.');
        return;
    }

    // Fetch passenger details from the backend
    fetch(`http://192.168.1.122:5000/passenger-details?mobileContact=${passengerPhone}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(passenger => {
            const passengerName = `${passenger.FirstName} ${passenger.LastName}`;
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
            fetch('http://192.168.1.122:5000/confirm-ride', {
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
        })
        .catch(error => {
            console.error('Error fetching passenger details:', error);
            alert('An error occurred while fetching passenger details. Please try again.');
        });
}

// Fetch and display confirmed rides
function fetchConfirmedRides() {
    fetch('http://192.168.1.122:5000/confirmed-rides')
        .then(response => response.json())
        .then(data => {
            console.log('Confirmed Rides:', data);
            const confirmedRidesDiv = document.getElementById('confirmed-rides');
            confirmedRidesDiv.innerHTML = ''; // Clear previous content
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

// Request notification permission when the page loads
requestNotificationPermission();
