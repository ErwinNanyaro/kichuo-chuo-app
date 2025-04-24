// Configuration
const config = {
  backendUrl: 'http://localhost:5000',
  defaultAvatarBgColors: ['#3a86ff', '#8338ec', '#06d6a0', '#ef476f', '#ffd166'],
  firebaseConfig: {
    apiKey: "AIzaSyBmv0G4dYFKkq10DA5PJvooFTNSJMnQ59g",
    authDomain: "kichuochuo-aa5fc.firebaseapp.com",
    projectId: "kichuochuo-aa5fc",
    storageBucket: "kichuochuo-aa5fc.appspot.com",
    messagingSenderId: "784485374603",
    appId: "1:784485374603:web:54b97e2042f551bfe7128e"
  }
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config.firebaseConfig);
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginPhoneInput = document.getElementById('login-phone');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const fromSuggestions = document.getElementById('from-suggestions');
const toSuggestions = document.getElementById('to-suggestions');
const findRideBtn = document.getElementById('find-ride-btn');
const rideResults = document.getElementById('ride-results');
const vehicleOptions = document.getElementById('vehicle-options');
const riderDetails = document.getElementById('rider-details');
const riderAvatar = document.getElementById('rider-avatar');
const riderName = document.getElementById('rider-name');
const riderPhone = document.getElementById('rider-phone');
const rideVehicle = document.getElementById('ride-vehicle');
const rideFrom = document.getElementById('ride-from');
const rideTo = document.getElementById('ride-to');
const rideTime = document.getElementById('ride-time');
const ridePrice = document.getElementById('ride-price');
const confirmRideBtn = document.getElementById('confirm-ride-btn');
const rideConfirmation = document.getElementById('ride-confirmation');
const confirmationDetails = document.getElementById('confirmation-details');
const trackRideBtn = document.getElementById('track-ride-btn');
const trackingSection = document.getElementById('tracking-section');

// State
let currentUser = null;
let selectedVehicle = null;
let selectedRider = null;
let currentRide = null;
let trackingInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  setupEventListeners();
});

function checkAuthState() {
  const userData = localStorage.getItem('user');
  if (userData) {
    currentUser = JSON.parse(userData);
    showApp();
  }
}

function showApp() {
  authSection.classList.add('hidden');
  appContainer.classList.remove('hidden');
  
  // Set user info
  if (currentUser) {
    const initials = currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0);
    userAvatar.textContent = initials;
    userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    setRandomAvatarBg(userAvatar);
  }
}

function setupEventListeners() {
  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Location inputs
  fromInput.addEventListener('input', () => handleLocationInput(fromInput, fromSuggestions, 'from-zone'));
  toInput.addEventListener('input', () => handleLocationInput(toInput, toSuggestions, 'to-zone'));

  // Find ride button
  findRideBtn.addEventListener('click', findRides);

  // Confirm ride button
  confirmRideBtn.addEventListener('click', confirmRide);

  // Track ride button
  trackRideBtn.addEventListener('click', startRideTracking);

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.location-input')) {
      fromSuggestions.style.display = 'none';
      toSuggestions.style.display = 'none';
    }
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = loginPhoneInput.value.trim();

  if (!phone) {
    showNotification('Please enter your phone number', 'error');
    return;
  }

  try {
    showLoader(loginForm.querySelector('button'), 'Continuing...');

    const response = await fetch(`${config.backendUrl}/api/login-passenger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileContact: phone }),
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      showApp();
      showNotification(`Welcome back, ${data.user.firstName}!`, 'success');
    } else {
      showNotification(data.message || 'Login failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('An error occurred during login. Please try again.', 'error');
  } finally {
    hideLoader(loginForm.querySelector('button'), 'Continue');
  }
}

function handleLocationInput(inputElement, suggestionsContainer, zoneElementId) {
  const inputValue = inputElement.value.toLowerCase();
  suggestionsContainer.innerHTML = '';

  if (!inputValue) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  // In a real app, you would fetch these from your backend
  const mockLocations = [
    { name: "University of Dar es Salaam", zone: "Zone A" },
    { name: "Kariakoo Market", zone: "Zone B" },
    { name: "Posta", zone: "Zone C" },
    { name: "Mlimani City", zone: "Zone A" },
    { name: "Ubungo Terminal", zone: "Zone D" }
  ];

  const filtered = mockLocations.filter(loc =>
    loc.name.toLowerCase().includes(inputValue)
  );

  if (filtered.length > 0) {
    filtered.forEach(loc => {
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion-item';
      suggestion.textContent = loc.name;
      suggestion.onclick = () => {
        inputElement.value = loc.name;
        document.getElementById(zoneElementId).value = loc.zone || '';
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
      };
      suggestionsContainer.appendChild(suggestion);
    });
    suggestionsContainer.style.display = 'block';
  } else {
    suggestionsContainer.style.display = 'none';
  }
}

async function findRides() {
  const from = fromInput.value;
  const to = toInput.value;

  if (!from || !to) {
    showNotification('Please enter both pickup and destination locations', 'error');
    return;
  }

  try {
    showLoader(findRideBtn, 'Finding rides...');

    // In a real app, you would fetch this from your backend
    const mockRides = [
      {
        id: 1,
        vehicleType: "Motorcycle",
        price: "3,000",
        time: "10 min",
        image: "assets/motorbike.png",
        description: "Fast and affordable"
      },
      {
        id: 2,
        vehicleType: "Bajaji",
        price: "5,000",
        time: "15 min",
        image: "assets/tuktuk.png",
        description: "Covered and comfortable"
      },
      {
        id: 3,
        vehicleType: "Car",
        price: "8,000",
        time: "12 min",
        image: "assets/taxi.png",
        description: "Private and comfortable"
      }
    ];

    displayRideOptions(mockRides);
  } catch (error) {
    console.error('Error finding rides:', error);
    showNotification('Failed to find rides. Please try again.', 'error');
  } finally {
    hideLoader(findRideBtn, 'Find Rides');
  }
}

function displayRideOptions(rides) {
  vehicleOptions.innerHTML = '';
  
  rides.forEach(ride => {
    const card = document.createElement('div');
    card.className = 'vehicle-card fade-in';
    card.dataset.vehicle = ride.vehicleType;
    card.dataset.id = ride.id;
    
    card.innerHTML = `
      <img src="${ride.image}" alt="${ride.vehicleType}">
      <p>${ride.vehicleType}</p>
      <p class="price">${ride.price} TZS</p>
      <small>${ride.time} away</small>
      <small class="text-muted">${ride.description}</small>
    `;
    
    card.addEventListener('click', () => selectRideOption(ride));
    vehicleOptions.appendChild(card);
  });
  
  rideResults.classList.remove('hidden');
  rideResults.scrollIntoView({ behavior: 'smooth' });
}

function selectRideOption(ride) {
  selectedVehicle = ride;
  
  // Remove selected class from all cards
  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Add selected class to clicked card
  event.currentTarget.classList.add('selected');
  
  // In a real app, you would fetch rider details from your backend
  const mockRider = {
    id: 101,
    name: "John Doe",
    phone: "0712345678",
    rating: "4.9",
    rides: "120",
    vehicle: ride.vehicleType,
    from: fromInput.value,
    to: toInput.value,
    price: ride.price,
    time: ride.time,
    vehicleImage: ride.image
  };
  
  displayRiderDetails(mockRider);
}

function displayRiderDetails(rider) {
  selectedRider = rider;
  
  // Set rider details
  riderName.textContent = rider.name;
  riderPhone.textContent = rider.phone;
  rideVehicle.textContent = rider.vehicle;
  rideFrom.textContent = rider.from;
  rideTo.textContent = rider.to;
  rideTime.textContent = rider.time;
  ridePrice.textContent = `${rider.price} TZS`;
  
  // Set rider avatar
  const initials = rider.name.split(' ').map(n => n.charAt(0)).join('');
  riderAvatar.textContent = initials;
  setRandomAvatarBg(riderAvatar);
  
  riderDetails.classList.remove('hidden');
  riderDetails.scrollIntoView({ behavior: 'smooth' });
}

async function confirmRide() {
  if (!selectedRider || !currentUser) {
    showNotification('Please select a ride option first', 'error');
    return;
  }

  try {
    showLoader(confirmRideBtn, 'Confirming...');

    // In a real app, you would send this to your backend
    const rideData = {
      rideId: Math.floor(Math.random() * 10000),
      passengerId: currentUser.id,
      passengerName: `${currentUser.firstName} ${currentUser.lastName}`,
      passengerPhone: currentUser.mobileContact,
      riderId: selectedRider.id,
      riderName: selectedRider.name,
      riderPhone: selectedRider.phone,
      vehicleType: selectedRider.vehicle,
      from: selectedRider.from,
      to: selectedRider.to,
      price: selectedRider.price,
      time: selectedRider.time,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    currentRide = rideData;
    showRideConfirmation(rideData);
    
    // Save ride to local storage
    const rides = JSON.parse(localStorage.getItem('rides') || [];
    rides.push(rideData);
    localStorage.setItem('rides', JSON.stringify(rides));
    
    showNotification('Your ride has been confirmed!', 'success');
  } catch (error) {
    console.error('Error confirming ride:', error);
    showNotification('Failed to confirm ride. Please try again.', 'error');
  } finally {
    hideLoader(confirmRideBtn, 'Confirm Ride');
  }
}

function showRideConfirmation(ride) {
  riderDetails.classList.add('hidden');
  rideConfirmation.classList.remove('hidden');
  
  confirmationDetails.innerHTML = `
    <div class="ride-summary">
      <div class="ride-summary-item">
        <span class="label">Rider:</span>
        <span class="value">${ride.riderName}</span>
      </div>
      <div class="ride-summary-item">
        <span class="label">Vehicle:</span>
        <span class="value">${ride.vehicleType}</span>
      </div>
      <div class="ride-summary-item">
        <span class="label">From:</span>
        <span class="value">${ride.from}</span>
      </div>
      <div class="ride-summary-item">
        <span class="label">To:</span>
        <span class="value">${ride.to}</span>
      </div>
      <div class="ride-summary-item">
        <span class="label">Price:</span>
        <span class="value">${ride.price} TZS</span>
      </div>
    </div>
  `;
  
  rideConfirmation.scrollIntoView({ behavior: 'smooth' });
}

function startRideTracking() {
  rideConfirmation.classList.add('hidden');
  trackingSection.classList.remove('hidden');
  
  // Simulate ride tracking
  let eta = 5; // minutes
  updateTrackingDisplay(eta);
  
  trackingInterval = setInterval(() => {
    eta -= 1;
    if (eta <= 0) {
      clearInterval(trackingInterval);
      showNotification('Your rider has arrived!', 'success');
      updateTrackingDisplay(0);
      trackRideBtn.textContent = 'Ride Completed';
      trackRideBtn.classList.add('btn-success');
      trackRideBtn.removeEventListener('click', startRideTracking);
      trackRideBtn.addEventListener('click', () => {
        showNotification('Thank you for using Kichuo Chuo!', 'info');
      });
      return;
    }
    updateTrackingDisplay(eta);
  }, 60000); // Update every minute
}

function updateTrackingDisplay(eta) {
  document.getElementById('tracking-eta').textContent = eta > 0 ? `${eta} min` : 'Arrived';
  document.getElementById('tracking-distance').textContent = eta > 0 ? `${eta * 0.8} km` : '0 km';
}

// Utility functions
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function showLoader(button, text) {
  button.disabled = true;
  button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
}

function hideLoader(button, text) {
  button.disabled = false;
  button.textContent = text;
}

function setRandomAvatarBg(element) {
  const randomColor = config.defaultAvatarBgColors[
    Math.floor(Math.random() * config.defaultAvatarBgColors.length)
  ];
  element.style.backgroundColor = randomColor;
}
