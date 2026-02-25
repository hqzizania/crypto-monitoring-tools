#!/usr/bin/env node
/**
 * Meme Token Hunter
 * Twitter-based hot meme token detector
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const SEEN_TOKENS_PATH = path.join(DATA_DIR, 'seen-tokens.json');

class MemeTokenHunter {
  constructor() {
    this.config = null;
    this.seenTokens = new Map();
  }

  async init() {
    // Load config
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.log('⚠️  Config not found, using defaults');
      this.config = {
        check_interval_minutes: 10,
        min_mentions_per_hour: 50,
        chains: ['SOL', 'ETH', 'BASE', 'BSC'],
        search_keywords: [
          'meme coin mooning right now CA',
          'just launched contract address',
          '100x potential meme'
        ],
        influencer_accounts: ['@ansem', '@blknoiz06', '@Flowslikeosmo'],
        alert_cooldown_hours: 24
      };
    }
    
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Load seen tokens
    try {
      const seenData = await fs.readFile(SEEN_TOKENS_PATH, 'utf8');
      const parsed = JSON.parse(seenData);
      this.seenTokens = new Map(Object.entries(parsed));
      
      // Clean up old entries
      const now = Date.now();
      const cooldownMs = this.config.alert_cooldown_hours * 60 * 60 * 1000;
      
      for (const [key, timestamp] of this.seenTokens.entries()) {
        if (now - timestamp > cooldownMs) {
          this.seenTokens.delete(key);
        }
      }
    } catch (error) {
      this.seenTokens = new Map();
    }
    
    console.log('🔍 Meme Token Hunter initialized');
    console.log(`📊 Tracking ${this.seenTokens.size} tokens (cooldown active)`);
  }

  async saveSeenTokens() {
    const obj = Object.fromEntries(this.seenTokens);
    await fs.writeFile(SEEN_TOKENS_PATH, JSON.stringify(obj, null, 2));
  }

  extractContractAddress(text) {
    // Common patterns for contract addresses
    const patterns = [
      // Ethereum/BSC/Base (0x...)
      /\b0x[a-fA-F0-9]{40}\b/g,
      // Solana (base58, typically 32-44 chars)
      /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g
    ];
    
    const matches = new Set();
    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) {
        found.forEach(m => matches.add(m));
      }
    }
    
    return Array.from(matches);
  }

  detectChain(text, ca) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('solana') || lowerText.includes('sol') || ca.length > 40) {
      return 'SOL';
    }
    if (lowerText.includes('base')) {
      return 'BASE';
    }
    if (lowerText.includes('bsc') || lowerText.includes('binance smart chain')) {
      return 'BSC';
    }
    if (lowerText.includes('ethereum') || lowerText.includes('eth') || ca.startsWith('0x')) {
      return 'ETH';
    }
    
    return 'UNKNOWN';
  }

  assessRisk(text) {
    const lowerText = text.toLowerCase();
    let riskScore = 0;
    
    const highRiskKeywords = ['rug pull', 'scam', 'honeypot', 'beware', 'warning', 'avoid'];
    const positiveKeywords = ['audit', 'safe', 'verified', 'legit', 'solid team', 'LP locked'];
    
    for (const keyword of highRiskKeywords) {
      if (lowerText.includes(keyword)) riskScore += 2;
    }
    
    for (const keyword of positiveKeywords) {
      if (lowerText.includes(keyword)) riskScore -= 1;
    }
    
    if (riskScore >= 4) return 'CRITICAL';
    if (riskScore >= 2) return 'HIGH';
    if (riskScore >= 0) return 'MEDIUM';
    return 'LOW';
  }

  generateSearchPrompt() {
    const now = new Date();
    const timeStr = now.toISOString();
    
    let prompt = `🔍 **Meme Token Hunt** - ${timeStr}\n\n`;
    prompt += `Execute Twitter hot meme coin monitoring:\n\n`;
    
    prompt += `**1. Search the following keyword combinations** (use web_search, freshness: past 1-24 hours):\n`;
    this.config.search_keywords.forEach((kw, idx) => {
      prompt += `   ${idx + 1}. "${kw}"\n`;
    });
    
    prompt += `\n**2. Focus on these KOL accounts**:\n`;
    this.config.influencer_accounts.forEach(acc => {
      prompt += `   • ${acc}\n`;
    });
    
    prompt += `\n**3. Extract information**:\n`;
    prompt += `   For each token that suddenly went viral on Twitter (mentions >50x/hour):\n`;
    prompt += `   - Token name and ticker symbol\n`;
    prompt += `   - Contract address (CA)\n`;
    prompt += `   - Blockchain (Solana/Ethereum/Base/BSC)\n`;
    prompt += `   - Why it's trending (summarize tweets)\n`;
    prompt += `   - Estimated mention count\n`;
    prompt += `   - Whether key KOLs are involved\n`;
    prompt += `   - Risk warning (any rug pull alerts)\n`;
    prompt += `   - Original tweet links (at least 2-3)\n\n`;
    
    prompt += `**4. Filtering criteria**:\n`;
    prompt += `   ✅ Only report **newly appeared** or **suddenly viral** tokens\n`;
    prompt += `   ✅ Must have clear contract address (CA)\n`;
    prompt += `   ✅ Exclude old projects (BTC/ETH/SOL etc.)\n`;
    prompt += `   ⚠️ Mark risk level (LOW/MEDIUM/HIGH/CRITICAL)\n\n`;
    
    prompt += `**5. Output format** (in English or Chinese):\n`;
    prompt += `If hot token found:\n\n`;
    prompt += `🔥 **Hot Meme Coin Detected!**\n\n`;
    prompt += `💎 **Token**: [Name] ($TICKER)\n`;
    prompt += `🔗 **CA**: \`[Contract Address]\`\n`;
    prompt += `⛓️ **Chain**: [Solana/Ethereum/Base/BSC]\n\n`;
    prompt += `🔥 **Why trending**:\n`;
    prompt += `[Summarize in 2-3 sentences]\n\n`;
    prompt += `📊 **Data**:\n`;
    prompt += `• Mentions: ~[number] tweets/hour\n`;
    prompt += `• KOL involved: [Yes/No]\n`;
    prompt += `• Risk level: [LOW/MEDIUM/HIGH/CRITICAL]\n\n`;
    prompt += `🐦 **Sources**:\n`;
    prompt += `• [Tweet link 1]\n`;
    prompt += `• [Tweet link 2]\n\n`;
    prompt += `⏰ Detected: ${timeStr}\n\n`;
    prompt += `---\n\n`;
    prompt += `If **no** qualified hot token found, reply:\n`;
    prompt += `"No new hot meme coins detected in this scan."\n\n`;
    
    prompt += `**Important**: Only report truly **suddenly viral** new coins, not stable old projects.`;
    
    return prompt;
  }

  async hunt() {
    console.log(`\n🎯 ${new Date().toLocaleString()} - Hunting for hot meme tokens...\n`);
    
    const searchPrompt = this.generateSearchPrompt();
    
    console.log('--- SEARCH_PROMPT ---');
    console.log(searchPrompt);
    console.log('--- END_PROMPT ---');
    
    console.log('\n💡 To complete the hunt:');
    console.log('1. Execute web searches with the provided keywords');
    console.log('2. Track KOL activity');
    console.log('3. Extract token info (name, CA, chain, trend reason)');
    console.log('4. Assess risk level');
    console.log('5. Report findings with sources\n');
    
    return {
      searchPrompt,
      timestamp: Date.now()
    };
  }

  async markAsSeen(ca, chain) {
    const key = `${ca}_${chain}`;
    this.seenTokens.set(key, Date.now());
    await this.saveSeenTokens();
  }
}

async function main() {
  const hunter = new MemeTokenHunter();
  await hunter.init();
  await hunter.hunt();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MemeTokenHunter;
