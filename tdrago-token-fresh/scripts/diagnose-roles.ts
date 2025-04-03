import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function diagnoseRoles() {
  try {
    const proxyAddress = process.env.PROXY_ADDRESS;
    if (!proxyAddress) {
      throw new Error("PROXY_ADDRESS not set in .env");
    }

    console.log("🔍 Starting Role Diagnosis");
    console.log("------------------------");

    // Network and connection diagnostics
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Get signers
    const signers = await ethers.getSigners();
    const signer = signers[0];
    const signerAddress = await signer.getAddress();

    console.log(`Signer Address: ${signerAddress}`);
    console.log(`Proxy Address: ${proxyAddress}`);

    // Check signer balance
    const balance = await ethers.provider.getBalance(signerAddress);
    console.log(`Signer Balance: ${ethers.formatEther(balance)} TBNB`);

    // Attempt to connect to contract
    let tdrago;
    try {
      tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);
      console.log("✅ Successfully connected to contract");
    } catch (contractError) {
      console.error("❌ Failed to connect to contract:", contractError);
      return;
    }

    // Get admin role
    const DEFAULT_ADMIN_ROLE = await tdrago.DEFAULT_ADMIN_ROLE();
    console.log(`Default Admin Role: ${DEFAULT_ADMIN_ROLE}`);

    // Check if signer has admin role
    try {
      const hasAdminRole = await tdrago.hasRole(DEFAULT_ADMIN_ROLE, signerAddress);
      console.log(`Has Default Admin Role: ${hasAdminRole}`);
    } catch (roleCheckError) {
      console.error("❌ Failed to check admin role:", roleCheckError);
    }

  } catch (error) {
    console.error("🚨 Diagnosis Failed:", error);
  }
}

diagnoseRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });