import { ethers } from "hardhat";

// Set this to your deployed proxy address
const PROXY_ADDRESS = "YOUR_DEPLOYED_PROXY_ADDRESS";

async function main() {
  try {
    // Connect to deployed token
    const tdrago = await ethers.getContractAt("TDRAGO", PROXY_ADDRESS);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`Connected with account: ${deployer.address}`);
    
    // Check token details
    const name = await tdrago.name();
    const symbol = await tdrago.symbol();
    const decimals = await tdrago.decimals();
    const totalSupply = await tdrago.totalSupply();
    
    console.log("Token Details:");
    console.log(`- Name: ${name}`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Decimals: ${decimals}`);
    console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
    
    // Check roles
    const MINTER_ROLE = await tdrago.MINTER_ROLE();
    const isMinter = await tdrago.hasRole(MINTER_ROLE, deployer.address);
    console.log(`- Deployer is minter: ${isMinter}`);
    
    // Test minting if deployer is minter
    if (isMinter) {
      const testAmount = ethers.parseEther("10");
      console.log(`\nMinting ${ethers.formatEther(testAmount)} ${symbol} to deployer...`);
      
      const mintTx = await tdrago.mint(deployer.address, testAmount);
      await mintTx.wait();
      
      const newBalance = await tdrago.balanceOf(deployer.address);
      console.log(`New balance: ${ethers.formatEther(newBalance)} ${symbol}`);
      
      // Check updated total supply
      const newTotalSupply = await tdrago.totalSupply();
      console.log(`Updated total supply: ${ethers.formatEther(newTotalSupply)} ${symbol}`);
    } else {
      console.log("Deployer doesn't have MINTER_ROLE. Skipping mint test.");
    }
    
    console.log("\nTest completed successfully!");
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