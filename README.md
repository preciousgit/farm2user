# Farm2User Frontend - React + Vite

**Week 4 Deliverable: Consumer & Farmer Interface**

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx              # Navigation bar
│   ├── pages/
│   │   ├── ProductVerification.jsx # Consumer product search
│   │   ├── FarmerDashboard.jsx     # Farmer product management
│   │   ├── AnalyticsDashboard.jsx  # ML predictions display
│   │   └── RegulatorView.jsx       # Compliance monitoring
│   ├── services/
│   │   └── apiService.js           # Backend API integration
│   ├── App.jsx                     # Main app component
│   ├── App.css                     # Global styles
│   └── main.jsx                    # React entry point
├── index.html                      # HTML template
├── vite.config.js                  # Vite configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## Setup & Installation

### Prerequisites
- Node.js v16+
- npm or yarn

### Install Dependencies
```bash
cd frontend
npm install
```

This installs:
- `react` - UI framework
- `react-dom` - React DOM rendering
- `axios` - HTTP client
- `web3` / `ethers` - Blockchain interaction
- `vite` - Dev server & build tool

### Environment Configuration

Create a `.env.local` file:
```
VITE_API_URL=http://localhost:3001/api
VITE_ANALYTICS_URL=http://localhost:5000/api/analytics
```

## Running the Frontend

### Development Server
```bash
npm run dev
```

Output:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Build for Production
```bash
npm run build
```

Outputs optimized build to `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## Application Features

### 1. **Product Verification Page** (Consumer)
- Search products by ID
- Display blockchain record
- Show freshness prediction (from ML)
- Display food safety risk assessment
- View complete supply chain journey
- Real-time quality metrics

**API Calls:**
- `GET /api/products/:id` - Product data
- `GET /api/analytics/freshness/:id` - Shelf-life prediction
- `GET /api/analytics/contamination-risk/:id` - Safety assessment

### 2. **Farmer Dashboard**
- Register new products on blockchain
- View all farmer's products
- Monitor product status
- Real-time alerts
- Quality tracking

**Planned Features:**
- MetaMask wallet connection
- Smart contract interaction
- Temperature/humidity sensor integration

### 3. **Analytics Dashboard**
- Real-time ML predictions
- Batch product analysis
- Trend visualization
- Alert notifications
- Performance metrics

**ML Models Displayed:**
- Freshness Score (0-100)
- Contamination Risk (0-100)
- Anomaly Severity
- Remaining Shelf-life

### 4. **Regulatory Compliance View**
- Monitor supply chain alerts
- Compliance tracking
- Anomaly alerts
- Recall management
- Historical reports

## Component Architecture

```
App.jsx (Main)
├── Navbar (Navigation)
├── ProductVerification (Consumer)
├── FarmerDashboard (Producer)
├── AnalyticsDashboard (Intelligence)
└── RegulatorView (Governance)
```

Each page component:
- Calls `apiService` methods
- Manages local state with `useState`
- Loads data with `useEffect`
- Displays loading/error states
- Renders styled output

## API Integration

### Backend (Port 3001)
```javascript
// Get product data
GET /api/products/:id
→ Returns: { productId, productName, farmerName, ... }

// Get farmer's products
GET /api/products/farmer/:address
→ Returns: [{ products }]

// Get product journey
GET /api/products/:id/journey
→ Returns: [{ transfers }]
```

### Analytics (Port 5000)
```javascript
// Freshness prediction
GET /api/analytics/freshness/:id
→ Returns: { 
    freshness_score: 85.5,
    remaining_shelf_life_days: 5,
    freshness_level: "Fresh",
    recommendation: "..."
}

// Contamination risk
GET /api/analytics/contamination-risk/:id
→ Returns: {
    risk_score: 35,
    risk_level: "Low",
    recommendation: "..."
}

// Batch analysis
POST /api/analytics/batch
→ Body: { product_ids: [1,2,3], analysis_types: [...] }
→ Returns: [{ analysis_results }]
```

## Styling

### CSS Framework
- **Colors:** Green (#2ecc71) for success, Blue (#3498db) for info, Red (#e74c3c) for danger
- **Layout:** CSS Grid for responsive design
- **Typography:** System fonts for performance
- **Components:** Cards, buttons, forms, alerts

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px - 1200px
- Mobile: < 768px

### Key Styles
- `.card` - Main content container
- `.btn` - Button styling
- `.alert` - Alert messages
- `.freshness-indicator` - Freshness display
- `.product-card` - Product listing
- `.grid` - Responsive grid

## Web3 Integration (Week 4 Enhancement)

### MetaMask Connection
```javascript
// Connect wallet
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts'
})

// Get account
const account = accounts[0]

// Listen to account changes
window.ethereum.on('accountsChanged', (accounts) => {
  setAccount(accounts[0])
})
```

### Smart Contract Interaction (Planned)
```javascript
// Call ProductRegistry contract
const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
)

// Register product
await contract.registerProduct(
  productName,
  farmerName,
  location,
  harvestTimestamp
)
```

## Testing

### Manual Testing Checklist
- [ ] All pages load without errors
- [ ] API calls return data correctly
- [ ] Error handling works (no product found, etc.)
- [ ] Freshness indicators display correctly
- [ ] Forms submit data properly
- [ ] Mobile responsive on small screens
- [ ] MetaMask wallet connects

### Example Test
```bash
# Start all services
Terminal 1: mongod
Terminal 2: cd backend && npm run dev
Terminal 3: cd backend/analytics && python app.py
Terminal 4: cd frontend && npm run dev

# Visit http://localhost:5173
# Search for product ID 1
# Should display product data + freshness
```

## Performance Optimization

### Current
- Component-based routing
- Local state management
- Direct API calls

### Future Optimizations
- React Context for global state
- Caching with localStorage
- Image lazy loading
- Code splitting per page
- Service worker for offline

## Known Limitations

⚠️ **Current Prototype Status:**
- Mock blockchain interactions (will use Web3.js in production)
- No payment integration
- No real-time WebSocket updates
- Simplified error handling
- No advanced UI animations

## Future Enhancements

### Phase 2 (Post-Week 4)
- [ ] Real-time alerts via WebSocket
- [ ] Advanced chart visualizations
- [ ] PDF report generation
- [ ] QR code scanner for mobile
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app (React Native)

### Phase 3 (Post-Deployment)
- [ ] AI-powered recommendations
- [ ] Blockchain integration (Web3.js)
- [ ] Payment gateway (Stripe)
- [ ] Advanced analytics with Plotly
- [ ] Two-factor authentication
- [ ] Social features (ratings, reviews)

## Troubleshooting

### "Cannot find module 'react'"
```bash
npm install
```

### API calls failing
- Check backend is running: `curl http://localhost:3001/health`
- Check analytics is running: `curl http://localhost:5000/health`
- Check CORS in vite.config.js

### Port 5173 already in use
```bash
netstat -ano | findstr :5173
taskkill /PID <number> /F
```

### Build fails
```bash
# Clear cache
rm -r node_modules
npm install
npm run build
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages
```bash
# In vite.config.js, set base: '/farm2user/'
npm run build
# Push dist/ to gh-pages branch
```

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Web3.js Documentation](https://web3js.readthedocs.io)
- [Axios Documentation](https://axios-http.com)

## License

MIT

---

**Status:** ✅ Week 4 Frontend - Initial Implementation Complete  
**Next:** Smart contract Web3 integration, real-time alerts, advanced visualizations
