# Nertz Score Tracker

A modern, mobile-optimized web application for tracking scores during family Nertz game nights. Built with vanilla HTML, CSS, and JavaScript - no server required!

## Features

### 🎮 Game Management
- **Start New Games**: Set custom winning scores (default: 100 points)
- **Player Management**: Add up to 12 players with custom names and icons
- **Score Tracking**: Enter scores for each round (-26 to +52 points per player)
- **Winner Detection**: Automatically detects when a player reaches the winning score

### 👥 Player Features
- **Icon Selection**: Choose from 40+ unique icons for each player
- **Recent Players**: Quick-add previously used players
- **Player Memory**: Remembers players between games
- **Visual Identification**: Each player has a unique icon and color

### 📊 Statistics & Analytics
- **Cumulative Scores**: Real-time total score display for each player
- **Score Progression Chart**: Interactive line chart showing score trends
- **Round-by-Round Tracking**: Complete history of all rounds played
- **Mobile-Optimized Charts**: Responsive charts that work on all devices

### 📱 Mobile-First Design
- **Touch-Friendly Interface**: Large buttons and inputs optimized for mobile
- **Responsive Layout**: Works perfectly on phones, tablets, and desktops
- **Modern UI**: Beautiful gradient backgrounds and smooth animations
- **Offline Capable**: Works without internet connection

## How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. The app will automatically load any previously saved games

### Setting Up a New Game
1. **Set Winning Score**: Choose how many points to play to (default: 100)
2. **Add Players**: Click "Add Player" to add players to the game
   - Enter a player name
   - Select an icon from the grid
   - Or choose from recent players for quick setup
3. **Start Game**: Click "Start Game" when ready (minimum 2 players required)

### Playing the Game
1. **Enter Round Scores**: For each player, enter their score for the current round
   - Valid scores: -26 to +52
   - Invalid scores will be highlighted in red
   - Valid scores will be highlighted in green
2. **Save Round**: Click "Save Round" to record all scores
3. **View Totals**: After saving, see updated cumulative scores
4. **Next Round**: Click "Next Round" to continue playing
5. **Winner**: When someone reaches the winning score, a winner modal appears

### Viewing Statistics
- **During Game**: Click "View Stats" to see current standings and charts
- **After Game**: From the winner modal, choose "View Stats" for detailed analysis
- **Cumulative Scores**: See all players ranked by total score
- **Progression Chart**: Interactive chart showing score trends over rounds

### Game Management
- **New Game**: Start a fresh game (current progress will be saved)
- **Continue Game**: Return to an active game (data persists in browser)
- **Player Memory**: Previously used players are remembered for quick setup

## Technical Details

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Offline Support**: Works without internet connection
- **Local Storage**: Game data saved in browser's local storage

### File Structure
```
ScoreKeeper/
├── index.html          # Main application file
├── styles.css          # All styling and responsive design
├── script.js           # Application logic and functionality
└── README.md           # This documentation
```

### Dependencies
- **Font Awesome 6**: For icons (loaded from CDN)
- **Chart.js**: For interactive charts (loaded from CDN)
- **No other dependencies**: Pure vanilla JavaScript

### Data Storage
- **Local Storage**: All game data stored in browser's localStorage
- **Automatic Saving**: Data saved after every action
- **Persistent**: Data survives browser restarts and page refreshes

## Nertz Scoring Rules

The app is designed for the standard Nertz scoring system:
- **Winning a round**: +1 point per card in your Nertz pile
- **Losing a round**: -1 point per card remaining in your hand
- **Typical range**: -26 to +52 points per round
- **Game length**: Variable, typically first to 100 points wins

## Customization

### Changing Winning Score
- Set any winning score from 50 to 500 points
- Default is 100 points
- Can be changed before starting a new game

### Adding More Icons
To add more icons, edit the `icons` array in `script.js`:
```javascript
const icons = [
    'fas fa-user', 'fas fa-star', 'fas fa-heart',
    // Add more Font Awesome icon classes here
];
```

### Styling Customization
All styling is in `styles.css` with CSS custom properties for easy theming:
- Color schemes can be modified in the CSS variables
- Responsive breakpoints can be adjusted
- Animations and transitions can be customized

## Troubleshooting

### Common Issues
1. **Scores not saving**: Check that all scores are between -26 and 52
2. **Players not appearing**: Ensure player name is entered and icon is selected
3. **Chart not displaying**: Refresh the page and try viewing stats again
4. **Data lost**: Check that localStorage is enabled in your browser

### Browser Support
- **Required**: JavaScript enabled
- **Required**: Local storage support
- **Recommended**: Modern browser with ES6+ support

## Hosting

This application can be hosted anywhere that serves static files:

### Local Development
- Simply open `index.html` in a browser
- No server required for development

### Web Hosting
- Upload all files to any web hosting service
- Works with GitHub Pages, Netlify, Vercel, etc.
- No server-side processing required

### File Server
- Serve files from any HTTP server
- Apache, Nginx, or any static file server works
- Can be served from a USB drive or local network

## License

This project is open source and available under the MIT License. Feel free to modify and distribute as needed for your family game nights!

---

**Enjoy your Nertz games! 🎉** 
