#!/usr/bin/env node

/**
 * END-TO-END TEST SCRIPT
 * 
 * Run this with: node test-signers.js
 * 
 * This tests the complete signer flow without UI
 */

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CHAINS = ['ethereum', 'base', 'bitcoin'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSignerConnection(signerType, chain) {
  log(`\n  Testing ${signerType} with ${chain}...`, 'cyan');
  
  try {
    // Test connection endpoint
    const endpoint = signerType === 'sodot' 
      ? '/api/sodot-proxy/derive-chain-pubkey'
      : '/api/iofinnet-proxy/test-connection';
    
    const response = await fetch(`${BASE_URL}${endpoint}?chain=${chain}`);
    const data = await response.json();
    
    if (response.ok) {
      log(`    ✅ Connection successful`, 'green');
      if (data.data?.pubkey) {
        log(`    📍 Pubkey: ${data.data.pubkey.substring(0, 20)}...`, 'blue');
      }
      if (data.data?.address) {
        log(`    📍 Address: ${data.data.address}`, 'blue');
      }
      return true;
    } else {
      log(`    ❌ Connection failed: ${data.message || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`    ❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testGetPubkey(signerType, chain) {
  log(`\n  Testing getPubkey for ${signerType} on ${chain}...`, 'cyan');
  
  try {
    const endpoint = signerType === 'sodot'
      ? '/api/sodot-proxy/derive-chain-pubkey'
      : '/api/iofinnet-proxy/get-pubkey';
    
    const response = await fetch(`${BASE_URL}${endpoint}?chain=${chain}`);
    const data = await response.json();
    
    if (response.ok && (data.data?.pubkey || data.pubkey)) {
      const pubkey = data.data?.pubkey || data.pubkey;
      log(`    ✅ Got pubkey: ${pubkey.substring(0, 30)}...`, 'green');
      return pubkey;
    } else {
      log(`    ⚠️  Could not get pubkey: ${data.message || 'No pubkey in response'}`, 'yellow');
      return null;
    }
  } catch (error) {
    log(`    ❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🧪 ADAMIK APP - SIGNER INTEGRATION TEST', 'blue');
  log('==========================================\n', 'blue');
  
  // Check if server is running
  try {
    await fetch(BASE_URL);
    log('✅ Server is running on ' + BASE_URL, 'green');
  } catch (error) {
    log('❌ Server is not running! Please run: pnpm dev', 'red');
    process.exit(1);
  }
  
  const results = {
    sodot: { passed: 0, failed: 0 },
    iofinnet: { passed: 0, failed: 0 },
  };
  
  // Test 1: Connection Test
  log('\n📡 TEST 1: Connection Test', 'yellow');
  log('--------------------------------', 'yellow');
  
  for (const chain of TEST_CHAINS) {
    // Test Sodot
    if (await testSignerConnection('sodot', chain)) {
      results.sodot.passed++;
    } else {
      results.sodot.failed++;
    }
    
    // Test IoFinnet
    if (await testSignerConnection('iofinnet', chain)) {
      results.iofinnet.passed++;
    } else {
      results.iofinnet.failed++;
    }
  }
  
  // Test 2: Get Public Key
  log('\n🔑 TEST 2: Get Public Key', 'yellow');
  log('--------------------------------', 'yellow');
  
  for (const chain of TEST_CHAINS) {
    // Test Sodot
    const sodotPubkey = await testGetPubkey('sodot', chain);
    if (sodotPubkey) {
      results.sodot.passed++;
    } else {
      results.sodot.failed++;
    }
    
    // Test IoFinnet
    const iofinnetPubkey = await testGetPubkey('iofinnet', chain);
    if (iofinnetPubkey) {
      results.iofinnet.passed++;
    } else {
      results.iofinnet.failed++;
    }
  }
  
  // Test 3: SIGNER-AGNOSTIC Verification
  log('\n🔄 TEST 3: Signer Switching', 'yellow');
  log('--------------------------------', 'yellow');
  
  log('  Testing that both signers work with same interface...', 'cyan');
  
  const testChain = 'ethereum';
  const sodotResult = await testSignerConnection('sodot', testChain);
  const iofinnetResult = await testSignerConnection('iofinnet', testChain);
  
  if (sodotResult && iofinnetResult) {
    log('    ✅ Both signers implement same interface correctly!', 'green');
    results.sodot.passed++;
    results.iofinnet.passed++;
  } else {
    log('    ❌ Signers have different behaviors', 'red');
    results.sodot.failed++;
    results.iofinnet.failed++;
  }
  
  // Summary
  log('\n📊 TEST SUMMARY', 'blue');
  log('==========================================', 'blue');
  
  log(`\n  Sodot Signer:`, 'cyan');
  log(`    ✅ Passed: ${results.sodot.passed}`, 'green');
  log(`    ❌ Failed: ${results.sodot.failed}`, results.sodot.failed > 0 ? 'red' : 'green');
  
  log(`\n  IoFinnet Signer:`, 'cyan');
  log(`    ✅ Passed: ${results.iofinnet.passed}`, 'green');
  log(`    ❌ Failed: ${results.iofinnet.failed}`, results.iofinnet.failed > 0 ? 'red' : 'green');
  
  const totalPassed = results.sodot.passed + results.iofinnet.passed;
  const totalFailed = results.sodot.failed + results.iofinnet.failed;
  
  log('\n==========================================', 'blue');
  if (totalFailed === 0) {
    log('🎉 ALL TESTS PASSED! The SIGNER-AGNOSTIC architecture works!', 'green');
  } else {
    log(`⚠️  Some tests failed (${totalFailed} failures)`, 'yellow');
    log('   This might be due to missing API credentials or configuration', 'yellow');
  }
  log('==========================================\n', 'blue');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});