// Configuration
const BACKEND_URL = 'http://localhost:5000'; // Change to your actual backend URL
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBmv0G4dYFKkq10DA5PJvooFTNSJMnQ59g",
    authDomain: "kichuochuo-aa5fc.firebaseapp.com",
    projectId: "kichuochuo-aa5fc",
    storageBucket: "kichuochuo-aa5fc.appspot.com",
    messagingSenderId: "784485374603",
    appId: "1:784485374603:web:54b97e2042f551bfe7128e"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginPhoneInput = document.getElementById('login-phone');
const mainAppSection = document.getElementById('main-app');
const loginSection = document.getElementById('login-section');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadLocations();
    setupEventListeners();
});

function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    document.getElementById('from').addEventListener('input', () => 
        handleLocationInput('from', 'from-suggestions', 'from-zone'));
    
    document.getElementById('to').addEventListener('input', () => 
        handleLocationInput('to', 'to-suggestions', 'to-zone'));
    
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('click', () => selectVehicle(card.dataset.vehicle));
    });
    
    document.getElementById('confirm-ride-btn').addEventListener('click', confirmRide);
}

// API Functions
async function loadLocations() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/routes`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setupLocationAutocomplete(data);
    } catch (error) {
        console.error('Error loading locations:', error);
        showError('Failed to load locations. Please try again later.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const phone = loginPhoneInput.value.trim();
    
    if (!phone) {
        showError('Please enter your phone number');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/login-passenger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ mobileContact: phone })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            loginSection.style.display = 'none';
            mainAppSection.style.display = 'block';
        } else {
            showError(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
    }
}

function handleLocationInput(inputId, suggestionsId, zoneId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    const value = input.value.toLowerCase();
    
    suggestions.innerHTML = '';
    
    if (!value) return;
    
    // Filter locations (replace with your actual location data)
    const filteredLocations = []; // Your location filtering logic here
    
    filteredLocations.forEach(location => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.textContent = location.name;
        suggestion.onclick = () => {
            input.value = location.name;
            document.getElementById(zoneId).value = location.zone || '';
            suggestions.innerHTML = '';
        };
        suggestions.appendChild(suggestion);
    });
}

function selectVehicle(vehicleType) {
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`.vehicle-card[data-vehicle="${vehicleType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        document.getElementById('selected-vehicle').value = vehicleType;
    }
}

async function confirmRide() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const vehicleType = document.getElementById('selected-vehicle').value;
    
    if (!from || !to || !vehicleType) {
        showError('Please complete all fields and select a vehicle');
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showError('Please login first');
            return;
        }

        const response = await fetch(`${BACKEND_URL}/api/confirm-ride`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                passengerPhone: user.phone,
                from: from,
                to: to,
                vehicleType: vehicleType,
                riderPhone: '628284454', // Replace with actual rider phone
                riderName: 'John Doe'    // Replace with actual rider name
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Ride confirmed successfully!');
            // Update UI with ride details
            updateRideDetails(data.ride_details);
        } else {
            showError(data.error || 'Failed to confirm ride. Please try again.');
        }
    } catch (error) {
        console.error('Confirm ride error:', error);
        showError('An error occurred. Please try again.');
    }
}

// Helper Functions
function showError(message) {
    alert(message); // Replace with your preferred error display method
}

function showSuccess(message) {
    alert(message); // Replace with your preferred success display method
}

function updateRideDetails(details) {
    // Update UI with ride details
    document.getElementById('ride-confirmation').style.display = 'block';
    document.getElementById('confirmation-details').innerHTML = `
        <p><strong>Passenger:</strong> ${details.passenger}</p>
        <p><strong>From:</strong> ${details.from}</p>
        <p><strong>To:</strong> ${details.to}</p>
        <p><strong>Vehicle:</strong> ${details.vehicle}</p>
        <p><strong>Price:</strong> ${details.price} TZS</p>
    `;
}

// Initialize
function initialize() {
    const user = localStorage.getItem('user');
    if (user) {
        loginSection.style.display = 'none';
        mainAppSection.style.display = 'block';
    }
}

initialize();
