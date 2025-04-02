import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TDRAGO } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TDRAGO Upgrade Test", function () {
  let tdrago: TDRAGO;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let MINTER_ROLE: string;
  let UPGRADER_ROLE: string;
  
  beforeEach(async function () {
    // Get signers
    [owner, user] = await ethers.getSigners();
    
    // Deploy the contract
    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    tdrago = await upgrades.deployProxy(
      TDRAGO,
      [owner.address], // Initialize with the owner as admin
      {
        kind: "uups",
        initializer: "initialize",
      }
    ) as unknown as TDRAGO;
    
    // Get role identifiers
    MINTER_ROLE = await tdrago.MINTER_ROLE();
    UPGRADER_ROLE = await tdrago.UPGRADER_ROLE();
    
    // Setup roles - owner already has UPGRADER_ROLE from initialize
    await tdrago.grantRole(MINTER_ROLE, owner.address);
    
    // Mint some tokens to test state preservation
    await tdrago.mint(user.address, ethers.parseEther("1000"));
  });

  it("Should preserve state after upgrade", async function () {
    // Check initial state
    const initialBalance = await tdrago.balanceOf(user.address);
    expect(initialBalance).to.equal(ethers.parseEther("1000"));
    
    // Perform upgrade with same implementation (simulating upgrade)
    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    const upgradedToken = await upgrades.upgradeProxy(await tdrago.getAddress(), TDRAGO);
    
    // Check state is preserved
    const finalBalance = await upgradedToken.balanceOf(user.address);
    expect(finalBalance).to.equal(initialBalance);
  });
  
  it("Should not allow upgrade from non-upgrader", async function () {
    const TDRAGO = await ethers.getContractFactory("TDRAGO", user);
    
    // Try to upgrade from user account (not upgrader)
    await expect(
      upgrades.upgradeProxy(await tdrago.getAddress(), TDRAGO)
    ).to.be.reverted; // Will revert as user doesn't have UPGRADER_ROLE
  });
});