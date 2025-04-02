import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

function validateAddress(label: string, address?: string) {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    throw new Error(`${label} must be a valid 0x-prefixed address`);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const adminAddress = process.env.ADMIN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  validateAddress("ADMIN_ADDRESS", adminAddress);
  validateAddress("TREASURY_ADDRESS", treasuryAddress);

  const TDRAGO = await ethers.getContractFactory("TDRAGO");
  const tdrago = await upgrades.deployProxy(TDRAGO, [adminAddress, treasuryAddress], {
    initializer: "initialize",
    kind: "uups"
  });

  await tdrago.waitForDeployment();
  console.log("TDRAGO Proxy deployed to:", await tdrago.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
