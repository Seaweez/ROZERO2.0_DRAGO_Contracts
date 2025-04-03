import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function setupRoles() {
  // Retrieve addresses from environment
  const proxyAddress = process.env.PROXY_ADDRESS;
  const adminAddress = process.env.ADMIN_ADDRESS;
  const minterAddress = process.env.MINTER_ADDRESS;
  const burnerAddress = process.env.BURNER_ADDRESS;
  const withdrawerAddress = process.env.WITHDRAWER_ADDRESS;
  const upgraderAddress = process.env.UPGRADER_ADDRESS;

  // Validate addresses
  const validateAddress = (label: string, address?: string) => {
    if (!address || !ethers.isAddress(address)) {
      throw new Error(`Invalid ${label}: ${address}`);
    }
  };

  validateAddress("PROXY_ADDRESS", proxyAddress);
  validateAddress("ADMIN_ADDRESS", adminAddress);
  validateAddress("MINTER_ADDRESS", minterAddress);
  validateAddress("BURNER_ADDRESS", burnerAddress);
  validateAddress("WITHDRAWER_ADDRESS", withdrawerAddress);
  validateAddress("UPGRADER_ADDRESS", upgraderAddress);

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

  // Role configuration with specific role assignments
  const roleAssignments = [
    { 
      role: roles.MINTER_ROLE, 
      addresses: [minterAddress, adminAddress],
      description: "Can mint new tokens"
    },
    { 
      role: roles.BURNER_ROLE, 
      addresses: [burnerAddress, adminAddress],
      description: "Can burn tokens"
    },
    { 
      role: roles.WITHDRAWER_ROLE, 
      addresses: [withdrawerAddress, adminAddress],
      description: "Can withdraw tokens"
    },
    { 
      role: roles.UPGRADER_ROLE, 
      addresses: [upgraderAddress, adminAddress],
      description: "Can upgrade the contract"
    },
    { 
      role: roles.PAUSER_ROLE, 
      addresses: [adminAddress],
      description: "Can pause/unpause the contract"
    }
  ];

  console.log("🚀 Starting Role Setup Process");
  console.log("------------------------------");

  // Perform role assignments
  for (const assignment of roleAssignments) {
    for (const address of assignment.addresses) {
      try {
        // Check if role is already assigned
        const hasRole = await tdrago.hasRole(assignment.role, address);
        
        if (!hasRole) {
          console.log(`Granting ${assignment.description} role to ${address}`);
          const tx = await tdrago.grantRole(assignment.role, address);
          await tx.wait();
          console.log(`✅ Role granted successfully`);
        } else {
          console.log(`${address} already has ${assignment.description} role`);
        }
      } catch (error) {
        console.error(`❌ Error granting role to ${address}:`, error);
      }
    }
  }

  console.log("\n🔒 Role Setup Complete");

  // Verify roles after setup
  console.log("\n🔍 Role Verification After Setup:");
  await verifyRoles(tdrago, roles);
}

async function verifyRoles(tdrago: any, roles: any) {
  const addressesToCheck = {
    "Admin": process.env.ADMIN_ADDRESS,
    "Minter": process.env.MINTER_ADDRESS,
    "Burner": process.env.BURNER_ADDRESS,
    "Withdrawer": process.env.WITHDRAWER_ADDRESS,
    "Upgrader": process.env.UPGRADER_ADDRESS
  };

  for (const [roleName, address] of Object.entries(addressesToCheck)) {
    if (!address) {
      console.log(`❓ ${roleName} Address: NOT SET`);
      continue;
    }

    console.log(`\n🏷 Checking roles for ${roleName} (${address}):`);
    
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
}

setupRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Role setup failed:", error);
    process.exit(1);
  });