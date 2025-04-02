
// README.md

# 🐉 TDRAGO Token Smart Contract (ROZERO 2.0)

An upgradeable, secure ERC20 token for the ROZERO 2.0 GameFi ecosystem.

## 🧱 Features
- ERC20-compliant with 18 decimals
- Upgradeable (UUPS Proxy Pattern)
- Role-based Access Control (Admin, Minter, Withdrawer, Burner, Upgrader)
- Daily withdrawal limits
- Treasury funding logic
- Timelock-based parameter changes
- Custom errors and event logs

## 🚀 Deployment (BSC Testnet)

### 1. Setup
```
npm install
cp .env.example .env
```

Update `.env` with:
```dotenv
PRIVATE_KEY=your_wallet_private_key
ADMIN_ADDRESS=0xAdminAddressHere
TREASURY_ADDRESS=0xTreasuryAddressHere
RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

### 2. Compile & Deploy
```
npx hardhat compile
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### 3. Upgrade (When needed)
```
PROXY_ADDRESS=0xDeployedProxyAddressHere \
npx hardhat run scripts/upgrade.ts --network bscTestnet
```

## 🧪 Testing
- Add unit tests in `test/TDRAGO.test.ts`
- Use `chai`, `ethers`, and `@openzeppelin/test-helpers`

## 🛡 Security
- Contract follows OpenZeppelin best practices
- Built-in protection: Pausable, ReentrancyGuard, strict RBAC
- Ready for audit

---

**Maintained by:** ROZERO 2.0 GameFi Dev Team