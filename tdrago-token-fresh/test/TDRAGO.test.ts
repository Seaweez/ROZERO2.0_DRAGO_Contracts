import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";

describe("TDRAGO Token", function () {
  let tdrago: Contract;
  let admin: Signer;
  let user: Signer;
  let treasury: Signer;
  let minter: Signer;
  let burner: Signer;
  let withdrawer: Signer;

  let adminAddress: string;
  let userAddress: string;
  let treasuryAddress: string;
  let minterAddress: string;
  let burnerAddress: string;
  let withdrawerAddress: string;

  beforeEach(async function () {
    [admin, user, treasury, minter, burner, withdrawer] = await ethers.getSigners();
    
    adminAddress = await admin.getAddress();
    userAddress = await user.getAddress();
    treasuryAddress = await treasury.getAddress();
    minterAddress = await minter.getAddress();
    burnerAddress = await burner.getAddress();
    withdrawerAddress = await withdrawer.getAddress();

    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    tdrago = await upgrades.deployProxy(TDRAGO, [adminAddress, treasuryAddress], {
      initializer: "initialize",
      kind: "uups",
    });
    await tdrago.waitForDeployment();
  });

  // Token Basics
  describe("Token Initialization", function () {
    it("should have correct name and symbol", async function () {
      expect(await tdrago.name()).to.equal("TDRAGO");
      expect(await tdrago.symbol()).to.equal("TDRAGO");
      expect(await tdrago.decimals()).to.equal(18);
    });

    it("should set initial treasury correctly", async function () {
      expect(await tdrago.treasury()).to.equal(treasuryAddress);
    });
  });

  // Role Management
  describe("Role Management", function () {
    it("should allow admin to grant and revoke roles", async function () {
      const MINTER_ROLE = await tdrago.MINTER_ROLE();
      
      // Grant role
      await tdrago.grantRole(MINTER_ROLE, minterAddress);
      expect(await tdrago.hasRole(MINTER_ROLE, minterAddress)).to.be.true;

      // Revoke role
      await tdrago.revokeRole(MINTER_ROLE, minterAddress);
      expect(await tdrago.hasRole(MINTER_ROLE, minterAddress)).to.be.false;
    });

    it("should prevent non-admin from managing roles", async function () {
      const MINTER_ROLE = await tdrago.MINTER_ROLE();
      
      await expect(
        tdrago.connect(user).grantRole(MINTER_ROLE, minterAddress)
      ).to.be.reverted;
    });
  });

  // Minting Functionality
  describe("Minting", function () {
    beforeEach(async function () {
      const MINTER_ROLE = await tdrago.MINTER_ROLE();
      await tdrago.grantRole(MINTER_ROLE, minterAddress);
    });

    it("should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await tdrago.connect(minter).mint(userAddress, amount);
      
      expect(await tdrago.balanceOf(userAddress)).to.equal(amount);
    });

    it("should prevent non-minter from minting", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        tdrago.connect(user).mint(userAddress, amount)
      ).to.be.reverted;
    });
  });

  // Burning Functionality
  describe("Burning", function () {
    beforeEach(async function () {
      const MINTER_ROLE = await tdrago.MINTER_ROLE();
      const BURNER_ROLE = await tdrago.BURNER_ROLE();
      await tdrago.grantRole(MINTER_ROLE, minterAddress);
      await tdrago.grantRole(BURNER_ROLE, burnerAddress);
      
      // Mint some tokens to user
      await tdrago.connect(minter).mint(userAddress, ethers.parseEther("100"));
    });

    it("should allow user to burn own tokens", async function () {
      const burnAmount = ethers.parseEther("50");
      await tdrago.connect(user).burn(burnAmount);
      
      expect(await tdrago.balanceOf(userAddress)).to.equal(ethers.parseEther("50"));
    });

    it("should allow burner role to burn tokens from any account", async function () {
      const burnAmount = ethers.parseEther("50");
      
      // First approve the burner to burn tokens
      await tdrago.connect(user).approve(burnerAddress, burnAmount);
      
      // Then burn from the user's account
      await tdrago.connect(burner).burnFrom(userAddress, burnAmount);
      
      expect(await tdrago.balanceOf(userAddress)).to.equal(ethers.parseEther("50"));
    });
  });

  // Withdrawal Functionality
  describe("Withdrawal", function () {
    beforeEach(async function () {
      const WITHDRAWER_ROLE = await tdrago.WITHDRAWER_ROLE();
      await tdrago.grantRole(WITHDRAWER_ROLE, withdrawerAddress);
    });

    it("should allow withdrawer to mint tokens to a specific address", async function () {
      const withdrawAmount = ethers.parseEther("10");
      await tdrago.connect(withdrawer).withdraw(userAddress, withdrawAmount);
      
      expect(await tdrago.balanceOf(userAddress)).to.equal(withdrawAmount);
    });

    it("should prevent exceeding daily withdrawal limit", async function () {
      const dailyLimit = await tdrago.dailyWithdrawalLimit();
      
      // First, withdraw the entire daily limit
      await tdrago.connect(withdrawer).withdraw(userAddress, dailyLimit);
      
      // Then try to withdraw 1 more token
      const excessAmount = ethers.parseEther("1");
      
      await expect(
        tdrago.connect(withdrawer).withdraw(userAddress, excessAmount)
      ).to.be.revertedWithCustomError(tdrago, "ExceedsDailyWithdrawalLimit");
    });
  });

  // Pause Functionality
  describe("Pausability", function () {
    beforeEach(async function () {
      const PAUSER_ROLE = await tdrago.PAUSER_ROLE();
      await tdrago.grantRole(PAUSER_ROLE, adminAddress);
    });

    it("should allow pausing and unpausing", async function () {
      // Pause the contract
      await tdrago.pause();
      expect(await tdrago.paused()).to.be.true;

      // Unpause the contract
      await tdrago.unpause();
      expect(await tdrago.paused()).to.be.false;
    });

    it("should prevent transfers when paused", async function () {
      const MINTER_ROLE = await tdrago.MINTER_ROLE();
      await tdrago.grantRole(MINTER_ROLE, minterAddress);
      
      // Mint tokens to user
      await tdrago.connect(minter).mint(userAddress, ethers.parseEther("100"));
      
      // Pause the contract
      await tdrago.pause();

      // Try to transfer
      await expect(
        tdrago.connect(user).transfer(treasuryAddress, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(tdrago, "EnforcedPause");
    });
  });

  // Timelock Parameter Changes
  describe("Timelock Parameter Changes", function () {
    it("should propose and execute max withdrawal change", async function () {
      const newMaxWithdrawal = ethers.parseEther("200000");
      
      // Propose change
      const proposeTx = await tdrago.proposeMaxWithdrawalChange(newMaxWithdrawal);
      const receipt = await proposeTx.wait();
      
      // Extract proposal ID from event logs
      const proposalId = receipt.logs.find(
        (log: any) => log.fragment?.name === "ParameterChangeProposed"
      )?.args[0];

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 24 hours
      await ethers.provider.send("evm_mine");

      // Execute change
      await tdrago.executeMaxWithdrawalChange(proposalId);

      // Verify new max withdrawal
      expect(await tdrago.maxWithdrawalAmount()).to.equal(newMaxWithdrawal);
    });
  });

  // Upgrade Functionality
  describe("Upgradability", function () {
    it("should allow upgrading the contract", async function () {
      const UPGRADER_ROLE = await tdrago.UPGRADER_ROLE();
      await tdrago.grantRole(UPGRADER_ROLE, adminAddress);

      const TDRAGO = await ethers.getContractFactory("TDRAGO");
      const upgraded = await upgrades.upgradeProxy(await tdrago.getAddress(), TDRAGO);
      
      expect(await upgraded.getAddress()).to.equal(await tdrago.getAddress());
    });
  });
});