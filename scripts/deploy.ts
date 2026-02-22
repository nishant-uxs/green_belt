#!/usr/bin/env node

/**
 * Deployment script for Green Belt contracts
 * 
 * This script deploys:
 * 1. Token contract
 * 2. Links it to crowdfund contract
 * 3. Initializes token with initial supply
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = 'testnet';
const TOKEN_NAME = 'Stellar Token';
const TOKEN_SYMBOL = 'STR';
const INITIAL_SUPPLY = '1000000000000'; // 1 million tokens with 7 decimals

console.log('🚀 Deploying Green Belt Contracts...\n');

// Step 1: Build contracts
console.log('📦 Building contracts...');
try {
  execSync('cargo build --target wasm32-unknown-unknown --release', { 
    cwd: 'contracts/crowdfund',
    stdio: 'inherit'
  });
  
  execSync('cargo build --target wasm32-unknown-unknown --release', { 
    cwd: 'contracts/token',
    stdio: 'inherit'
  });
  console.log('✅ Contracts built successfully\n');
} catch (error: any) {
  console.error('❌ Failed to build contracts:', error.message);
  process.exit(1);
}

// Step 2: Deploy token contract
console.log('🪙 Deploying token contract...');
let tokenContractId;
try {
  const result = execSync(
    `soroban contract deploy --wasm contracts/token/target/wasm32-unknown-unknown/release/token.wasm --network ${NETWORK}`,
    { encoding: 'utf8' }
  );
  tokenContractId = result.trim();
  console.log(`✅ Token contract deployed: ${tokenContractId}\n`);
} catch (error: any) {
  console.error('❌ Failed to deploy token contract:', error.message);
  process.exit(1);
}

// Step 3: Initialize token contract
console.log('⚙️ Initializing token contract...');
try {
  execSync(
    `soroban contract invoke --id ${tokenContractId} --network ${NETWORK} -- initialize --admin $(soroban config identity address) --name "${TOKEN_NAME}" --symbol "${TOKEN_SYMBOL}" --initial_supply ${INITIAL_SUPPLY}`,
    { stdio: 'inherit' }
  );
  console.log('✅ Token contract initialized\n');
} catch (error) {
  console.error('❌ Failed to initialize token contract:', error.message);
  process.exit(1);
}

// Step 4: Update crowdfund contract with token address
console.log('🔗 Linking token contract to crowdfund...');
const CROWDFUND_CONTRACT_ID = 'CCEWBXDQJ2YHQ6NVRQW3OLAJ6MGH2FSDSEQW6L4GSEUPZQRLIFK3UW3F';
try {
  execSync(
    `soroban contract invoke --id ${CROWDFUND_CONTRACT_ID} --network ${NETWORK} -- set_token_contract --token_address ${tokenContractId}`,
    { stdio: 'inherit' }
  );
  console.log('✅ Token contract linked to crowdfund\n');
} catch (error) {
  console.error('❌ Failed to link token contract:', error.message);
  process.exit(1);
}

// Step 5: Update constants file
console.log('📝 Updating constants file...');
const constantsPath = 'src/lib/constants.ts';
let constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Add token contract ID
let newConstants = constantsContent.replace(
  /export const CONTRACT_ID = .+;/,
  `export const CONTRACT_ID = '${CROWDFUND_CONTRACT_ID}';`
).replace(
  /export const TOKEN_CONTRACT_ID = .+;/,
  `export const TOKEN_CONTRACT_ID = '${tokenContractId}';`
);

// If TOKEN_CONTRACT_ID doesn't exist, add it
if (!newConstants.includes('TOKEN_CONTRACT_ID')) {
  const lines = newConstants.split('\n');
  const contractIdIndex = lines.findIndex((line: string) => line.includes('CONTRACT_ID'));
  if (contractIdIndex !== -1) {
    lines.splice(contractIdIndex + 1, 0, `export const TOKEN_CONTRACT_ID = '${tokenContractId}';`);
    newConstants = lines.join('\n');
  }
}

fs.writeFileSync(constantsPath, newConstants);
console.log('✅ Constants updated\n');

// Step 6: Create deployment summary
console.log('📋 Deployment Summary:');
console.log('========================');
console.log(`🌐 Network: ${NETWORK}`);
console.log(`🪙 Token Contract: ${tokenContractId}`);
console.log(`🏗️ Crowdfund Contract: ${CROWDFUND_CONTRACT_ID}`);
console.log(`📊 Token Name: ${TOKEN_NAME}`);
console.log(`🔤 Token Symbol: ${TOKEN_SYMBOL}`);
console.log(`💰 Initial Supply: ${INITIAL_SUPPLY}`);
console.log('\n✅ Green Belt deployment completed successfully!');
console.log('\n🎯 Next steps:');
console.log('1. Test token donations in the dApp');
console.log('2. Verify inter-contract calls are working');
console.log('3. Update README with token contract address');
console.log('4. Push changes to GitHub');
