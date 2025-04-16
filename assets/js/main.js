import { BASE_URL, CONVERT_URL, HISTORY_URL, CURRENCY_NAMES, CONFIG } from "./constants.js";

// ===== Utility Functions =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Format a number with commas and specified decimal places
 */
const formatNumber = (number, decimals = 2) => {
    return Number(number).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Generate a country code from a currency code
 */
const getCurrencyCountryCode = (currencyCode) => {
    // Special cases
    if (currencyCode === 'EUR') return 'eu';
    if (currencyCode === 'GBP') return 'gb';
    
    // Default: first two letters lowercase (works for most currency codes)
    return currencyCode.slice(0, 2).toLowerCase();
};

/**
 * Debounce function to limit how often a function can be called
 */
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Store data in local storage
 */
const storeData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Get data from local storage
 */
const getData = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

// ===== State Management =====
const state = {
    currencies: {},
    conversionRates: {},
    fromCurrency: CONFIG.defaultFromCurrency,
    toCurrency: CONFIG.defaultToCurrency,
    amount: CONFIG.defaultAmount,
    lastUpdated: null,
    isOnline: navigator.onLine,
    favorites: getData('favorites') || [],
    comparisonCurrencies: getData('comparison') || [
        'EUR', 'GBP', 'JPY', 'CAD', 'AUD'
    ],
    chartPeriod: '7d',
    chartData: null,
    isDarkMode: getData('darkMode') || window.matchMedia('(prefers-color-scheme: dark)').matches,
    isInitialLoad: true
};

// ===== API Functions =====
/**
 * Fetch all currency rates
 */
async function fetchCurrencyRates() {
    try {
        updateConnectionStatus(true);
        const response = await axios.get(BASE_URL);
        const data = response.data;
        
        if (data.result === 'success') {
            state.conversionRates = data.conversion_rates;
            state.lastUpdated = new Date();
            
            // Store data for offline use
            storeData('currencyRates', {
                rates: data.conversion_rates,
                timestamp: state.lastUpdated.toISOString()
            });
            
            return data.conversion_rates;
        }
    } catch (error) {
        console.error('Error fetching currency rates:', error);
        updateConnectionStatus(false);
        
        // Use cached data if available
        const cachedData = getData('currencyRates');
        if (cachedData) {
            state.conversionRates = cachedData.rates;
            state.lastUpdated = new Date(cachedData.timestamp);
            return cachedData.rates;
        }
    }
    return null;
}

/**
 * Fetch historical exchange rate data
 */
async function fetchHistoricalData(fromCurrency, toCurrency, days) {
    try {
        // Note: The free API doesn't have historical data,
        // so we'll simulate it for demo purposes
        const today = new Date();
        const data = {
            labels: [],
            rates: []
        };
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            data.labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate some random variation around the current rate
            const currentRate = state.conversionRates[toCurrency] / state.conversionRates[fromCurrency];
            const randomFactor = 0.98 + (Math.random() * 0.04); // Random between 0.98 and 1.02
            data.rates.push(currentRate * randomFactor);
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return null;
    }
}

// ===== UI Update Functions =====
/**
 * Update the connection status indicator
 */
function updateConnectionStatus(isOnline) {
    const statusElement = $('.connection-status');
    const statusText = $('.status-text');
    
    state.isOnline = isOnline;
    
    if (isOnline) {
        statusElement.classList.remove('offline');
        statusElement.classList.add('online');
        statusText.textContent = 'Live Rates';
    } else {
        statusElement.classList.remove('online');
        statusElement.classList.add('offline');
        statusText.textContent = 'Offline Mode';
    }
}

/**
 * Update the last updated timestamp
 */
function updateLastUpdated() {
    const updateTimeElement = $('#update-time');
    
    if (state.lastUpdated) {
        const now = new Date();
        const diff = (now - state.lastUpdated) / 1000; // in seconds
        
        if (diff < 60) {
            updateTimeElement.textContent = 'Updated just now';
        } else if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            updateTimeElement.textContent = `Updated ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(diff / 3600);
            updateTimeElement.textContent = `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
    } else {
        updateTimeElement.textContent = 'Not updated yet';
    }
}

/**
 * Populate the currency dropdowns
 */
function populateCurrencyDropdowns() {
    const fromList = $('#fromCurrencyList');
    const toList = $('#toCurrencyList');
    
    fromList.innerHTML = '';
    toList.innerHTML = '';
    
    // Sort currencies by name
    const sortedCurrencies = Object.keys(state.conversionRates).sort((a, b) => {
        const nameA = CURRENCY_NAMES[a] || a;
        const nameB = CURRENCY_NAMES[b] || b;
        return nameA.localeCompare(nameB);
    });
    
    sortedCurrencies.forEach(currency => {
        const name = CURRENCY_NAMES[currency] || currency;
        const countryCode = getCurrencyCountryCode(currency);
        
        // From currency list item
        const fromItem = document.createElement('li');
        fromItem.dataset.currency = currency;
        fromItem.innerHTML = `
            <img src="https://flagcdn.com/w20/${countryCode}.png" class="flag-icon" alt="${currency}">
            <span class="currency-code">${currency}</span>
            <span class="currency-name">${name}</span>
        `;
        fromItem.addEventListener('click', () => {
            selectCurrency('from', currency);
        });
        fromList.appendChild(fromItem);
        
        // To currency list item
        const toItem = document.createElement('li');
        toItem.dataset.currency = currency;
        toItem.innerHTML = `
            <img src="https://flagcdn.com/w20/${countryCode}.png" class="flag-icon" alt="${currency}">
            <span class="currency-code">${currency}</span>
            <span class="currency-name">${name}</span>
        `;
        toItem.addEventListener('click', () => {
            selectCurrency('to', currency);
        });
        toList.appendChild(toItem);
    });
    
    // Set initial selected currencies
    updateSelectedCurrency('from', state.fromCurrency);
    updateSelectedCurrency('to', state.toCurrency);
}

/**
 * Update the selected currency display
 */
function updateSelectedCurrency(type, currency) {
    const nameElement = $(`#${type}CurrencyName`);
    const codeElement = $(`#${type}CurrencyCode`);
    const flagElement = $(`#${type}Flag`);
    const countryCode = getCurrencyCountryCode(currency);
    
    codeElement.textContent = currency;
    nameElement.textContent = CURRENCY_NAMES[currency] || currency;
    flagElement.src = `https://flagcdn.com/w40/${countryCode}.png`;
    flagElement.alt = currency;
    
    if (type === 'from') {
        state.fromCurrency = currency;
    } else {
        state.toCurrency = currency;
    }
}

/**
 * Select a currency from the dropdown
 */
function selectCurrency(type, currency) {
    updateSelectedCurrency(type, currency);
    toggleCurrencyDropdown(type); // Close the dropdown
    
    if (state.fromCurrency && state.toCurrency) {
        convertCurrency();
        updateChart();
    }
}

/**
 * Toggle a currency dropdown
 */
function toggleCurrencyDropdown(type) {
    const dropdown = $(`#${type}CurrencyDropdown`);
    const listContainer = dropdown.querySelector('.currency-list-container');
    
    // Close any open dropdowns first
    $$('.currency-dropdown.active').forEach(el => {
        if (el !== dropdown) {
            const otherContainer = el.querySelector('.currency-list-container');
            gsap.to(otherContainer, {
                opacity: 0,
                y: -10,
                duration: 0.2,
                onComplete: () => {
                    el.classList.remove('active');
                    otherContainer.style.visibility = 'hidden';
                }
            });
        }
    });
    
    if (dropdown.classList.contains('active')) {
        // Close this dropdown with animation
        gsap.to(listContainer, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            onComplete: () => {
                dropdown.classList.remove('active');
                listContainer.style.visibility = 'hidden';
            }
        });
    } else {
        // Open this dropdown with animation
        listContainer.style.visibility = 'visible';
        dropdown.classList.add('active');
        
        gsap.fromTo(listContainer,
            { opacity: 0, y: -10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                onStart: () => {
                    // Ensure max-height is set to allow scrolling
                    listContainer.style.maxHeight = '300px';
                }
            }
        );
    }
}

/**
 * Perform currency conversion
 */
async function convertCurrency() {
    const amountInput = $('#amount');
    const resultElement = $('#result');
    const rateInfoElement = $('#rate-info');
    
    const amount = parseFloat(amountInput.value) || 1;
    state.amount = amount;
    
    if (state.conversionRates) {
        const fromRate = state.conversionRates[state.fromCurrency];
        const toRate = state.conversionRates[state.toCurrency];
        
        if (fromRate && toRate) {
            const rate = toRate / fromRate;
            const convertedAmount = amount * rate;
            
            // Update the result with animation
            animateConversion(state.fromCurrency, state.toCurrency);
            
            // Update result text
            resultElement.textContent = `${formatNumber(amount)} ${state.fromCurrency} ≈ ${formatNumber(convertedAmount)} ${state.toCurrency}`;
            rateInfoElement.textContent = `1 ${state.fromCurrency} = ${formatNumber(rate)} ${state.toCurrency}`;
            
            // Update QR code text
            $('#qrShareText').textContent = `${formatNumber(amount)} ${state.fromCurrency} to ${formatNumber(convertedAmount)} ${state.toCurrency}`;
        }
    }
}

/**
 * Animate the currency conversion flow
 */
function animateConversion(fromCurrency, toCurrency) {
    // Update currency symbols
    const fromSymbol = $('.from-symbol');
    const toSymbol = $('.to-symbol');
    
    // Get currency symbols
    const getCurrencySymbol = (currency) => {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 
            'CNY': '¥', 'KRW': '₩', 'INR': '₹', 'RUB': '₽'
        };
        return symbols[currency] || currency;
    };
    
    fromSymbol.textContent = getCurrencySymbol(fromCurrency);
    toSymbol.textContent = getCurrencySymbol(toCurrency);
    
    // Clear existing particles
    $('.flow-particles').innerHTML = '';
    
    // Create new particles
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random vertical position
        const topPos = Math.random() * 100;
        particle.style.top = `${topPos}%`;
        
        // Random delay
        const delay = Math.random() * 0.5;
        particle.style.animation = `particleFlow 1.5s ${delay}s ease-in-out`;
        
        $('.flow-particles').appendChild(particle);
    }
}

/**
 * Swap the currencies
 */
function swapCurrencies() {
    const temp = state.fromCurrency;
    state.fromCurrency = state.toCurrency;
    state.toCurrency = temp;
    
    updateSelectedCurrency('from', state.fromCurrency);
    updateSelectedCurrency('to', state.toCurrency);
    
    // Animate the swap button
    gsap.to('#swapCurrencies', {
        rotation: 180,
        duration: 0.5,
        ease: 'back.out(1.7)',
        onComplete: () => {
            gsap.set('#swapCurrencies', { rotation: 0 });
        }
    });
    
    convertCurrency();
    updateChart();
}

/**
 * Initialize and update the exchange rate chart
 */
async function updateChart() {
    const days = CONFIG.chartPeriods[state.chartPeriod];
    const data = await fetchHistoricalData(state.fromCurrency, state.toCurrency, days);
    
    if (!data) return;
    
    state.chartData = data;
    
    // Check if chart exists, destroy it if it does
    if (window.exchangeChart) {
        window.exchangeChart.destroy();
    }
    
    // Get chart context
    const ctx = $('#exchangeRateChart').getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(108, 99, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(108, 99, 255, 0)');
    
    // Create chart
    window.exchangeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: `${state.fromCurrency}/${state.toCurrency} Rate`,
                data: data.rates,
                borderColor: '#6c63ff',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#6c63ff',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            return `Rate: ${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        borderDash: [5, 5]
                    },
                    ticks: {
                        callback: (value) => formatNumber(value, 4)
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            animation: {
                duration: 1000
            }
        }
    });
}

/**
 * Update the comparison currencies list
 */
function updateComparisonList() {
    const comparisonList = $('#comparisonList');
    comparisonList.innerHTML = '';
    
    if (!state.conversionRates || !state.fromCurrency) return;
    
    state.comparisonCurrencies.forEach(currency => {
        if (currency === state.fromCurrency) return;
        
        const rate = state.conversionRates[currency] / state.conversionRates[state.fromCurrency];
        
        // Simulate a 24h change (random for demo)
        const changePercent = (Math.random() * 2 - 1) * 2; // Random between -2% and +2%
        const isPositive = changePercent >= 0;
        
        const item = document.createElement('div');
        item.className = 'comparison-item';
        item.innerHTML = `
            <div class="currency-info">
                <img src="https://flagcdn.com/w20/${getCurrencyCountryCode(currency)}.png" class="flag-icon" alt="${currency}">
                <div>
                    <span class="currency-code">${currency}</span>
                    <span class="currency-name">${CURRENCY_NAMES[currency] || currency}</span>
                </div>
            </div>
            <div class="currency-value">${formatNumber(rate)}</div>
            <div class="currency-change ${isPositive ? 'positive' : 'negative'}">
                <i class="fas fa-${isPositive ? 'caret-up' : 'caret-down'}"></i>
                ${Math.abs(changePercent).toFixed(2)}%
            </div>
        `;
        
        comparisonList.appendChild(item);
    });
    
    // Animate the list items
    gsap.from('.comparison-item', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out'
    });
}

/**
 * Add a currency to the comparison list
 */
function addComparisonCurrency() {
    // Simple modal-like prompt (in a real app, use a proper modal)
    const currency = prompt('Enter a currency code to add (e.g., EUR, GBP):');
    
    if (currency && state.conversionRates[currency.toUpperCase()]) {
        const normalizedCurrency = currency.toUpperCase();
        
        if (!state.comparisonCurrencies.includes(normalizedCurrency) && 
            state.comparisonCurrencies.length < CONFIG.maxComparisonCurrencies) {
            state.comparisonCurrencies.push(normalizedCurrency);
            storeData('comparison', state.comparisonCurrencies);
            updateComparisonList();
        }
    }
}

/**
 * Update the favorites list
 */
function updateFavoritesList() {
    const favoritesList = $('#favoritesList');
    const emptyFavorites = $('.empty-favorites');
    
    favoritesList.innerHTML = '';
    
    if (state.favorites.length === 0) {
        // Show empty state
        gsap.to(emptyFavorites, {
            opacity: 1,
            duration: 0.3,
            onStart: () => {
                emptyFavorites.classList.remove('hidden');
                emptyFavorites.style.visibility = 'visible';
                emptyFavorites.style.pointerEvents = 'auto';
            }
        });
        return;
    }
    
    // Hide empty state
    gsap.to(emptyFavorites, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            emptyFavorites.classList.add('hidden');
            emptyFavorites.style.visibility = 'hidden';
            emptyFavorites.style.pointerEvents = 'none';
        }
    });
    
    state.favorites.forEach((favorite, index) => {
        const { fromCurrency, toCurrency, amount } = favorite;
        
        if (!state.conversionRates) return;
        
        const fromRate = state.conversionRates[fromCurrency];
        const toRate = state.conversionRates[toCurrency];
        
        if (!fromRate || !toRate) return;
        
        const rate = toRate / fromRate;
        const convertedAmount = amount * rate;
        
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `
            <div class="favorite-header">
                <div class="favorite-currency">
                    <img src="https://flagcdn.com/w20/${getCurrencyCountryCode(fromCurrency)}.png" class="flag-icon" alt="${fromCurrency}">
                    <span>${fromCurrency}</span>
                </div>
                <div class="favorite-actions">
                    <button class="favorite-btn convert-favorite" data-index="${index}">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="favorite-btn remove-favorite" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="favorite-amount">
                ${formatNumber(amount)} ${fromCurrency} = ${formatNumber(convertedAmount)} ${toCurrency}
            </div>
            <div class="favorite-rate">
                1 ${fromCurrency} = ${formatNumber(rate)} ${toCurrency}
            </div>
        `;
        
        favoritesList.appendChild(item);
    });
    
    // Add event listeners
    $$('.convert-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const favorite = state.favorites[index];
            
            state.fromCurrency = favorite.fromCurrency;
            state.toCurrency = favorite.toCurrency;
            state.amount = favorite.amount;
            
            $('#amount').value = favorite.amount;
            updateSelectedCurrency('from', favorite.fromCurrency);
            updateSelectedCurrency('to', favorite.toCurrency);
            
            convertCurrency();
            updateChart();
            
            // Switch to the main tab
            switchTab('chart');
        });
    });
    
    $$('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            
            // Animate removal
            const item = e.currentTarget.closest('.favorite-item');
            gsap.to(item, {
                height: 0,
                opacity: 0,
                marginTop: 0,
                marginBottom: 0,
                padding: 0,
                duration: 0.3,
                onComplete: () => {
                    state.favorites.splice(index, 1);
                    storeData('favorites', state.favorites);
                    updateFavoritesList();
                }
            });
        });
    });
}

/**
 * Add current conversion to favorites
 */
function addToFavorites() {
    if (state.favorites.length >= CONFIG.maxFavorites) {
        alert(`You can only save up to ${CONFIG.maxFavorites} favorites.`);
        return;
    }
    
    const newFavorite = {
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        amount: state.amount
    };
    
    // Check if already in favorites
    const exists = state.favorites.some(fav => 
        fav.fromCurrency === newFavorite.fromCurrency && 
        fav.toCurrency === newFavorite.toCurrency &&
        fav.amount === newFavorite.amount
    );
    
    if (!exists) {
        state.favorites.push(newFavorite);
        storeData('favorites', state.favorites);
        
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <i class="fas fa-star"></i>
            <span>Added to favorites</span>
        `;
        document.body.appendChild(toast);
        
        // Animate in and out
        gsap.fromTo(toast, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        
        setTimeout(() => {
            gsap.to(toast, {
                y: -50,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    toast.remove();
                }
            });
        }, 3000);
        
        updateFavoritesList();
    }
}

/**
 * Switch between tabs
 */
function switchTab(tabId) {
    // First update all tab buttons
    $$('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Then handle the tab panes with clean animations
    const targetPane = $(`#${tabId}-tab`);
    
    // Only animate if the target tab isn't already active
    if (!targetPane.classList.contains('active')) {
        // First, prepare all inactive tabs
        $$('.tab-pane.active').forEach(pane => {
            if (pane.id !== `${tabId}-tab`) {
                // Remove active class from current active tab
                gsap.to(pane, {
                    opacity: 0,
                    y: -10,
                    duration: 0.2,
                    onComplete: () => {
                        pane.classList.remove('active');
                    }
                });
            }
        });
        
        // Then animate in the new tab
        gsap.fromTo(targetPane,
            { opacity: 0, y: 10 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.3,
                delay: 0.1, // Small delay to allow the previous animation to start
                onStart: () => {
                    // Add active class immediately to ensure proper stacking
                    targetPane.classList.add('active');
                }
            }
        );
    }
    
    // Update UI for the specific tab
    if (tabId === 'compare') {
        updateComparisonList();
    } else if (tabId === 'favorites') {
        updateFavoritesList();
    }
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    
    document.body.classList.toggle('dark-theme', state.isDarkMode);
    document.body.classList.toggle('light-theme', !state.isDarkMode);
    
    // Store preference
    storeData('darkMode', state.isDarkMode);
    
    // Apply transition to background shapes
    gsap.to('.shape', {
        opacity: 0.5,
        duration: 1,
        ease: 'power2.inOut'
    });
    
    // Update chart if exists
    if (window.exchangeChart) {
        updateChart();
    }
}

/**
 * Initialize the QR code
 */
function initQRCode() {
    if (window.QRCode) {
        const qrText = $('#qrShareText').textContent;
        
        $('#qrcode').innerHTML = '';
        new QRCode(document.getElementById("qrcode"), {
            text: qrText,
            width: 200,
            height: 200,
            colorDark: "#6c63ff",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

/**
 * Toggle QR code modal
 */
function toggleQRModal() {
    const qrModal = $('#qrModal');
    
    if (!qrModal.classList.contains('active')) {
        // Show modal
        qrModal.classList.remove('hidden');
        
        // Important: Allow the browser to process the removal of 'hidden' before adding 'active'
        setTimeout(() => {
            qrModal.classList.add('active');
            
            // Update QR code
            initQRCode();
            
            // Animate modal content in
            gsap.fromTo('.qr-modal-content',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
            );
        }, 10);
    } else {
        // Animate modal content out
        gsap.to('.qr-modal-content', {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                qrModal.classList.remove('active');
                
                // Add a small delay before adding hidden class to ensure the transition completes
                setTimeout(() => {
                    qrModal.classList.add('hidden');
                }, 300);
            }
        });
    }
}

/**
 * Initialize the application
 */
async function initApp() {
    // Apply theme
    document.body.classList.toggle('dark-theme', state.isDarkMode);
    document.body.classList.toggle('light-theme', !state.isDarkMode);
    $('#theme-switch').checked = state.isDarkMode;
    
    // Fetch currency rates
    await fetchCurrencyRates();
    
    // Populate currency dropdowns
    populateCurrencyDropdowns();
    
    // Set initial amount
    $('#amount').value = state.amount;
    
    // Perform initial conversion
    convertCurrency();
    
    // Setup initial chart
    updateChart();
    
    // Initial tab
    updateFavoritesList();
    
    // Update UI
    updateLastUpdated();
    
    // Start auto-refresh
    setInterval(async () => {
        if (state.isOnline) {
            await fetchCurrencyRates();
            convertCurrency();
            updateLastUpdated();
            updateComparisonList();
            updateFavoritesList();
        }
    }, CONFIG.refreshInterval);
    
    // Update last updated every minute
    setInterval(updateLastUpdated, 60000);
    
    // Animation for initial load
    if (state.isInitialLoad) {
        gsap.from('.app-container', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power2.out'
        });
        
        gsap.from('.converter-card', {
            opacity: 0,
            y: 50,
            delay: 0.2,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
        
        state.isInitialLoad = false;
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Amount input
    $('#amount').addEventListener('input', debounce(() => {
        convertCurrency();
    }, 300));
    
    // Convert button
    $('#convertBtn').addEventListener('click', convertCurrency);
    
    // Swap currencies button
    $('#swapCurrencies').addEventListener('click', swapCurrencies);
    
    // Currency dropdown toggles
    $('#fromCurrencySelected').addEventListener('click', () => toggleCurrencyDropdown('from'));
    $('#toCurrencySelected').addEventListener('click', () => toggleCurrencyDropdown('to'));
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.currency-dropdown')) {
            $$('.currency-dropdown.active').forEach(dropdown => {
                const listContainer = dropdown.querySelector('.currency-list-container');
                gsap.to(listContainer, {
                    opacity: 0,
                    y: -10,
                    duration: 0.2,
                    onComplete: () => {
                        dropdown.classList.remove('active');
                        listContainer.style.visibility = 'hidden';
                    }
                });
            });
        }
    });
    
    // Currency search filters
    $$('.currency-search').forEach(search => {
        search.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const list = e.target.closest('.currency-list-container').querySelector('.currency-list');
            
            list.querySelectorAll('li').forEach(item => {
                const currencyCode = item.dataset.currency.toLowerCase();
                const currencyName = item.querySelector('.currency-name').textContent.toLowerCase();
                
                if (currencyCode.includes(query) || currencyName.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    // Tab navigation
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // Chart period buttons
    $$('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            $$('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.chartPeriod = btn.dataset.period;
            updateChart();
        });
    });
    
    // Add to comparison list
    $('#addCurrencyBtn').addEventListener('click', addComparisonCurrency);
    
    // Theme toggle
    $('#theme-switch').addEventListener('change', toggleTheme);
    
    // QR Code share
    $('#qrShareBtn').addEventListener('click', toggleQRModal);
    $('#closeQrModal').addEventListener('click', toggleQRModal);
    
    // Voice input (simplified for demo)
    $('#voice-input').addEventListener('click', () => {
        if ('webkitSpeechRecognition' in window) {
            alert('Voice recognition is not implemented in this demo. In a real app, this would use the Web Speech API.');
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    });
    
    // Online/Offline status
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initApp();
});

// Add missing export to avoid module error
export {};


