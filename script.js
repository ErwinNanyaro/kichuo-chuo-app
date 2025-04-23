// Initialize Firebase on page load
window.onload = () => {
    loadLocationsFromFirebase();
};

// Load locations data from Firebase
function loadLocationsFromFirebase() {
    fetch('https://mnzili-d9ff6-default-rtdb.firebaseio.com/Locations.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data || {});
            setupAutocomplete(locations);
        })
        .catch(error => {
            console.error('Error loading location data:', error);
        });
}

function setupAutocomplete(locations) {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');

    fromInput.addEventListener('input', () =>
        filterLocationSuggestions(fromInput, 'from-suggestions', locations, 'from-zone')
    );
    toInput.addEventListener('input', () =>
        filterLocationSuggestions(toInput, 'to-suggestions', locations, 'to-zone')
    );
}

function filterLocationSuggestions(inputElement, suggestionId, locations, zoneId) {
    const inputValue = inputElement.value.toLowerCase();
    const suggestionsContainer = document.getElementById(suggestionId);
    suggestionsContainer.innerHTML = '';

    if (!inputValue) return;

    const filtered = locations.filter(loc =>
        loc.LocationName.toLowerCase().startsWith(inputValue)
    );

    filtered.forEach(loc => {
        const suggestion = document.createElement('div');
        suggestion.classList.add('autocomplete-suggestion');
        suggestion.textContent = loc.LocationName;

        suggestion.onclick = () => {
            inputElement.value = loc.LocationName;
            suggestionsContainer.innerHTML = '';
            fetchZoneForLocation(loc.LocationName, zoneId);
        };

        suggestionsContainer.appendChild(suggestion);
    });
}

function fetchZoneForLocation(locationName, zoneElementId) {
    fetch('http://192.168.1.122:5000/get_zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationName }),
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById(zoneElementId).value = data.zone || '';
        })
        .catch(err => {
            console.error('Error fetching zone:', err);
            document.getElementById(zoneElementId).value = '';
        });
}

function getRoutes() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    if (!from || !to) {
        alert('Please type both "From" and "To" locations.');
        return;
    }

    fetch('http://192.168.1.122:5000/get_routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
    })
        .then(res => {
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            displayRoutePrices(data.routes || []);
        })
        .catch(err => {
            console.error('Error fetching routes:', err);
            document.getElementById('results').innerHTML = '<p>Failed to load routes. Try again later.</p>';
        });
}

function displayRoutePrices(routes) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (!routes.length) {
        resultsDiv.innerHTML = '<p>No routes found for the selected locations.</p>';
        return;
    }

    const route = routes[0];
    document.getElementById('vehicle-selection').style.display = 'block';

    document.querySelectorAll('.vehicle-card').forEach(card => {
        const vehicleType = card.getAttribute('data-vehicle');
        const priceSpan = card.querySelector('.price');
        priceSpan.textContent = route[`${vehicleType}Price`] || 'N/A';
    });
}

function selectVehicle(vehicleType) {
    document.getElementById('selected-vehicle').value = vehicleType;

    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selected = document.querySelector(`.vehicle-card[data-vehicle="${vehicleType}"]`);
    if (selected) selected.classList.add('selected');
}

function confirmBooking() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const vehicle = document.getElementById('selected-vehicle').value;

    if (!from || !to || !vehicle) {
        alert('Please complete all fields and select a vehicle.');
        return;
    }

    alert(`✅ Booking confirmed from ${from} to ${to} using ${vehicle}.`);
}

// ✅ NEW: Login Passenger using phone number
function loginPassenger() {
    const phone = document.getElementById('login-phone').value.trim();

    if (!phone) {
        alert('Please enter your phone number.');
        return;
    }

    fetch('http://192.168.1.122:5000/verify_passenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    })
        .then(res => res.json())
        .then(data => {
            if (data.exists) {
                alert(`Welcome back, ${data.name || 'Passenger'}!`);
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('main-app').style.display = 'block';
            } else {
                alert('Phone number not found. Please try again or register.');
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            alert('Something went wrong. Please try again later.');
        });
}
