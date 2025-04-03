import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function diagnosRoles() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS not set in .env");
  }

  // Get contract instance
  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  // Get current signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log("🔍 Role Diagnostic Report");
  console.log("-------------------------");
  console.log(`Contract Address: ${proxyAddress}`);
  console.log(`Current Signer: ${signerAddress}`);

  // Role constants
  const roles = {
    DEFAULT_ADMIN_ROLE: await tdrago.DEFAULT_ADMIN_ROLE(),
    MINTER_ROLE: await tdrago.MINTER_ROLE(),
    BURNER_ROLE: await tdrago.BURNER_ROLE(),
    WITHDRAWER_ROLE: await tdrago.WITHDRAWER_ROLE(),
    UPGRADER_ROLE: await tdrago.UPGRADER_ROLE(),
    PAUSER_ROLE: await tdrago.PAUSER_ROLE()
  };

  // Addresses to check
  const addressesToCheck = [
    { name: "Signer", address: signerAddress },
    { name: "Admin", address: process.env.ADMIN_ADDRESS },
    { name: "Minter", address: process.env.MINTER_ADDRESS },
    { name: "Burner", address: process.env.BURNER_ADDRESS },
    { name: "Withdrawer", address: process.env.WITHDRAWER_ADDRESS },
    { name: "Upgrader", address: process.env.UPGRADER_ADDRESS }
  ];

  // Check roles for each address
  for (const { name, address } of addressesToCheck) {
    if (!address) {
      console.log(`❓ ${name} Address: NOT SET`);
      continue;
    }

    console.log(`\n🏷 Checking roles for ${name} (${address}):`);
    
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

  // Additional diagnostic information
  console.log("\n🔒 Additional Contract Details:");
  console.log(`Treasury Address: ${await tdrago.treasury()}`);
  console.log(`Daily Withdrawal Limit: ${ethers.formatEther(await tdrago.dailyWithdrawalLimit())} TDRAGO`);
  console.log(`Max Withdrawal Amount: ${ethers.formatEther(await tdrago.maxWithdrawalAmount())} TDRAGO`);
}

diagnosRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Diagnostic failed:", error);
    process.exit(1);
  });