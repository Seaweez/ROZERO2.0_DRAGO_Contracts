import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function grantAdminRoles() {
  // Get contract address and addresses to work with
  const proxyAddress = process.env.PROXY_ADDRESS;
  const adminAddress = process.env.ADMIN_ADDRESS;
  const signerAddress = process.env.SIGNER_ADDRESS; // Add this to your .env

  if (!proxyAddress || !adminAddress) {
    throw new Error("Missing PROXY_ADDRESS or ADMIN_ADDRESS in .env");
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

  // Addresses to grant roles to
  const addressesToGrant = [adminAddress];
  
  // If signer address is different from admin, add it
  if (signerAddress && signerAddress.toLowerCase() !== adminAddress.toLowerCase()) {
    addressesToGrant.push(signerAddress);
  }

  // Roles to grant
  const rolesToGrant = [
    roles.MINTER_ROLE,
    roles.BURNER_ROLE,
    roles.WITHDRAWER_ROLE,
    roles.UPGRADER_ROLE,
    roles.PAUSER_ROLE
  ];

  console.log("🚀 Starting Role Granting Process");
  console.log("-------------------------------");

  // Grant roles to each address
  for (const address of addressesToGrant) {
    console.log(`\n🏷 Granting roles to ${address}:`);
    
    for (const role of rolesToGrant) {
      try {
        // Check if role is already assigned
        const hasRole = await tdrago.hasRole(role, address);
        
        if (!hasRole) {
          console.log(`  • Granting role: ${await getRoleName(tdrago, role)}`);
          const tx = await tdrago.grantRole(role, address);
          await tx.wait();
          console.log(`  ✅ Role granted successfully`);
        } else {
          console.log(`  • Role already granted: ${await getRoleName(tdrago, role)}`);
        }
      } catch (error) {
        console.error(`  ❌ Error granting role:`, error);
      }
    }
  }

  console.log("\n🔒 Role Granting Complete");

  // Verify roles after setup
  console.log("\n🔍 Role Verification:");
  for (const address of addressesToGrant) {
    console.log(`\n🏷 Checking roles for ${address}:`);
    
    for (const role of Object.values(roles)) {
      const hasRole = await tdrago.hasRole(role, address);
      const roleName = await getRoleName(tdrago, role);
      console.log(`  • ${roleName}: ${hasRole ? '✅ GRANTED' : '❌ NOT GRANTED'}`);
    }
  }
}

// Helper function to get role name
async function getRoleName(contract: any, role: string) {
  if (role === await contract.DEFAULT_ADMIN_ROLE()) return 'DEFAULT_ADMIN_ROLE';
  if (role === await contract.MINTER_ROLE()) return 'MINTER_ROLE';
  if (role === await contract.BURNER_ROLE()) return 'BURNER_ROLE';
  if (role === await contract.WITHDRAWER_ROLE()) return 'WITHDRAWER_ROLE';
  if (role === await contract.UPGRADER_ROLE()) return 'UPGRADER_ROLE';
  if (role === await contract.PAUSER_ROLE()) return 'PAUSER_ROLE';
  return 'UNKNOWN_ROLE';
}

grantAdminRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Role granting failed:", error);
    process.exit(1);
  });