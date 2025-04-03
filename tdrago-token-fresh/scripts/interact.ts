import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function tokenInteraction() {
  // Get contract address and addresses to work with
  const proxyAddress = process.env.PROXY_ADDRESS;
  const adminAddress = process.env.ADMIN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  if (!proxyAddress || !adminAddress || !treasuryAddress) {
    throw new Error("Missing required addresses in .env");
  }

  // Connect to the contract
  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  // Get the signer
  const [signer] = await ethers.getSigners();

  console.log("🚀 TDRAGO Token Interaction");
  console.log("---------------------------");

  // Check basic token information
  console.log("\n📊 Token Details:");
  console.log("Name:", await tdrago.name());
  console.log("Symbol:", await tdrago.symbol());
  console.log("Decimals:", await tdrago.decimals());

  // Check total supply
  const totalSupply = await tdrago.totalSupply();
  console.log("Total Supply:", ethers.formatEther(totalSupply), "TDRAGO");

  // Check treasury details
  console.log("\n🏦 Treasury Information:");
  console.log("Treasury Address:", await tdrago.treasury());
  console.log("Daily Withdrawal Limit:", 
    ethers.formatEther(await tdrago.dailyWithdrawalLimit()), 
    "TDRAGO"
  );

  // Demonstrate minting (requires MINTER_ROLE)
  try {
    const mintAmount = ethers.parseEther("1000");
    console.log("\n💰 Minting Tokens:");
    console.log(`Minting ${ethers.formatEther(mintAmount)} TDRAGO to Treasury`);
    
    const tx = await tdrago.mint(treasuryAddress, mintAmount);
    await tx.wait();
    
    const treasuryBalance = await tdrago.balanceOf(treasuryAddress);
    console.log("Treasury Balance:", ethers.formatEther(treasuryBalance), "TDRAGO");
  } catch (error) {
    console.error("❌ Minting failed:", error);
  }
}

tokenInteraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Token interaction failed:", error);
    process.exit(1);
  });