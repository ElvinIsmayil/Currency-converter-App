# Quantum Exchange - Advanced Currency Converter

A futuristic, visually stunning, and highly interactive currency converter application with advanced UI/UX, smooth animations, and immersive transitions.

![Quantum Exchange](https://i.imgur.com/placeholder-image.png)

## Features

### Core UI Features
- **Fluid Animations**: Smooth transitions for every interaction (currency selection, value input, conversions, theme switch)
- **Dynamic Visuals**: Animated flow of money and glowing exchange rate indicators
- **Modern Design**: Glassmorphism & Neumorphism UI elements for a futuristic look
- **Dark/Light Mode**: Toggle with smooth color transitions
- **Microinteractions**: Subtle animations and effects for an engaging experience

### Currency Conversion Features
- **Real-time Exchange Rates**: Auto-refreshing rates from a currency API
- **Multi-currency Selection**: Beautiful dropdowns with animated flag icons
- **Historical Exchange Rate Trends**: Animated charts for visualizing rate changes
- **Live Currency Trends**: Color-coded indicators (green for rising, red for falling)
- **Offline Support**: Continues working with cached exchange rates
- **QR Code Sharing**: Easily share conversion details

### User Experience Enhancements
- **Customizable Themes**: Switch between light and dark mode
- **Currency Favorites**: Save and quickly access your frequent conversions
- **Multi-currency Comparison**: Compare multiple currencies at once
- **GSAP Animations**: Smooth, professional animations throughout the interface

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Animation Libraries**: GSAP (GreenSock Animation Platform)
- **API**: ExchangeRate-API for currency conversion
- **Charts**: Chart.js for data visualization
- **QR Code**: QRCode.js for generating shareable QR codes

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for real-time rates (works offline with limited functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quantum-exchange.git
```

2. Navigate to the project directory:
```bash
cd quantum-exchange
```

3. Open the `index.html` file in your browser or set up a local server:
```bash
# Using Python
python -m http.server

# Using Node.js
npx serve
```

## Usage

1. **Basic Conversion**:
   - Enter an amount
   - Select source and target currencies
   - View the conversion result instantly

2. **Managing Favorites**:
   - Convert a currency
   - Select the favorites tab
   - Add current conversion to favorites
   - Click on any favorite to load it back

3. **Using the Chart**:
   - View historical exchange rate trends
   - Change time periods (7D, 1M, 3M, 1Y)
   - Hover over points to see specific values

4. **Comparing Currencies**:
   - Go to the Compare tab
   - View multiple currencies against your base currency
   - Add more currencies to the comparison list

5. **Sharing via QR Code**:
   - Click the Share button
   - Scan the generated QR code with a mobile device

## Customization

- **Theme**: Toggle between light and dark mode using the switch in the top-right corner
- **Appearance**: The app adapts to different screen sizes for optimal viewing experience

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Exchange rate data provided by [ExchangeRate-API](https://www.exchangerate-api.com/)
- Flag icons provided by [Flagpedia](https://flagpedia.net/)
- Icons by [FontAwesome](https://fontawesome.com/)

---

Created with ❤️ by Your Name 