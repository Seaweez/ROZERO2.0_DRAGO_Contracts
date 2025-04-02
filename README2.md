✅ Step-by-Step: TDRAGO Full Redeploy & Test
🧩 Step 1: Clean Setup
If needed, reinitialize your Hardhat project:

bash
คัดลอก
แก้ไข
npx hardhat clean
npx hardhat compile
📦 Step 2: Make Sure .env is Set
Here’s your clean, correct .env file (no quotes):

env
คัดลอก
แก้ไข
PRIVATE_KEY=your_private_key_without_0x
ADMIN_ADDRESS=0xYourAdminWalletHere
TREASURY_ADDRESS=0xYourTreasuryWalletHere
RPC_URL=https://bsc-testnet.publicnode.com
🛠 Step 3: Deploy Fresh Proxy
Run this:

bash
คัดลอก
แก้ไข
npx hardhat run scripts/deploy.ts --network bscTestnet
✅ Output you want:

javascript
คัดลอก
แก้ไข
Deploying contracts with account: 0x...
TDRAGO Proxy deployed to: 0x123...
👉 Copy this proxy address, and update .env:

env
คัดลอก
แก้ไข
PROXY_ADDRESS=0x123...  # your deployed proxy
🆙 Step 4: Run Upgrade (optional, only if needed)
If you want to run the initializeV2() function:

bash
คัดลอก
แก้ไข
npx hardhat run scripts/upgrade.ts --network bscTestnet
🧪 Step 5: Create a scripts/interact.ts
Create scripts/interact.ts and paste this:

ts
คัดลอก
แก้ไข
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
🧪 Step 6: Run Interaction
bash
คัดลอก
แก้ไข
npx hardhat run scripts/interact.ts --network bscTestnet
Expected output:

yaml
คัดลอก
แก้ไข
Using signer: 0x...
Minting 1000 TDRAGO to 0x...
Recipient balance: 1000 TDRAGO
Total supply: 1000 TDRAGO