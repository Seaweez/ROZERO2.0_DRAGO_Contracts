import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

function validateAddress(label: string, address?: string) {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    throw new Error(`${label} must be a valid 0x-prefixed address`);
  }
}

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  validateAddress("PROXY_ADDRESS", proxyAddress);
  validateAddress("TREASURY_ADDRESS", treasuryAddress);

  console.log("Deploying new implementation...");
  const TDRAGO = await ethers.getContractFactory("TDRAGO");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TDRAGO);
  await upgraded.waitForDeployment();

  console.log("Upgraded implementation deployed to:", await upgraded.getAddress());
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
