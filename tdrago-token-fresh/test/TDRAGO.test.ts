// test/TDRAGO.test.ts
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

describe("TDRAGO", function () {
  let tdrago: Contract;
  let admin: any;
  let user: any;
  let treasury: any;

  beforeEach(async function () {
    [admin, user, treasury] = await ethers.getSigners();

    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    tdrago = await upgrades.deployProxy(TDRAGO, [admin.address, treasury.address], {
      initializer: "initialize",
      kind: "uups",
    });
    await tdrago.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await tdrago.name()).to.equal("TDRAGO");
    expect(await tdrago.symbol()).to.equal("TDRAGO");
  });

  it("should allow MINTER_ROLE to mint tokens", async function () {
    await tdrago.grantRole(await tdrago.MINTER_ROLE(), admin.address);
    await expect(tdrago.mint(user.address, ethers.parseEther("100")))
      .to.emit(tdrago, "Minted")
      .withArgs(user.address, ethers.parseEther("100"));
    expect(await tdrago.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("should prevent non-minter from minting", async function () {
    await expect(tdrago.connect(user).mint(user.address, ethers.parseEther("100"))).to.be.reverted;
  });

  it("should allow user to burn their tokens", async function () {
    await tdrago.grantRole(await tdrago.MINTER_ROLE(), admin.address);
    await tdrago.mint(user.address, ethers.parseEther("50"));
    await tdrago.connect(user).burn(ethers.parseEther("10"));
    expect(await tdrago.balanceOf(user.address)).to.equal(ethers.parseEther("40"));
  });

  it("should only allow WITHDRAWER_ROLE to call withdraw()", async function () {
    await tdrago.grantRole(await tdrago.WITHDRAWER_ROLE(), admin.address);
    await expect(tdrago.withdraw(user.address, ethers.parseEther("10")))
      .to.emit(tdrago, "Withdrawn")
      .withArgs(user.address, ethers.parseEther("10"));
    expect(await tdrago.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
  });

  it("should fail withdraw if amount exceeds daily limit using native BigInt", async function () {
    await tdrago.grantRole(await tdrago.WITHDRAWER_ROLE(), admin.address);
    const overLimit = await tdrago.dailyWithdrawalLimit();
    const tooMuch = overLimit + 1n; // BigInt addition
    await expect(tdrago.withdraw(user.address, tooMuch)).to.be.reverted;
  });

  it("should fail withdraw if amount exceeds daily limit using manual BigInt conversion", async function () {
    await tdrago.grantRole(await tdrago.WITHDRAWER_ROLE(), admin.address);
    const overLimit = await tdrago.dailyWithdrawalLimit(); // bigint
    const tooMuch = BigInt(overLimit) + BigInt(1); // manual BigInt arithmetic
    await expect(tdrago.withdraw(user.address, tooMuch)).to.be.reverted;
  });
  
});