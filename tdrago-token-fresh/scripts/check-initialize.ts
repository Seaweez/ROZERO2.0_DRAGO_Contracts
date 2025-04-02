import { ethers } from "hardhat";

async function main() {
  const TDRAGO = await ethers.getContractFactory("TDRAGO");
  
  // Check the initialize function's ABI
  const initializeFragment = TDRAGO.interface.getFunction("initialize");
  
  console.log("Initialize function signature:");
  console.log(initializeFragment.format());
  
  console.log("\nParameter count:", initializeFragment.inputs.length);
  console.log("Parameters:");
  
  initializeFragment.inputs.forEach((param, index) => {
    console.log(`  ${index+1}. ${param.name} (${param.type})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });