import { ethers, upgrades } from "hardhat";

async function main() {
  try {
    console.log("Starting TDRAGO token test...");

    // Get signers
    const [owner, user1] = await ethers.getSigners();
    console.log(`Testing with account: ${owner.address}`);
    
    // Deploy the contract
    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    console.log("Deploying TDRAGO...");
    
    const tdrago = await upgrades.deployProxy(
      TDRAGO,
      [owner.address], // Initialize with the owner as admin
      {
        kind: "uups",
        initializer: "initialize",
      }
    );
    
    await tdrago.waitForDeployment();
    console.log(`TDRAGO deployed to: ${await tdrago.getAddress()}`);
    
    // Get MINTER_ROLE
    const MINTER_ROLE = await tdrago.MINTER_ROLE();
    
    // Grant minter role to owner
    await tdrago.grantRole(MINTER_ROLE, owner.address);
    console.log("Granted MINTER_ROLE to owner");
    
    // Mint some tokens
    const mintAmount = ethers.parseEther("100");
    await tdrago.mint(user1.address, mintAmount);
    console.log(`Minted ${ethers.formatEther(mintAmount)} TDRAGO to ${user1.address}`);
    
    // Check balance
    const balance = await tdrago.balanceOf(user1.address);
    console.log(`User1 balance: ${ethers.formatEther(balance)} TDRAGO`);
    
    // Check total supply
    const totalSupply = await tdrago.totalSupply();
    console.log(`Total supply: ${ethers.formatEther(totalSupply)} TDRAGO`);
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });