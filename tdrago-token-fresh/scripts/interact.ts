import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const PROXY_ADDRESS = process.env.PROXY_ADDRESS!;
const RECIPIENT_ADDRESS = process.env.TREASURY_ADDRESS!;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using signer: ${deployer.address}`);

  const tdrago = await ethers.getContractAt("TDRAGO", PROXY_ADDRESS);

  const amount = ethers.parseEther("1000");
  console.log(`Minting ${ethers.formatEther(amount)} TDRAGO to ${RECIPIENT_ADDRESS}`);

  const tx = await tdrago.mint(RECIPIENT_ADDRESS, amount);
  await tx.wait();

  const balance = await tdrago.balanceOf(RECIPIENT_ADDRESS);
  console.log(`Recipient balance: ${ethers.formatEther(balance)} TDRAGO`);

  const totalSupply = await tdrago.totalSupply();
  console.log(`Total supply: ${ethers.formatEther(totalSupply)} TDRAGO`);
}

main().catch((err) => {
  console.error("Error during test interaction:", err);
  process.exit(1);
});
