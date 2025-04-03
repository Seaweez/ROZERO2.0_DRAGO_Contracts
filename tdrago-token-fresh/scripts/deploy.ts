import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Validate addresses
  const validateAddress = (label: string, address?: string) => {
    if (!address || !ethers.isAddress(address)) {
      throw new Error(`Invalid ${label}: ${address}`);
    }
  };

  // Get deployment parameters from environment
  const adminAddress = process.env.ADMIN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  // Validate addresses
  validateAddress("ADMIN_ADDRESS", adminAddress);
  validateAddress("TREASURY_ADDRESS", treasuryAddress);

  // Get deploying account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy TDRAGO token
  const TDRAGO = await ethers.getContractFactory("TDRAGO");
  console.log("Deploying TDRAGO Token...");

  const tdrago = await upgrades.deployProxy(TDRAGO, [adminAddress, treasuryAddress], {
    initializer: "initialize",
    kind: "uups"
  });

  // Wait for deployment
  await tdrago.waitForDeployment();

  // Get proxy and implementation addresses
  const proxyAddress = await tdrago.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("TDRAGO Proxy deployed to:", proxyAddress);
  console.log("TDRAGO Implementation deployed to:", implementationAddress);

  // Verify initial configuration
  console.log("\n🔍 Initial Contract Configuration:");
  console.log("Treasury Address:", await tdrago.treasury());
  console.log("Daily Withdrawal Limit:", ethers.formatEther(await tdrago.dailyWithdrawalLimit()), "TDRAGO");
  console.log("Max Withdrawal Amount:", ethers.formatEther(await tdrago.maxWithdrawalAmount()), "TDRAGO");

  return {
    proxyAddress,
    implementationAddress,
    adminAddress,
    treasuryAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });