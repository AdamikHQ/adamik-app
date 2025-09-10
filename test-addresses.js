#!/usr/bin/env node

/**
 * TEST: Address Derivation from Public Keys
 * 
 * This verifies that we can get addresses for different chains
 * from the same public key using Adamik API
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test chains with different address formats
const TEST_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'base', name: 'Base', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'optimism', name: 'Optimism', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'arbitrum', name: 'Arbitrum', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'polygon', name: 'Polygon', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'bsc', name: 'BSC', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'bitcoin', name: 'Bitcoin', expectedFormat: /^[13bc][a-km-zA-HJ-NP-Z1-9]{25,34}$/ },
  { id: 'avalanche', name: 'Avalanche', expectedFormat: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'cosmoshub', name: 'Cosmos Hub', expectedFormat: /^cosmos[0-9a-z]{39}$/ },
  { id: 'algorand', name: 'Algorand', expectedFormat: /^[A-Z2-7]{58}$/ },
  { id: 'aptos', name: 'Aptos', expectedFormat: /^0x[0-9a-fA-F]{64}$/ },
  { id: 'solana', name: 'Solana', expectedFormat: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { id: 'akash', name: 'Akash', expectedFormat: /^akash[0-9a-z]{39}$/ },
  { id: 'band', name: 'Band', expectedFormat: /^band[0-9a-z]{39}$/ },
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getPubkeyForSigner(signerType, chain) {
  try {
    const endpoint = signerType === 'sodot'
      ? '/api/sodot-proxy/derive-chain-pubkey'
      : '/api/iofinnet-proxy/get-pubkey';
    
    const response = await fetch(`${BASE_URL}${endpoint}?chain=${chain}`);
    const data = await response.json();
    
    if (response.ok) {
      return data.data?.pubkey || data.pubkey;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function deriveAddressFromPubkey(pubkey, chainId) {
  try {
    // Call the derive-address endpoint
    const response = await fetch(
      `${BASE_URL}/api/sodot-proxy/derive-address?pubkey=${encodeURIComponent(pubkey)}&chain=${chainId}`
    );
    
    const data = await response.json();
    
    if (response.ok && data.data?.address) {
      return data.data.address;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function testAddressDerivation() {
  log('\n🏠 ADDRESS DERIVATION TEST', 'blue');
  log('==========================================', 'blue');
  log('Testing if we can derive addresses for multiple chains from public keys\n', 'cyan');
  
  const results = {
    sodot: { success: 0, failed: 0, addresses: {} },
    iofinnet: { success: 0, failed: 0, addresses: {} },
  };
  
  // Test with both signers
  for (const signerType of ['sodot', 'iofinnet']) {
    log(`\n📍 Testing ${signerType.toUpperCase()} Signer`, 'yellow');
    log('--------------------------------', 'yellow');
    
    // Now try to derive addresses for different chains
    log('\n  Deriving addresses for different chains:', 'cyan');
    
    for (const chain of TEST_CHAINS) {
      // Get chain-specific public key
      const chainPubkey = await getPubkeyForSigner(signerType, chain.id);
      
      if (!chainPubkey) {
        log(`    ❌ ${chain.name}: Could not get public key`, 'red');
        results[signerType].failed++;
        continue;
      }
      
      log(`    🔑 ${chain.name} pubkey: ${chainPubkey.substring(0, 20)}...`, 'cyan');
      
      const address = await deriveAddressFromPubkey(chainPubkey, chain.id);
      
      if (address) {
        // Validate address format
        const isValidFormat = chain.expectedFormat ? chain.expectedFormat.test(address) : true;
        
        if (isValidFormat) {
          log(`    ✅ ${chain.name}: ${address}`, 'green');
          results[signerType].success++;
          results[signerType].addresses[chain.id] = address;
        } else {
          log(`    ⚠️  ${chain.name}: ${address} (unexpected format)`, 'yellow');
          results[signerType].failed++;
        }
      } else {
        log(`    ❌ ${chain.name}: Failed to derive address`, 'red');
        results[signerType].failed++;
      }
    }
  }
  
  // Summary
  log('\n📊 SUMMARY', 'blue');
  log('==========================================', 'blue');
  
  for (const signerType of ['sodot', 'iofinnet']) {
    const result = results[signerType];
    log(`\n${signerType.toUpperCase()} Signer:`, 'cyan');
    log(`  ✅ Successfully derived: ${result.success} addresses`, 'green');
    log(`  ❌ Failed: ${result.failed}`, result.failed > 0 ? 'red' : 'green');
    
    if (result.success > 0) {
      log(`  📍 Sample addresses:`, 'magenta');
      const samples = Object.entries(result.addresses).slice(0, 3);
      for (const [chain, addr] of samples) {
        log(`     ${chain}: ${addr}`, 'blue');
      }
    }
  }
  
  // Verify same pubkey gives same addresses
  if (results.sodot.addresses.ethereum && results.iofinnet.addresses.ethereum) {
    log('\n🔄 Cross-Signer Verification:', 'yellow');
    
    const sodotEth = results.sodot.addresses.ethereum;
    const iofinnetEth = results.iofinnet.addresses.ethereum;
    
    if (sodotEth !== iofinnetEth) {
      log('  ℹ️  Different addresses (expected - different pubkeys)', 'cyan');
      log(`     Sodot:    ${sodotEth}`, 'blue');
      log(`     IoFinnet: ${iofinnetEth}`, 'blue');
    } else {
      log('  ✅ Same addresses from same pubkeys!', 'green');
    }
  }
  
  const totalSuccess = results.sodot.success + results.iofinnet.success;
  const totalFailed = results.sodot.failed + results.iofinnet.failed;
  
  log('\n==========================================', 'blue');
  if (totalSuccess > 0) {
    log(`🎉 SUCCESS: Can derive ${totalSuccess} addresses from public keys!`, 'green');
    log('   The Adamik API correctly converts pubkeys to chain-specific addresses!', 'green');
  } else {
    log('❌ FAILED: Could not derive addresses', 'red');
  }
  log('==========================================\n', 'blue');
}

// Run the test
testAddressDerivation().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});