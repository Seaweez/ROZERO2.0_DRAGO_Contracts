import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  const tdrago = await ethers.getContractAt("TDRAGO", proxyAddress);
  const tx = await tdrago.initializeV2(treasuryAddress);
  await tx.wait();

  console.log("✅ initializeV2() executed!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
