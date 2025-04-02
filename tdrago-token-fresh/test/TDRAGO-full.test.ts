import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TDRAGO } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TDRAGO Token Full Test Suite", function () {
  let tdrago: TDRAGO;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let burner: HardhatEthersSigner;
  let withdrawer: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  // Role identifiers
  let MINTER_ROLE: string;
  let BURNER_ROLE: string;
  let WITHDRAWER_ROLE: string;
  let PAUSER_ROLE: string;
  let UPGRADER_ROLE: string;
  
  beforeEach(async function () {
    // Get signers
    [owner, minter, burner, withdrawer, user1, user2] = await ethers.getSigners();
    
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
    BURNER_ROLE = await tdrago.BURNER_ROLE();
    WITHDRAWER_ROLE = await tdrago.WITHDRAWER_ROLE();
    PAUSER_ROLE = await tdrago.PAUSER_ROLE();
    UPGRADER_ROLE = await tdrago.UPGRADER_ROLE();
    
    // Setup roles
    await tdrago.grantRole(MINTER_ROLE, minter.address);
    await tdrago.grantRole(BURNER_ROLE, burner.address);
    await tdrago.grantRole(WITHDRAWER_ROLE, withdrawer.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct name and symbol", async function () {
      expect(await tdrago.name()).to.equal("TDRAGO");
      expect(await tdrago.symbol()).to.equal("TDRAGO");
      expect(await tdrago.decimals()).to.equal(18);
    });
    
    it("Should assign the admin role to the owner", async function () {
      const DEFAULT_ADMIN_ROLE = await tdrago.DEFAULT_ADMIN_ROLE();
      expect(await tdrago.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Role Management", function () {
    it("Should correctly assign roles", async function () {
      expect(await tdrago.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await tdrago.hasRole(BURNER_ROLE, burner.address)).to.be.true;
      expect(await tdrago.hasRole(WITHDRAWER_ROLE, withdrawer.address)).to.be.true;
    });
    
    it("Should allow admin to revoke roles", async function () {
      await tdrago.revokeRole(MINTER_ROLE, minter.address);
      expect(await tdrago.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
    
    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        tdrago.connect(user1).grantRole(MINTER_ROLE, user2.address)
      ).to.be.revertedWithCustomError(tdrago, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    it("Should allow minting by minter role", async function () {
      const amount = ethers.parseEther("100");
      await tdrago.connect(minter).mint(user1.address, amount);
      expect(await tdrago.balanceOf(user1.address)).to.equal(amount);
    });
    
    it("Should emit Minted event", async function () {
      const amount = ethers.parseEther("100");
      await expect(tdrago.connect(minter).mint(user1.address, amount))
        .to.emit(tdrago, "Minted")
        .withArgs(user1.address, amount);
    });
    
    it("Should revert on zero address", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        tdrago.connect(minter).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(tdrago, "ZeroAddressNotAllowed");
    });
    
    it("Should revert on zero amount", async function () {
      await expect(
        tdrago.connect(minter).mint(user1.address, 0)
      ).to.be.revertedWithCustomError(tdrago, "ZeroAmountNotAllowed");
    });
    
    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        tdrago.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWithCustomError(tdrago, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens to user1 for testing burns
      const amount = ethers.parseEther("1000");
      await tdrago.connect(minter).mint(user1.address, amount);
    });
    
    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await tdrago.balanceOf(user1.address);
      
      await tdrago.connect(user1).burn(burnAmount);
      
      const finalBalance = await tdrago.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });
    
    it("Should emit Burned event", async function () {
      const burnAmount = ethers.parseEther("100");
      await expect(tdrago.connect(user1).burn(burnAmount))
        .to.emit(tdrago, "Burned")
        .withArgs(user1.address, burnAmount);
    });
    
    it("Should revert on zero amount burn", async function () {
      await expect(
        tdrago.connect(user1).burn(0)
      ).to.be.revertedWithCustomError(tdrago, "ZeroAmountNotAllowed");
    });
    
    it("Should allow burner role to burnFrom with approval", async function () {
      const burnAmount = ethers.parseEther("100");
      
      // Approve burner
      await tdrago.connect(user1).approve(burner.address, burnAmount);
      
      // Burn tokens
      await tdrago.connect(burner).burnFrom(user1.address, burnAmount);
      
      // Check balance
      expect(await tdrago.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });
    
    it("Should revert when non-burner tries to burnFrom", async function () {
      const burnAmount = ethers.parseEther("100");
      
      // Approve user2
      await tdrago.connect(user1).approve(user2.address, burnAmount);
      
      // Try to burn tokens
      await expect(
        tdrago.connect(user2).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(tdrago, "NotAuthorized");
    });
  });

  describe("Withdraw Function", function () {
    it("Should allow withdrawer to withdraw tokens", async function () {
      const amount = ethers.parseEther("100");
      await tdrago.connect(withdrawer).withdraw(user1.address, amount);
      expect(await tdrago.balanceOf(user1.address)).to.equal(amount);
    });
    
    it("Should emit Withdrawn event", async function () {
      const amount = ethers.parseEther("100");
      await expect(tdrago.connect(withdrawer).withdraw(user1.address, amount))
        .to.emit(tdrago, "Withdrawn")
        .withArgs(user1.address, amount);
    });
    
    it("Should revert when non-withdrawer tries to withdraw", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        tdrago.connect(user1).withdraw(user2.address, amount)
      ).to.be.revertedWithCustomError(tdrago, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      // Grant PAUSER_ROLE to owner
      await tdrago.grantRole(PAUSER_ROLE, owner.address);
      
      // Mint some tokens for testing
      await tdrago.connect(minter).mint(user1.address, ethers.parseEther("1000"));
    });
    
    it("Should allow pauser to pause the contract", async function () {
      await tdrago.connect(owner).pause();
      expect(await tdrago.paused()).to.be.true;
    });
    
    it("Should allow pauser to unpause the contract", async function () {
      await tdrago.connect(owner).pause();
      await tdrago.connect(owner).unpause();
      expect(await tdrago.paused()).to.be.false;
    });
    
    it("Should not allow non-pauser to pause", async function () {
      await expect(
        tdrago.connect(user1).pause()
      ).to.be.revertedWithCustomError(tdrago, "AccessControlUnauthorizedAccount");
    });
    
    it("Should block transfers when paused", async function () {
      await tdrago.connect(owner).pause();
      
      await expect(
        tdrago.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(tdrago, "EnforcedPause");
    });
    
    it("Should block minting when paused", async function () {
      await tdrago.connect(owner).pause();
      
      await expect(
        tdrago.connect(minter).mint(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(tdrago, "EnforcedPause");
    });
    
    it("Should resume operations after unpause", async function () {
      await tdrago.connect(owner).pause();
      await tdrago.connect(owner).unpause();
      
      const amount = ethers.parseEther("100");
      await tdrago.connect(user1).transfer(user2.address, amount);
      expect(await tdrago.balanceOf(user2.address)).to.equal(amount);
    });
  });
});