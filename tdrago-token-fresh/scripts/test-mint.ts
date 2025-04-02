import { ethers } from "hardhat";

// Set this to your deployed proxy address
const PROXY_ADDRESS = "0xd8fd113176d679DC0b21102c6DBBC61DEF31FF43";

// Set this to the address that will receive the tokens
const RECIPIENT_ADDRESS = "0x3761cB5330e2b016d0b90ef8C295e453a148F2CE"; // Replace with recipient

async function main() {
  try {
    console.log(`Testing TDRAGO token at ${PROXY_ADDRESS}...`);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`Testing with account: ${deployer.address}`);
    
    // Connect to deployed token
    const tdrago = await ethers.getContractAt("TDRAGO", PROXY_ADDRESS);
    
    // Mint tokens
    const mintAmount = ethers.parseEther("1000");
    console.log(`Minting ${ethers.formatEther(mintAmount)} TDRAGO to ${RECIPIENT_ADDRESS}...`);
    
    const tx = await tdrago.mint(RECIPIENT_ADDRESS, mintAmount);
    await tx.wait();
    
    // Check balance
    const balance = await tdrago.balanceOf(RECIPIENT_ADDRESS);
    console.log(`New balance of ${RECIPIENT_ADDRESS}: ${ethers.formatEther(balance)} TDRAGO`);
    
    // Check total supply
    const totalSupply = await tdrago.totalSupply();
    console.log(`Total supply: ${ethers.formatEther(totalSupply)} TDRAGO`);
    
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });