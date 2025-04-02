import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("TDRAGO Token", function () {
  async function deployTokenFixture() {
    // Get signers
    const [deployer, user1, user2] = await ethers.getSigners();
    
    // Deploy the contract
    const TDRAGO = await ethers.getContractFactory("TDRAGO");
    const token = await upgrades.deployProxy(
      TDRAGO,
      [deployer.address], // Initialize with the owner as admin
      {
        kind: "uups",
        initializer: "initialize",
      }
    );
    
    // Get role constants
    const minterRole = await token.MINTER_ROLE();
    const withdrawerRole = await token.WITHDRAWER_ROLE();
    
    // Grant roles for testing
    await token.grantRole(minterRole, deployer.address);
    await token.grantRole(withdrawerRole, deployer.address);
    
    return { token, deployer, user1, user2, minterRole, withdrawerRole };
  }
  
  it("Should initialize with correct name and symbol", async function () {
    const { token } = await deployTokenFixture();
    expect(await token.name()).to.equal("TDRAGO");
    expect(await token.symbol()).to.equal("TDRAGO");
    expect(await token.decimals()).to.equal(18);
  });
  
  it("Should allow minting tokens", async function () {
    const { token, deployer, user1 } = await deployTokenFixture();
    
    const mintAmount = ethers.parseEther("100");
    await token.mint(user1.address, mintAmount);
    
    expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
  });
  
  it("Should emit Minted event", async function () {
    const { token, deployer, user1 } = await deployTokenFixture();
    
    const mintAmount = ethers.parseEther("100");
    await expect(token.mint(user1.address, mintAmount))
      .to.emit(token, "Minted")
      .withArgs(user1.address, mintAmount);
  });
});