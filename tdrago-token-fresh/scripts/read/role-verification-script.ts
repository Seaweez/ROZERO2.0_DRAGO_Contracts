import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function verifyRoles() {
  // Proxy address from environment
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS not set in .env");
  }

  // Connect to the contract
  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  // Get role constants
  const roles = {
    DEFAULT_ADMIN_ROLE: await tdrago.DEFAULT_ADMIN_ROLE(),
    MINTER_ROLE: await tdrago.MINTER_ROLE(),
    BURNER_ROLE: await tdrago.BURNER_ROLE(),
    WITHDRAWER_ROLE: await tdrago.WITHDRAWER_ROLE(),
    UPGRADER_ROLE: await tdrago.UPGRADER_ROLE(),
    PAUSER_ROLE: await tdrago.PAUSER_ROLE()
  };

  // Addresses to check
  const addressesToCheck = {
    "Admin": process.env.ADMIN_ADDRESS,
    "Minter": process.env.MINTER_ADDRESS,
    "Burner": process.env.BURNER_ADDRESS,
    "Withdrawer": process.env.WITHDRAWER_ADDRESS,
    "Upgrader": process.env.UPGRADER_ADDRESS
  };

  console.log("🔍 Role Verification Report:");
  console.log("-----------------------------");

  // Check each address for roles
  for (const [roleName, address] of Object.entries(addressesToCheck)) {
    if (!address) {
      console.log(`❓ ${roleName} Address: NOT SET`);
      continue;
    }

    console.log(`\n🏷 Checking roles for ${roleName} (${address}):`);
    
    // Check specific roles
    const roleChecks = [
      { role: 'DEFAULT_ADMIN_ROLE', method: 'DEFAULT_ADMIN_ROLE' },
      { role: 'MINTER_ROLE', method: 'MINTER_ROLE' },
      { role: 'BURNER_ROLE', method: 'BURNER_ROLE' },
      { role: 'WITHDRAWER_ROLE', method: 'WITHDRAWER_ROLE' },
      { role: 'UPGRADER_ROLE', method: 'UPGRADER_ROLE' },
      { role: 'PAUSER_ROLE', method: 'PAUSER_ROLE' }
    ];

    for (const check of roleChecks) {
      const hasRole = await tdrago.hasRole(roles[check.method], address);
      console.log(`  • ${check.role}: ${hasRole ? '✅ GRANTED' : '❌ NOT GRANTED'}`);
    }
  }

  // Additional contract-level checks
  console.log("\n🔒 Additional Contract Details:");
  console.log(`Treasury Address: ${await tdrago.treasury()}`);
  console.log(`Daily Withdrawal Limit: ${ethers.formatEther(await tdrago.dailyWithdrawalLimit())} TDRAGO`);
  console.log(`Max Withdrawal Amount: ${ethers.formatEther(await tdrago.maxWithdrawalAmount())} TDRAGO`);
}

verifyRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });