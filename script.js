// Configuration
const config = {
  backendUrl: window.location.origin, // Automatically matches current host
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
const elements = {
  // Auth Section
  authSection: document.getElementById('auth-section'),
  loginForm: document.getElementById('login-form'),
  loginPhoneInput: document.getElementById('login-phone'),
  registerLink: document.getElementById('register-link'),
  
  // Main App
  appContainer: document.getElementById('app-container'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  
  // Ride Booking
  fromInput: document.getElementById('from'),
  toInput: document.getElementById('to'),
  fromSuggestions: document.getElementById('from-suggestions'),
  toSuggestions: document.getElementById('to-suggestions'),
  findRideBtn: document.getElementById('find-ride-btn'),
  
  // Ride Results
  rideResults: document.getElementById('ride-results'),
  vehicleOptions: document.getElementById('vehicle-options'),
  
  // Rider Details
  riderDetails: document.getElementById('rider-details'),
  riderAvatar: document.getElementById('rider-avatar'),
  riderName: document.getElementById('rider-name'),
  riderPhone: document.getElementById('rider-phone'),
  rideVehicle: document.getElementById('ride-vehicle'),
  rideFrom: document.getElementById('ride-from'),
  rideTo: document.getElementById('ride-to'),
  rideTime: document.getElementById('ride-time'),
  ridePrice: document.getElementById('ride-price'),
  confirmRideBtn: document.getElementById('confirm-ride-btn'),
  
  // Ride Confirmation
  rideConfirmation: document.getElementById('ride-confirmation'),
  confirmationDetails: document.getElementById('confirmation-details'),
  trackRideBtn: document.getElementById('track-ride-btn'),
  
  // Ride Tracking
  trackingSection: document.getElementById('tracking-section'),
  trackingEta: document.getElementById('tracking-eta'),
  trackingDistance: document.getElementById('tracking-distance')
};

// Application State
let state = {
  currentUser: null,
  routes: [],
  selectedVehicle: null,
  selectedRider: null,
  currentRide: null,
  trackingInterval: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  setupEventListeners();
  loadRoutes();
});

// Check if user is already authenticated
function checkAuthState() {
  const userData = localStorage.getItem('user');
  if (userData) {
    state.currentUser = JSON.parse(userData);
    showApp();
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Login form
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }

  // Register link
  if (elements.registerLink) {
    elements.registerLink.addEventListener('click', showRegisterForm);
  }

  // Location inputs
  elements.fromInput.addEventListener('input', () => handleLocationInput('from'));
  elements.toInput.addEventListener('input', () => handleLocationInput('to'));

  // Ride buttons
  elements.findRideBtn.addEventListener('click', findRides);
  elements.confirmRideBtn.addEventListener('click', confirmRide);
  elements.trackRideBtn.addEventListener('click', startRideTracking);

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.location-input')) {
      elements.fromSuggestions.style.display = 'none';
      elements.toSuggestions.style.display = 'none';
    }
  });
}

// Show registration form
function showRegisterForm(e) {
  e.preventDefault();
  // Implementation would go here
  showNotification('Registration will be implemented soon!', 'info');
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  const phone = elements.loginPhoneInput.value.trim();

  if (!phone) {
    showNotification('Please enter your phone number', 'error');
    return;
  }

  try {
    showLoader(elements.loginForm.querySelector('button'), 'Continuing...');

    const response = await fetch(`${config.backendUrl}/api/login-passenger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileContact: phone }),
    });

    const data = await response.json();

    if (data.success) {
      state.currentUser = data.user;
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
    hideLoader(elements.loginForm.querySelector('button'), 'Continue');
  }
}

// Load routes from backend
async function loadRoutes() {
  try {
    const response = await fetch(`${config.backendUrl}/api/routes`);
    if (response.ok) {
      state.routes = await response.json();
      console.log('Routes loaded:', state.routes);
    }
  } catch (error) {
    console.error('Error loading routes:', error);
    showNotification('Failed to load routes. Please refresh the page.', 'error');
  }
}

// Show main application
function showApp() {
  elements.authSection.classList.add('hidden');
  elements.appContainer.classList.remove('hidden');
  
  if (state.currentUser) {
    const initials = state.currentUser.firstName.charAt(0) + state.currentUser.lastName.charAt(0);
    elements.userAvatar.textContent = initials;
    elements.userName.textContent = `${state.currentUser.firstName} ${state.currentUser.lastName}`;
    setRandomAvatarBg(elements.userAvatar);
  }
}

// Handle location input and suggestions
function handleLocationInput(type) {
  const inputElement = type === 'from' ? elements.fromInput : elements.toInput;
  const suggestionsContainer = type === 'from' ? elements.fromSuggestions : elements.toSuggestions;
  const inputValue = inputElement.value.toLowerCase();
  
  suggestionsContainer.innerHTML = '';
  suggestionsContainer.style.display = 'none';

  if (inputValue.length < 2) return;

  const filtered = state.routes.filter(route => 
    route[type === 'from' ? 'FromLocationName' : 'ToLocationName'].toLowerCase().includes(inputValue)
  );

  if (filtered.length > 0) {
    filtered.forEach(route => {
      const location = type === 'from' ? route.FromLocationName : route.ToLocationName;
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion-item';
      suggestion.textContent = location;
      suggestion.onclick = () => {
        inputElement.value = location;
        if (type === 'from') {
          document.getElementById('from-zone').value = route.Zone || '';
        }
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
      };
      suggestionsContainer.appendChild(suggestion);
    });
    suggestionsContainer.style.display = 'block';
  }
}

// Find available rides
async function findRides() {
  const from = elements.fromInput.value;
  const to = elements.toInput.value;

  if (!from || !to) {
    showNotification('Please enter both pickup and destination locations', 'error');
    return;
  }

  try {
    showLoader(elements.findRideBtn, 'Finding rides...');

    // Find matching route
    const route = state.routes.find(r => 
      r.FromLocationName === from && r.ToLocationName === to
    );
    
    if (!route) {
      showNotification('No rides available for this route', 'info');
      return;
    }

    // Generate vehicle options with correct image paths
    const vehicleOptions = [
      {
        id: 1,
        vehicleType: "Motorcycle",
        price: route.MotorcyclePrice,
        time: "10 min",
        image: "/static/images/motorbike.png",
        description: "Fast and affordable"
      },
      {
        id: 2,
        vehicleType: "Bajaji",
        price: route.BajajiPrice,
        time: "15 min",
        image: "/static/images/tuktuk.png",
        description: "Covered and comfortable"
      },
      {
        id: 3,
        vehicleType: "Car",
        price: route.CarPrice,
        time: "12 min",
        image: "/static/images/taxi.png",
        description: "Private and comfortable"
      }
    ];

    displayRideOptions(vehicleOptions);
  } catch (error) {
    console.error('Error finding rides:', error);
    showNotification('Failed to find rides. Please try again.', 'error');
  } finally {
    hideLoader(elements.findRideBtn, 'Find Rides');
  }
}

// Display available ride options
function displayRideOptions(rides) {
  elements.vehicleOptions.innerHTML = '';
  
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
    elements.vehicleOptions.appendChild(card);
  });
  
  elements.rideResults.classList.remove('hidden');
  elements.rideResults.scrollIntoView({ behavior: 'smooth' });
}

// Select a ride option
function selectRideOption(ride) {
  state.selectedVehicle = ride;
  
  // Update UI
  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
  
  // Mock rider details (in real app, this would come from backend)
  const mockRider = {
    id: 101,
    name: "John Doe",
    phone: "0712345678",
    rating: "4.9",
    rides: "120",
    vehicle: ride.vehicleType,
    from: elements.fromInput.value,
    to: elements.toInput.value,
    price: ride.price,
    time: ride.time
  };
  
  displayRiderDetails(mockRider);
}

// Display rider details
function displayRiderDetails(rider) {
  state.selectedRider = rider;
  
  // Set rider details
  elements.riderName.textContent = rider.name;
  elements.riderPhone.textContent = rider.phone;
  elements.rideVehicle.textContent = rider.vehicle;
  elements.rideFrom.textContent = rider.from;
  elements.rideTo.textContent = rider.to;
  elements.rideTime.textContent = rider.time;
  elements.ridePrice.textContent = `${rider.price} TZS`;
  
  // Set rider avatar
  const initials = rider.name.split(' ').map(n => n.charAt(0)).join('');
  elements.riderAvatar.textContent = initials;
  setRandomAvatarBg(elements.riderAvatar);
  
  elements.riderDetails.classList.remove('hidden');
  elements.riderDetails.scrollIntoView({ behavior: 'smooth' });
}

// Confirm ride with selected rider
async function confirmRide() {
  if (!state.selectedRider || !state.currentUser) {
    showNotification('Please select a ride option first', 'error');
    return;
  }

  try {
    showLoader(elements.confirmRideBtn, 'Confirming...');

    const rideData = {
      passengerId: state.currentUser.id,
      passengerName: `${state.currentUser.firstName} ${state.currentUser.lastName}`,
      passengerPhone: state.currentUser.mobileContact,
      riderId: state.selectedRider.id,
      riderName: state.selectedRider.name,
      riderPhone: state.selectedRider.phone,
      vehicleType: state.selectedVehicle.vehicleType,
      from: state.selectedRider.from,
      to: state.selectedRider.to
    };

    const response = await fetch(`${config.backendUrl}/api/confirm-ride`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rideData)
    });

    const data = await response.json();

    if (data.success) {
      state.currentRide = {
        ...rideData,
        rideId: data.rideId,
        price: data.price,
        commission: data.commission,
        netAmount: data.netAmount
      };
      showRideConfirmation(state.currentRide);
      showNotification('Your ride has been confirmed!', 'success');
    } else {
      throw new Error(data.message || 'Failed to confirm ride');
    }
  } catch (error) {
    console.error('Error confirming ride:', error);
    showNotification(error.message || 'Failed to confirm ride. Please try again.', 'error');
  } finally {
    hideLoader(elements.confirmRideBtn, 'Confirm Ride');
  }
}

// Show ride confirmation details
function showRideConfirmation(ride) {
  elements.riderDetails.classList.add('hidden');
  elements.rideConfirmation.classList.remove('hidden');
  
  elements.confirmationDetails.innerHTML = `
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
  
  elements.rideConfirmation.scrollIntoView({ behavior: 'smooth' });
}

// Start ride tracking simulation
function startRideTracking() {
  elements.rideConfirmation.classList.add('hidden');
  elements.trackingSection.classList.remove('hidden');
  
  let eta = 5; // minutes
  updateTrackingDisplay(eta);
  
  // Clear any existing interval
  if (state.trackingInterval) {
    clearInterval(state.trackingInterval);
  }
  
  // Simulate ride progress
  state.trackingInterval = setInterval(() => {
    eta -= 1;
    if (eta <= 0) {
      clearInterval(state.trackingInterval);
      showNotification('Your rider has arrived!', 'success');
      updateTrackingDisplay(0);
      completeRide();
      return;
    }
    updateTrackingDisplay(eta);
  }, 60000); // Update every minute
}

// Update tracking display
function updateTrackingDisplay(eta) {
  elements.trackingEta.textContent = eta > 0 ? `${eta} min` : 'Arrived';
  elements.trackingDistance.textContent = eta > 0 ? `${eta * 0.8} km` : '0 km';
}

// Complete the ride
function completeRide() {
  elements.trackRideBtn.textContent = 'Ride Completed';
  elements.trackRideBtn.classList.add('btn-success');
  elements.trackRideBtn.removeEventListener('click', startRideTracking);
  elements.trackRideBtn.addEventListener('click', () => {
    showNotification('Thank you for using Kichuo Chuo!', 'info');
  });
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
