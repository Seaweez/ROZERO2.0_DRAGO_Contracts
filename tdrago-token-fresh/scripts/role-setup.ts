import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function setupRoles() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  // Get role constants dynamically
  const roles = {
    DEFAULT_ADMIN_ROLE: await tdrago.DEFAULT_ADMIN_ROLE(),
    MINTER_ROLE: await tdrago.MINTER_ROLE(),
    BURNER_ROLE: await tdrago.BURNER_ROLE(),
    WITHDRAWER_ROLE: await tdrago.WITHDRAWER_ROLE(),
    UPGRADER_ROLE: await tdrago.UPGRADER_ROLE(),
    PAUSER_ROLE: await tdrago.PAUSER_ROLE()
  };

  console.log("🚀 Role Setup Process");
  console.log("-------------------");
  console.log(`Signer: ${signerAddress}`);
  console.log(`Proxy Address: ${proxyAddress}`);

  // Addresses to grant roles to (with detailed configuration)
  const addressesToGrant = [
    { 
      address: signerAddress, 
      description: "Current Signer" 
    },
    { 
      address: process.env.ADMIN_ADDRESS, 
      description: "Admin (Full Control)" 
    },
    { 
      address: process.env.MINTER_ADDRESS, 
      description: "Minter (Token Creation)" 
    },
    { 
      address: process.env.BURNER_ADDRESS, 
      description: "Burner (Token Destruction)" 
    },
    { 
      address: process.env.WITHDRAWER_ADDRESS, 
      description: "Withdrawer (Token Withdrawal)" 
    },
    { 
      address: process.env.UPGRADER_ADDRESS, 
      description: "Upgrader (Contract Upgrade)" 
    }
  ].filter(item => item.address && ethers.isAddress(item.address));

  // Role assignments with comprehensive details
  const roleAssignments = [
    { 
      role: roles.MINTER_ROLE, 
      description: "Token Minting Role" 
    },
    { 
      role: roles.BURNER_ROLE, 
      description: "Token Burning Role" 
    },
    { 
      role: roles.WITHDRAWER_ROLE, 
      description: "Token Withdrawal Role" 
    },
    { 
      role: roles.UPGRADER_ROLE, 
      description: "Contract Upgrade Role" 
    },
    { 
      role: roles.PAUSER_ROLE, 
      description: "Contract Pause Role" 
    }
  ];

  // Perform role assignments
  for (const { address, description } of addressesToGrant) {
    console.log(`\n📍 Configuring roles for ${address} (${description}):`);
    
    for (const assignment of roleAssignments) {
      try {
        const hasRole = await tdrago.hasRole(assignment.role, address);
        
        if (!hasRole) {
          console.log(`  • Granting ${assignment.description}`);
          const tx = await tdrago.grantRole(assignment.role, address);
          await tx.wait();
          console.log(`  ✅ Role granted successfully`);
        } else {
          console.log(`  • ${assignment.description} already assigned`);
        }
      } catch (error) {
        console.error(`  ❌ Error granting role:`, error);
      }
    }
  }

  // Verification step (from original script)
  console.log("\n🔍 Role Verification:");
  for (const { address, description } of addressesToGrant) {
    console.log(`\n${description} (${address}):`);
    for (const [roleName, roleBytes] of Object.entries(roles)) {
      const hasRole = await tdrago.hasRole(roleBytes, address);
      console.log(`  • ${roleName}: ${hasRole ? '✅ GRANTED' : '❌ NOT GRANTED'}`);
    }
  }

  console.log("\n🏁 Role Setup Complete");
}

setupRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Role setup failed:", error);
    process.exit(1);
  });