import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS!;
  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);

  const [signer] = await ethers.getSigners();
  const deployer = signer.address;

  const upgraderRole = await tdrago.UPGRADER_ROLE();

  const tx = await tdrago.grantRole(upgraderRole, deployer);
  await tx.wait();

  console.log(`✅ Granted UPGRADER_ROLE to ${deployer}`);
}

main().catch(console.error);
