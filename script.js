// Configuration
const config = {
  backendUrl: window.location.origin,
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
  // Auth elements
  authSection: document.getElementById('auth-section'),
  authTabs: document.querySelectorAll('.auth-tab'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  signupForm: document.getElementById('signup-form'),
  signupFirstName: document.getElementById('signup-firstname'),
  signupLastName: document.getElementById('signup-lastname'),
  signupEmail: document.getElementById('signup-email'),
  signupPhone: document.getElementById('signup-phone'),
  signupPassword: document.getElementById('signup-password'),
  signupConfirmPassword: document.getElementById('signup-confirm-password'),
  userTypeOptions: document.querySelectorAll('.user-type-option'),
  userTypeInput: document.getElementById('user-type'),
  
  // App elements
  appContainer: document.getElementById('app-container'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  fromInput: document.getElementById('from'),
  toInput: document.getElementById('to'),
  fromSuggestions: document.getElementById('from-suggestions'),
  toSuggestions: document.getElementById('to-suggestions'),
  findRideBtn: document.getElementById('find-ride-btn'),
  rideResults: document.getElementById('ride-results'),
  vehicleOptions: document.getElementById('vehicle-options'),
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
  rideConfirmation: document.getElementById('ride-confirmation'),
  confirmationDetails: document.getElementById('confirmation-details'),
  trackRideBtn: document.getElementById('track-ride-btn')
};

// Application State
let state = {
  currentUser: null,
  routes: [],
  riders: [],
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
  // Auth tab switching
  elements.authTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabType = e.target.getAttribute('onclick').match(/'(\w+)'/)[1];
      switchAuthTab(tabType);
    });
  });

  // Login form
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLogin);
  }

  // Signup form
  if (elements.signupForm) {
    elements.signupForm.addEventListener('submit', handleSignup);
  }

  // User type selection
  elements.userTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      selectUserType(this);
    });
  });

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

// Switch between login and signup tabs
function switchAuthTab(tabType) {
  elements.authTabs.forEach(tab => {
    if (tab.getAttribute('onclick').includes(tabType)) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  if (tabType === 'login') {
    elements.loginForm.style.display = 'block';
    elements.signupForm.style.display = 'none';
  } else {
    elements.loginForm.style.display = 'none';
    elements.signupForm.style.display = 'block';
  }
}

// Select user type in signup form
function selectUserType(element) {
  elements.userTypeOptions.forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  elements.userTypeInput.value = element.dataset.type;
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!email || !password) {
    showNotification('Please enter both email and password', 'error');
    return;
  }

  try {
    showLoader(elements.loginForm.querySelector('button'), 'Logging in...');

    const response = await fetch(`${config.backendUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
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

// Handle signup form submission
async function handleSignup(e) {
  e.preventDefault();
  const firstName = elements.signupFirstName.value.trim();
  const lastName = elements.signupLastName.value.trim();
  const email = elements.signupEmail.value.trim();
  const phone = elements.signupPhone.value.trim();
  const password = elements.signupPassword.value.trim();
  const confirmPassword = elements.signupConfirmPassword.value.trim();
  const userType = elements.userTypeInput.value;

  // Validation
  if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !userType) {
    showNotification('Please fill all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    showLoader(elements.signupForm.querySelector('button'), 'Registering...');

    const response = await fetch(`${config.backendUrl}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        password,
        userType
      }),
    });

    const data = await response.json();

    if (data.success) {
      state.currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      showApp();
      showNotification(`Welcome to Kichuo Chuo, ${data.user.firstName}!`, 'success');
    } else {
      showNotification(data.message || 'Registration failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showNotification('An error occurred during registration. Please try again.', 'error');
  } finally {
    hideLoader(elements.signupForm.querySelector('button'), 'Create Account');
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

  const filtered = state.routes.filter(route => {
    const location = type === 'from' ? route.FromLocationName : route.ToLocationName;
    return location.toLowerCase().includes(inputValue);
  });

  if (filtered.length > 0) {
    filtered.forEach(route => {
      const location = type === 'from' ? route.FromLocationName : route.ToLocationName;
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion-item';
      suggestion.textContent = location;
      suggestion.onclick = () => {
        inputElement.value = location;
        if (type === 'from') {
          // Store zone for 'from' location
          document.getElementById('from-zone').value = route.Zone;
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

    // Generate vehicle options based on route
    const vehicleOptions = [
      {
        id: 1,
        vehicleType: "Motorcycle",
        price: route.MotorcyclePrice,
        time: "10 min",
        image: "{{ url_for('static', filename='images/motorbike.png') }}",
        description: "Fast and affordable"
      },
      {
        id: 2,
        vehicleType: "Bajaji",
        price: route.BajajiPrice,
        time: "15 min",
        image: "{{ url_for('static', filename='images/tuktuk.png') }}",
        description: "Covered and comfortable"
      },
      {
        id: 3,
        vehicleType: "Car",
        price: route.CarPrice,
        time: "12 min",
        image: "{{ url_for('static', filename='images/taxi.png') }}",
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
    if (!ride.price || ride.price <= 0) return; // Skip unavailable options
    
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

// Select a ride option and find available riders
async function selectRideOption(ride) {
  state.selectedVehicle = ride;
  
  // Update UI
  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
  
  try {
    showLoader(elements.findRideBtn, 'Finding riders...');
    
    // Get zone from 'from' location
    const zone = document.getElementById('from-zone').value;
    if (!zone) {
      showNotification('Could not determine zone for pickup location', 'error');
      return;
    }
    
    // Fetch available riders
    const response = await fetch(
      `${config.backendUrl}/api/riders?vehicleType=${ride.vehicleType}&zone=${zone}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch riders');
    
    const riders = await response.json();
    if (riders.length === 0) {
      showNotification('No riders available for selected vehicle type', 'info');
      return;
    }
    
    // Select a random rider (in real app, you might have a matching algorithm)
    const rider = riders[Math.floor(Math.random() * riders.length)];
    displayRiderDetails(rider, ride);
    
  } catch (error) {
    console.error('Error finding riders:', error);
    showNotification('Failed to find riders. Please try again.', 'error');
  } finally {
    hideLoader(elements.findRideBtn, 'Find Rides');
  }
}

// Display rider details
function displayRiderDetails(rider, ride) {
  state.selectedRider = rider;
  
  // Set rider details
  elements.riderName.textContent = rider.Name;
  elements.riderPhone.textContent = rider.Phone;
  elements.rideVehicle.textContent = ride.vehicleType;
  elements.rideFrom.textContent = elements.fromInput.value;
  elements.rideTo.textContent = elements.toInput.value;
  elements.rideTime.textContent = ride.time;
  elements.ridePrice.textContent = `${ride.price} TZS`;
  
  // Set rider avatar
  const initials = rider.Name.split(' ').map(n => n.charAt(0)).join('');
  elements.riderAvatar.textContent = initials;
  setRandomAvatarBg(elements.riderAvatar);
  
  elements.riderDetails.classList.remove('hidden');
  elements.riderDetails.scrollIntoView({ behavior: 'smooth' });
}

// Confirm ride with selected rider
async function confirmRide() {
  if (!state.selectedRider || !state.currentUser || !state.selectedVehicle) {
    showNotification('Please select a ride option first', 'error');
    return;
  }

  try {
    showLoader(elements.confirmRideBtn, 'Confirming...');

    const rideData = {
      passengerId: state.currentUser.id,
      passengerName: `${state.currentUser.firstName} ${state.currentUser.lastName}`,
      passengerEmail: state.currentUser.email,
      passengerPhone: state.currentUser.phone,
      riderId: state.selectedRider.RiderID,
      riderName: state.selectedRider.Name,
      riderPhone: state.selectedRider.Phone,
      vehicleType: state.selectedVehicle.vehicleType,
      fromLocation: elements.fromInput.value,
      toLocation: elements.toInput.value
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
        <span class="value">${ride.fromLocation}</span>
      </div>
      <div class="ride-summary-item">
        <span class="label">To:</span>
        <span class="value">${ride.toLocation}</span>
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
  let eta = 5; // minutes
  
  // Update UI
  elements.rideConfirmation.classList.add('hidden');
  elements.trackingSection.classList.remove('hidden');
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
