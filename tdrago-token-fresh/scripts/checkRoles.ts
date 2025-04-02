import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS!;
  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  const [signer] = await ethers.getSigners();
  const deployer = signer.address;

  const upgraderRole = await tdrago.UPGRADER_ROLE();
  const hasRole = await tdrago.hasRole(upgraderRole, deployer);

  console.log("Your wallet:", deployer);
  console.log("Has UPGRADER_ROLE:", hasRole);
}

main().catch(console.error);
