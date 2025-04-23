// Load data from Firebase
function loadData() {
    fetch('https://mnzili-d9ff6-default-rtdb.firebaseio.com/Locations.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data);
            populateSuggestions(locations);
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}

// Populate the suggestions for autocomplete
function populateSuggestions(locations) {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');

    fromInput.addEventListener('input', () => filterLocations(fromInput, 'from-suggestions', locations, 'from-zone'));
    toInput.addEventListener('input', () => filterLocations(toInput, 'to-suggestions', locations, 'to-zone'));
}

// Filter locations for autocomplete
function filterLocations(inputElement, suggestionsId, locations, zoneId) {
    const input = inputElement.value.toLowerCase();
    const suggestionsContainer = document.getElementById(suggestionsId);
    suggestionsContainer.innerHTML = '';

    if (input.length === 0) {
        return;
    }

    const filteredLocations = locations.filter(location =>
        location.LocationName.toLowerCase().startsWith(input)
    );

    filteredLocations.forEach(location => {
        const suggestion = document.createElement('div');
        suggestion.classList.add('autocomplete-suggestion');
        suggestion.textContent = location.LocationName;
        suggestion.onclick = () => {
            inputElement.value = location.LocationName;
            suggestionsContainer.innerHTML = '';

            // Fetch zone from backend using POST
            fetch('http://192.168.1.122:5000/get_zone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ location: location.LocationName }),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById(zoneId).value = data.zone || '';
            })
            .catch(error => {
                console.error('Error fetching zone:', error);
                document.getElementById(zoneId).value = '';
            });
        };
        suggestionsContainer.appendChild(suggestion);
    });
}

// Fetch routes using POST request
function getRoutes() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    if (!from || !to) {
        alert('Please type both "From" and "To" locations.');
        return;
    }

    fetch('http://192.168.1.122:5000/get_routes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: from, to: to }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';

        if (!data.routes || data.routes.length === 0) {
            resultsDiv.innerHTML = '<p>No routes found for the selected locations.</p>';
        } else {
            const route = data.routes[0]; // Only using first route
            const vehicleCards = document.querySelectorAll('.vehicle-card');
            vehicleCards.forEach(card => {
                const vehicleType = card.getAttribute('data-vehicle');
                const priceSpan = card.querySelector('.price');
                priceSpan.textContent = route[`${vehicleType}Price`];
            });

            document.getElementById('vehicle-selection').style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error fetching routes:', error);
        document.getElementById('results').innerHTML = '<p>An error occurred while fetching routes. Please try again.</p>';
    });
}

// Save selected vehicle
function selectVehicle(vehicleType) {
    document.getElementById('selected-vehicle').value = vehicleType;

    const vehicleCards = document.querySelectorAll('.vehicle-card');
    vehicleCards.forEach(card => card.classList.remove('selected'));

    const selectedCard = document.querySelector(`.vehicle-card[data-vehicle="${vehicleType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

// Handle confirmation of booking
function confirmBooking() {
    const selectedVehicle = document.getElementById('selected-vehicle').value;
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    if (!selectedVehicle || !from || !to) {
        alert('Please complete all fields and select a vehicle.');
        return;
    }

    alert(`Booking confirmed from ${from} to ${to} using ${selectedVehicle} vehicle.`);
}

// User login
function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            console.log('User logged in:', user.email);
            window.location.href = 'home.html';
        })
        .catch(error => {
            console.error('Login error:', error.message);
            alert('Login failed. Please check your credentials.');
        });
}

// Initialize Firebase on page load
window.onload = () => {
    loadData();
};
