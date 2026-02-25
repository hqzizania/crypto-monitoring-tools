#!/usr/bin/env node
/**
 * BTC AI Analyzer
 * Comprehensive BTC analysis with web search integration
 */

const BTCMonitor = require('./monitor.js');

class AIAnalyzer {
  constructor() {
    this.monitor = new BTCMonitor();
  }

  async analyze() {
    console.log('🤖 Starting comprehensive BTC analysis...\n');
    
    await this.monitor.init();
    const marketData = await this.monitor.run();
    
    if (!marketData) {
      console.error('Failed to fetch market data');
      return null;
    }
    
    const analysisPrompt = this.generateAnalysisPrompt(marketData);
    
    console.log('\n--- ANALYSIS_PROMPT ---');
    console.log(analysisPrompt);
    console.log('--- END_PROMPT ---');
    
    console.log('\n💡 To complete the analysis:');
    console.log('1. Search for latest crypto market news');
    console.log('2. Search for macro economic updates (Fed, inflation, rates)');
    console.log('3. Combine technical + sentiment + macro analysis');
    console.log('4. Provide short-term (1-24h) and medium-term (1-7d) outlook\n');
    
    return {
      marketData,
      analysisPrompt
    };
  }

  generateAnalysisPrompt(data) {
    const { priceData, klineAnalysis } = data;
    
    let prompt = `Bitcoin Market Comprehensive Analysis:\n\n`;
    prompt += `**Current Market Data**:\n`;
    prompt += `- Price: $${priceData.price.toLocaleString()}\n`;
    prompt += `- 24h Change: ${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%\n`;
    prompt += `- 24h Volume: ${(priceData.volume24h / 1000).toFixed(2)}K BTC\n\n`;
    
    prompt += `**Technical Indicators**:\n`;
    for (const [tf, analysis] of Object.entries(klineAnalysis)) {
      prompt += `- ${tf}: ${analysis.trend} (strength ${analysis.strength}%, RSI ${analysis.rsi})\n`;
    }
    prompt += `\n`;
    
    prompt += `**Analysis Tasks**:\n`;
    prompt += `1. Search latest crypto market news and Twitter sentiment\n`;
    prompt += `2. Search macro economic news (Federal Reserve, inflation, interest rates)\n`;
    prompt += `3. Analyze: technical + sentiment + macro factors\n`;
    prompt += `4. Provide outlook: short-term (1-24h) and medium-term (1-7d)\n`;
    prompt += `5. Trading suggestions (for reference only)\n\n`;
    prompt += `Please respond in concise format with emoji.`;
    
    return prompt;
  }
}

async function main() {
  const analyzer = new AIAnalyzer();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AIAnalyzer;
