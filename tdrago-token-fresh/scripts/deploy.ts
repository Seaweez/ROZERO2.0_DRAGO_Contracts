import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Starting TDRAGO token deployment...");

  try {
    // Get the signers
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
    
    // Get the contract factory
    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    console.log("Contract factory initialized");
    
    // Deploy the proxy (this will also deploy implementation and admin contracts)
    console.log("Deploying proxy...");
    const proxy = await upgrades.deployProxy(
        TDRAGO,
        [deployer.address], // Admin parameter
        {
          kind: "uups",
          initializer: "initialize",
        }
      );
    
    // Wait for deployment to complete
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    
    // Get the implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    
    console.log("TDRAGO token deployment completed successfully!");
    console.log("-------------------------------------");
    console.log(`Proxy address: ${proxyAddress}`);
    console.log(`Implementation address: ${implementationAddress}`);
    console.log("-------------------------------------");
    
    console.log("Next steps:");
    console.log(`1. Verify implementation: npx hardhat verify --network bscTestnet ${implementationAddress}`);
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });