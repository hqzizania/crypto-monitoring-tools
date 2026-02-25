# Crypto Monitoring Tools

Automated cryptocurrency monitoring tools powered by AI, including BTC price analysis and Twitter meme token hunting.

## 🚀 Features

### 1. BTC Market Monitor
- Real-time BTC price tracking from Binance
- Multi-timeframe technical analysis (5m, 15m, 1h, 4h)
- RSI and MA indicators
- Twitter sentiment analysis
- Macro economic news integration
- Hourly automated reports

### 2. Meme Token Hunter
- Twitter trending meme coin detection
- Multi-timeframe monitoring (1h, 24h, 7d)
- Contract address (CA) verification
- KOL activity tracking
- Risk assessment
- 10-minute scan interval

## 📊 Tech Stack

- Node.js
- Axios (HTTP client)
- Binance API
- Web Search API
- OpenClaw automation platform

## 🔧 Setup

```bash
# Install dependencies for BTC Monitor
cd btc-monitor
npm install

# Install dependencies for Meme Token Hunter
cd meme-token-hunter
npm install
```

## 🎯 Usage

### BTC Monitor
```bash
cd btc-monitor
node monitor.js    # One-time analysis
node analyzer.js   # Full AI analysis with web search
```

### Meme Token Hunter  
```bash
cd meme-token-hunter
node hunter.js
```

## ⚙️ Configuration

Both tools use `config.json` files for settings. Copy the example configs and customize:

```bash
cp btc-monitor/config.example.json btc-monitor/config.json
cp meme-token-hunter/config.example.json meme-token-hunter/config.json
```

## 🤖 Automation

These tools are designed to run as cron jobs on OpenClaw:
- BTC Monitor: Every 1 hour
- Meme Token Hunter: Every 10 minutes

## ⚠️ Disclaimer

These tools are for informational purposes only. Cryptocurrency trading involves substantial risk. Always do your own research (DYOR) before making investment decisions.

## 📝 License

MIT

## 👤 Author

Qian Huang (hqzizania)
