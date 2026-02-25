#!/usr/bin/env node
/**
 * BTC Market Monitor
 * Real-time Bitcoin price monitoring with technical analysis
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');

class BTCMonitor {
  constructor() {
    this.config = null;
  }

  async init() {
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.log('⚠️  Config file not found, using defaults');
      this.config = {
        binance_api: 'https://api.binance.com',
        kline_timeframes: ['5m', '15m', '1h', '4h'],
        price_alerts: {
          sharp_change_percent: 2,
          volume_spike_multiplier: 3
        }
      };
    }
    
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('🚀 BTC Monitor initialized');
  }

  async fetchBTCPrice() {
    try {
      const response = await axios.get(`${this.config.binance_api}/api/v3/ticker/24hr`, {
        params: { symbol: 'BTCUSDT' }
      });
      
      return {
        price: parseFloat(response.data.lastPrice),
        change24h: parseFloat(response.data.priceChangePercent),
        volume24h: parseFloat(response.data.volume),
        high24h: parseFloat(response.data.highPrice),
        low24h: parseFloat(response.data.lowPrice),
        trades: parseInt(response.data.count)
      };
    } catch (error) {
      console.error('Error fetching BTC price:', error.message);
      return null;
    }
  }

  async fetchKlineData(interval = '5m', limit = 100) {
    try {
      const response = await axios.get(`${this.config.binance_api}/api/v3/klines`, {
        params: {
          symbol: 'BTCUSDT',
          interval: interval,
          limit: limit
        }
      });
      
      return response.data.map(k => ({
        timestamp: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (error) {
      console.error(`Error fetching ${interval} K-line:`, error.message);
      return [];
    }
  }

  analyzeKline(klines) {
    if (!klines || klines.length < 3) {
      return { trend: 'unknown', strength: 0, rsi: 50 };
    }
    
    const recent = klines.slice(-10);
    const current = recent[recent.length - 1];
    
    // Calculate moving averages
    const ma5 = recent.slice(-5).reduce((sum, k) => sum + k.close, 0) / 5;
    const ma10 = recent.reduce((sum, k) => sum + k.close, 0) / 10;
    
    // Determine trend
    let trend = 'sideways';
    let strength = 0;
    
    const priceChange = ((current.close - recent[0].close) / recent[0].close) * 100;
    
    if (ma5 > ma10 && current.close > ma5) {
      trend = 'bullish';
      strength = Math.min(Math.abs(priceChange), 100);
    } else if (ma5 < ma10 && current.close < ma5) {
      trend = 'bearish';
      strength = Math.min(Math.abs(priceChange), 100);
    }
    
    // Volume analysis
    const avgVolume = recent.slice(0, -1).reduce((sum, k) => sum + k.volume, 0) / (recent.length - 1);
    const volumeSpike = current.volume > avgVolume * this.config.price_alerts.volume_spike_multiplier;
    
    // RSI calculation
    const rsi = this.calculateRSI(klines.slice(-15));
    
    return {
      trend,
      strength: Math.round(strength * 10) / 10,
      ma5: Math.round(ma5 * 100) / 100,
      ma10: Math.round(ma10 * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      volumeSpike,
      currentVolume: Math.round(current.volume),
      avgVolume: Math.round(avgVolume),
      rsi: rsi
    };
  }

  calculateRSI(klines, period = 14) {
    if (klines.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period + 1; i++) {
      const change = klines[i].close - klines[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return Math.round(rsi * 10) / 10;
  }

  generateReport(priceData, klineAnalysis) {
    const trendEmoji = {
      'bullish': '📈',
      'bearish': '📉',
      'sideways': '↔️',
      'unknown': '❓'
    };
    
    let report = `🪙 **BTC Market Report** (${new Date().toLocaleString()})\n\n`;
    report += `💰 **Current Price**: $${priceData.price.toLocaleString()}\n`;
    report += `📊 **24h Change**: ${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%\n`;
    report += `📈 **24h High**: $${priceData.high24h.toLocaleString()}\n`;
    report += `📉 **24h Low**: $${priceData.low24h.toLocaleString()}\n`;
    report += `💹 **24h Volume**: ${(priceData.volume24h / 1000).toFixed(2)}K BTC\n\n`;
    
    report += `🔍 **Technical Analysis**\n`;
    
    const timeframeNames = {
      '5m': '5-min',
      '15m': '15-min',
      '1h': '1-hour',
      '4h': '4-hour'
    };
    
    for (const [timeframe, analysis] of Object.entries(klineAnalysis)) {
      const emoji = trendEmoji[analysis.trend];
      const name = timeframeNames[timeframe] || timeframe;
      report += `\n${name}: ${emoji} **${analysis.trend.toUpperCase()}**\n`;
      report += `  • Strength: ${analysis.strength}%\n`;
      report += `  • RSI: ${analysis.rsi} ${analysis.rsi > 70 ? '(Overbought⚠️)' : analysis.rsi < 30 ? '(Oversold⚠️)' : '(Neutral)'}\n`;
      report += `  • MA5: $${analysis.ma5.toLocaleString()} | MA10: $${analysis.ma10.toLocaleString()}\n`;
      if (analysis.volumeSpike) {
        report += `  • 🔥 Volume spike! (${(analysis.currentVolume / analysis.avgVolume).toFixed(1)}x average)\n`;
      }
    }
    
    report += `\n📊 **Market Signals**\n`;
    const signals = this.generateMarketSignals(priceData, klineAnalysis);
    signals.forEach(signal => {
      report += `${signal}\n`;
    });
    
    return report;
  }

  generateMarketSignals(priceData, klineAnalysis) {
    const signals = [];
    
    const trends = Object.values(klineAnalysis).map(a => a.trend);
    const bullishCount = trends.filter(t => t === 'bullish').length;
    const bearishCount = trends.filter(t => t === 'bearish').length;
    
    if (bullishCount >= 3) {
      signals.push('✅ Multi-timeframe bullish signal');
    } else if (bearishCount >= 3) {
      signals.push('⚠️ Multi-timeframe bearish signal');
    } else {
      signals.push('⚖️ Mixed signals - suggest wait and see');
    }
    
    const rsiValues = Object.values(klineAnalysis).map(a => a.rsi);
    const avgRSI = rsiValues.reduce((sum, r) => sum + r, 0) / rsiValues.length;
    
    if (avgRSI > 70) {
      signals.push('🔴 RSI overbought - possible correction ahead');
    } else if (avgRSI < 30) {
      signals.push('🟢 RSI oversold - possible bounce opportunity');
    }
    
    if (Math.abs(priceData.change24h) > 5) {
      signals.push(`⚡ High volatility (${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%) - manage risk`);
    }
    
    const hasVolumeSpike = Object.values(klineAnalysis).some(a => a.volumeSpike);
    if (hasVolumeSpike) {
      signals.push('📢 Unusual volume detected - significant move possible');
    }
    
    return signals;
  }

  async run() {
    console.log(`\n⏰ ${new Date().toLocaleString()} - Running BTC monitor...\n`);
    
    const priceData = await this.fetchBTCPrice();
    if (!priceData) {
      console.error('Failed to fetch price data');
      return null;
    }
    
    const klineAnalysis = {};
    for (const timeframe of this.config.kline_timeframes) {
      const klines = await this.fetchKlineData(timeframe, 100);
      klineAnalysis[timeframe] = this.analyzeKline(klines);
    }
    
    const report = this.generateReport(priceData, klineAnalysis);
    console.log(report);
    
    // Save data
    const timestamp = Date.now();
    const dataFile = path.join(DATA_DIR, `${timestamp}.json`);
    await fs.writeFile(dataFile, JSON.stringify({
      timestamp,
      price: priceData,
      analysis: klineAnalysis
    }, null, 2));
    
    return { report, priceData, klineAnalysis };
  }
}

async function main() {
  const monitor = new BTCMonitor();
  await monitor.init();
  await monitor.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BTCMonitor;
