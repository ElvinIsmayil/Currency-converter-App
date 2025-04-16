// API Endpoints
const API_KEY = "370077901a645161c4efa344";
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
const CONVERT_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair`;
const HISTORY_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/history`;

// Currency Data
const CURRENCY_NAMES = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    INR: "Indian Rupee",
    RUB: "Russian Ruble",
    ZAR: "South African Rand",
    MXN: "Mexican Peso",
    SGD: "Singapore Dollar",
    NZD: "New Zealand Dollar",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    KRW: "South Korean Won",
    TRY: "Turkish Lira",
    BRL: "Brazilian Real",
    HKD: "Hong Kong Dollar"
};

// App Configuration
const CONFIG = {
    defaultFromCurrency: "USD",
    defaultToCurrency: "EUR",
    defaultAmount: 1,
    refreshInterval: 60000, // 1 minute
    animationDuration: 0.5,
    chartPeriods: {
        "7d": 7,
        "1m": 30,
        "3m": 90,
        "1y": 365
    },
    maxFavorites: 10,
    maxComparisonCurrencies: 8
};

// Export all constants
export { BASE_URL, CONVERT_URL, HISTORY_URL, CURRENCY_NAMES, CONFIG };