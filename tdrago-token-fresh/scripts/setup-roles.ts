import { ethers } from "hardhat";

// Set this to your deployed proxy address
const PROXY_ADDRESS = "0xd8fd113176d679DC0b21102c6DBBC61DEF31FF43";

// Set these to the addresses that will play different roles in your system
const MINTER_ADDRESS = "0x3761cB5330e2b016d0b90ef8C295e453a148F2CE"; // Replace with your minter address
const BURNER_ADDRESS = "0x3761cB5330e2b016d0b90ef8C295e453a148F2CE"; // Replace with your burner address
const WITHDRAWER_ADDRESS = "0x3761cB5330e2b016d0b90ef8C295e453a148F2CE"; // Replace with your withdrawer address

async function main() {
  try {
    console.log(`Setting up roles for TDRAGO token at ${PROXY_ADDRESS}...`);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`Setting up with account: ${deployer.address}`);
    
    // Connect to deployed token
    const tdrago = await ethers.getContractAt("TDRAGO", PROXY_ADDRESS);
    
    // Get role constants
    const MINTER_ROLE = await tdrago.MINTER_ROLE();
    const BURNER_ROLE = await tdrago.BURNER_ROLE();
    const WITHDRAWER_ROLE = await tdrago.WITHDRAWER_ROLE();
    
    // Grant roles
    console.log(`Granting MINTER_ROLE to ${MINTER_ADDRESS}...`);
    await tdrago.grantRole(MINTER_ROLE, MINTER_ADDRESS);
    
    console.log(`Granting BURNER_ROLE to ${BURNER_ADDRESS}...`);
    await tdrago.grantRole(BURNER_ROLE, BURNER_ADDRESS);
    
    console.log(`Granting WITHDRAWER_ROLE to ${WITHDRAWER_ADDRESS}...`);
    await tdrago.grantRole(WITHDRAWER_ROLE, WITHDRAWER_ADDRESS);
    
    console.log("\nRole assignment completed!");
    
    // Verify roles were assigned correctly
    console.log("\nVerifying role assignments:");
    console.log(`MINTER_ROLE for ${MINTER_ADDRESS}: ${await tdrago.hasRole(MINTER_ROLE, MINTER_ADDRESS)}`);
    console.log(`BURNER_ROLE for ${BURNER_ADDRESS}: ${await tdrago.hasRole(BURNER_ROLE, BURNER_ADDRESS)}`);
    console.log(`WITHDRAWER_ROLE for ${WITHDRAWER_ADDRESS}: ${await tdrago.hasRole(WITHDRAWER_ROLE, WITHDRAWER_ADDRESS)}`);
    
  } catch (error) {
    console.error("Role setup failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });