// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title TDRAGO Token
 * @author ROZERO 2.0 Smart Contract Team
 * @notice Implementation of the TDRAGO token for GameFi ecosystem
 * @dev This contract implements an upgradeable ERC20 token with role-based access control
 *      using the UUPS proxy pattern for future upgrades, with added safety mechanisms
 */
contract TDRAGO is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // ========== STORAGE LAYOUT ==========
    // IMPORTANT: Storage layout must be carefully managed to be upgrade-safe
    // Storage slots are organized as follows:
    // - 1-4: Reserved for parent contracts (Initializable, ERC20Upgradeable, etc.)
    // - 5+: Contract-specific storage variables
    
    // ========== CONSTANTS ==========
    /// @dev Role definitions for access control
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // ========== NEW STORAGE V2 ==========
    /// @dev Treasury address to hold backup funds
    address public treasury;
    
    /// @dev Maximum amount that can be withdrawn in a single transaction
    uint256 public maxWithdrawalAmount;
    
    /// @dev Maximum amount that can be withdrawn by all addresses in a day
    uint256 public dailyWithdrawalLimit;
    
    /// @dev Timelock duration for changing parameters (24 hours)
    uint256 public constant TIMELOCK_DURATION = 1 days;
    
    /// @dev Structure for timelock proposals
    struct TimelockProposal {
        uint256 executeTime;
        uint256 value;
        address addressValue;
        bool exists;
    }
    
    /// @dev Mapping for pending parameter changes
    mapping(bytes32 => TimelockProposal) public pendingProposals;
    
    /// @dev Mapping to track withdrawal amounts per day
    mapping(uint256 => uint256) public dailyWithdrawalAmount;
    
    /// @dev Mapping to track withdrawal amounts per address
    mapping(address => mapping(uint256 => uint256)) public addressDailyWithdrawal;
    
    // ========== STORAGE GAP ==========
    // Reserved slots for future upgrades
    uint256[40] private __gap;
    
    // ========== EVENTS ==========
    /**
     * @dev Emitted when tokens are minted
     * @param to Address receiving the tokens
     * @param amount Amount of tokens minted
     */
    event Minted(address indexed to, uint256 amount);
    
    /**
     * @dev Emitted when tokens are burned
     * @param from Address burning the tokens
     * @param amount Amount of tokens burned
     */
    event Burned(address indexed from, uint256 amount);
    
    /**
     * @dev Emitted when tokens are withdrawn to a player
     * @param to Address receiving the tokens
     * @param amount Amount of tokens withdrawn
     */
    event Withdrawn(address indexed to, uint256 amount);
    
    /**
     * @dev Emitted when a parameter change is proposed
     * @param proposalId The ID of the proposal
     * @param paramName The name of the parameter
     * @param executeTime The time when the proposal can be executed
     */
    event ParameterChangeProposed(bytes32 indexed proposalId, string paramName, uint256 executeTime);
    
    /**
     * @dev Emitted when a parameter is updated
     * @param paramName The name of the parameter
     * @param value The new value
     */
    event ParameterUpdated(string paramName, uint256 value);
    
    /**
     * @dev Emitted when treasury address is updated
     * @param oldTreasury The previous treasury address
     * @param newTreasury The new treasury address
     */
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // ========== CUSTOM ERRORS ==========
    /// @dev Custom errors for gas efficiency
    error ZeroAddressNotAllowed();
    error ZeroAmountNotAllowed();
    error InsufficientBalance(uint256 available, uint256 required);
    error NotAuthorized(bytes32 role, address account);
    error InvalidUpgrade();
    error ExceedsMaxWithdrawalAmount(uint256 requested, uint256 maxAllowed);
    error ExceedsDailyWithdrawalLimit(uint256 requested, uint256 remaining);
    error TimelockNotExpired(uint256 current, uint256 required);
    error ProposalDoesNotExist(bytes32 proposalId);
    
    // ========== INITIALIZER ==========
    /**
     * @dev Prevents the implementation contract from being initialized
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract instead of a constructor
     * @param admin Address that will be granted the DEFAULT_ADMIN_ROLE
     * @param treasuryAddress Address that will hold backup funds
     */
    function initialize(address admin, address treasuryAddress) external initializer {
        if (admin == address(0)) revert ZeroAddressNotAllowed();
        if (treasuryAddress == address(0)) revert ZeroAddressNotAllowed();
        
        // Initialize parent contracts
        __ERC20_init("TDRAGO", "TDRAGO");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        // Set up treasury
        treasury = treasuryAddress;
        
        // Set default limits
        maxWithdrawalAmount = 100_000 * 10**decimals(); // 100,000 TDRAGO
        dailyWithdrawalLimit = 1_000_000 * 10**decimals(); // 1,000,000 TDRAGO
        
        // Initial roles can be granted to admin, but best practice is to separate concerns
        // and grant specific roles to appropriate addresses in a separate transaction
    }
    
    /**
     * @dev Initializes the V2 storage when upgrading
     * @param treasuryAddress Address that will hold backup funds
     */
    function initializeV2(address treasuryAddress) external reinitializer(2) onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasuryAddress == address(0)) revert ZeroAddressNotAllowed();
        
        // Set up treasury
        treasury = treasuryAddress;
        
        // Set default limits
        maxWithdrawalAmount = 100_000 * 10**decimals(); // 100,000 TDRAGO
        dailyWithdrawalLimit = 1_000_000 * 10**decimals(); // 1,000,000 TDRAGO
    }
    
    // ========== ADMIN FUNCTIONS ==========
    /**
     * @dev Pauses all token transfers and operations
     * @notice Can only be called by accounts with PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers and operations
     * @notice Can only be called by accounts with PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ========== PARAMETER MANAGEMENT ==========
    /**
     * @dev Proposes a change to the maximum withdrawal amount
     * @param newMaxAmount The new maximum withdrawal amount
     */
    function proposeMaxWithdrawalChange(uint256 newMaxAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 proposalId = keccak256(abi.encodePacked("MAX_WITHDRAWAL", block.timestamp));
        
        pendingProposals[proposalId] = TimelockProposal({
            executeTime: block.timestamp + TIMELOCK_DURATION,
            value: newMaxAmount,
            addressValue: address(0),
            exists: true
        });
        
        emit ParameterChangeProposed(proposalId, "MAX_WITHDRAWAL", block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Executes a change to the maximum withdrawal amount
     * @param proposalId The ID of the proposal to execute
     */
    function executeMaxWithdrawalChange(bytes32 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TimelockProposal memory proposal = pendingProposals[proposalId];
        if (!proposal.exists) revert ProposalDoesNotExist(proposalId);
        if (block.timestamp < proposal.executeTime) revert TimelockNotExpired(block.timestamp, proposal.executeTime);
        
        maxWithdrawalAmount = proposal.value;
        delete pendingProposals[proposalId];
        
        emit ParameterUpdated("MAX_WITHDRAWAL", proposal.value);
    }
    
    /**
     * @dev Proposes a change to the daily withdrawal limit
     * @param newDailyLimit The new daily withdrawal limit
     */
    function proposeDailyLimitChange(uint256 newDailyLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 proposalId = keccak256(abi.encodePacked("DAILY_LIMIT", block.timestamp));
        
        pendingProposals[proposalId] = TimelockProposal({
            executeTime: block.timestamp + TIMELOCK_DURATION,
            value: newDailyLimit,
            addressValue: address(0),
            exists: true
        });
        
        emit ParameterChangeProposed(proposalId, "DAILY_LIMIT", block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Executes a change to the daily withdrawal limit
     * @param proposalId The ID of the proposal to execute
     */
    function executeDailyLimitChange(bytes32 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TimelockProposal memory proposal = pendingProposals[proposalId];
        if (!proposal.exists) revert ProposalDoesNotExist(proposalId);
        if (block.timestamp < proposal.executeTime) revert TimelockNotExpired(block.timestamp, proposal.executeTime);
        
        dailyWithdrawalLimit = proposal.value;
        delete pendingProposals[proposalId];
        
        emit ParameterUpdated("DAILY_LIMIT", proposal.value);
    }
    
    /**
     * @dev Proposes a change to the treasury address
     * @param newTreasury The new treasury address
     */
    function proposeTreasuryChange(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddressNotAllowed();
        
        bytes32 proposalId = keccak256(abi.encodePacked("TREASURY", block.timestamp));
        
        pendingProposals[proposalId] = TimelockProposal({
            executeTime: block.timestamp + TIMELOCK_DURATION,
            value: 0,
            addressValue: newTreasury,
            exists: true
        });
        
        emit ParameterChangeProposed(proposalId, "TREASURY", block.timestamp + TIMELOCK_DURATION);
    }
    
    /**
     * @dev Executes a change to the treasury address
     * @param proposalId The ID of the proposal to execute
     */
    function executeTreasuryChange(bytes32 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TimelockProposal memory proposal = pendingProposals[proposalId];
        if (!proposal.exists) revert ProposalDoesNotExist(proposalId);
        if (block.timestamp < proposal.executeTime) revert TimelockNotExpired(block.timestamp, proposal.executeTime);
        
        address oldTreasury = treasury;
        treasury = proposal.addressValue;
        delete pendingProposals[proposalId];
        
        emit TreasuryUpdated(oldTreasury, proposal.addressValue);
    }
    
    // ========== CORE FUNCTIONS ==========
    /**
     * @dev Mints new tokens to the specified address
     * @param to Address to receive the newly minted tokens
     * @param amount Amount of tokens to mint
     * @notice Can only be called by accounts with MINTER_ROLE
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddressNotAllowed();
        if (amount == 0) revert ZeroAmountNotAllowed();
        
        _mint(to, amount);
        emit Minted(to, amount);
    }
    
    /**
     * @dev Burns tokens from the caller's balance
     * @param amount Amount of tokens to burn
     * @notice Overrides burn from ERC20BurnableUpgradeable to add custom event
     */
    function burn(uint256 amount) public override whenNotPaused {
        if (amount == 0) revert ZeroAmountNotAllowed();
        
        super.burn(amount);
        emit Burned(_msgSender(), amount);
    }
    
    /**
     * @dev Burns tokens from a specified account (requires approval)
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @notice Can only be called by accounts with BURNER_ROLE
     */
    function burnFrom(address account, uint256 amount) public override whenNotPaused {
        if (amount == 0) revert ZeroAmountNotAllowed();
        
        if (_msgSender() != account && !hasRole(BURNER_ROLE, _msgSender())) {
            revert NotAuthorized(BURNER_ROLE, _msgSender());
        }
        
        super.burnFrom(account, amount);
        emit Burned(account, amount);
    }
    
    /**
     * @dev Gets the current day number (since Unix epoch)
     * @return The current day number
     */
    function _getCurrentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    /**
     * @dev Withdraws tokens to a player's wallet with additional safety checks
     * @param to Address of the player receiving tokens
     * @param amount Amount of tokens to withdraw
     * @notice Can only be called by accounts with WITHDRAWER_ROLE
     * @notice This function mints tokens directly to the recipient
     */
    function withdraw(address to, uint256 amount) 
        external 
        onlyRole(WITHDRAWER_ROLE) 
        whenNotPaused
        nonReentrant 
    {
        if (to == address(0)) revert ZeroAddressNotAllowed();
        if (amount == 0) revert ZeroAmountNotAllowed();
        
        // Check transaction limits
        if (amount > maxWithdrawalAmount) {
            revert ExceedsMaxWithdrawalAmount(amount, maxWithdrawalAmount);
        }
        
        // Check daily limits
        uint256 currentDay = _getCurrentDay();
        uint256 newDailyTotal = dailyWithdrawalAmount[currentDay] + amount;
        if (newDailyTotal > dailyWithdrawalLimit) {
            revert ExceedsDailyWithdrawalLimit(
                amount, 
                dailyWithdrawalLimit - dailyWithdrawalAmount[currentDay]
            );
        }
        
        // Update tracking
        dailyWithdrawalAmount[currentDay] += amount;
        addressDailyWithdrawal[to][currentDay] += amount;
        
        // Mints tokens directly to recipient
        _mint(to, amount);
        
        emit Withdrawn(to, amount);
    }
    
    /**
     * @dev Gets the remaining daily withdrawal limit
     * @return Remaining amount that can be withdrawn today
     */
    function getRemainingDailyLimit() external view returns (uint256) {
        uint256 currentDay = _getCurrentDay();
        uint256 used = dailyWithdrawalAmount[currentDay];
        
        if (used >= dailyWithdrawalLimit) {
            return 0;
        }
        
        return dailyWithdrawalLimit - used;
    }
    
    /**
     * @dev Gets the daily withdrawal amount for a specific address
     * @param account The address to check
     * @return Amount withdrawn by the account today
     */
    function getAddressDailyWithdrawal(address account) external view returns (uint256) {
        return addressDailyWithdrawal[account][_getCurrentDay()];
    }
    
    /**
     * @dev Burns tokens and mints them to the treasury
     * @param amount Amount to fund the treasury with
     * @notice Burns tokens from caller and mints to treasury
     */
    function fundTreasury(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmountNotAllowed();
        
        // Burn tokens from sender
        super.burn(amount);
        
        // Mint to treasury
        _mint(treasury, amount);
        
        emit Burned(_msgSender(), amount);
        emit Minted(treasury, amount);
    }
    
    // ========== OVERRIDE FUNCTIONS ==========
    /**
     * @dev Hook that is called before any transfer of tokens
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount of tokens being transferred
     * @notice Ensures transfers cannot occur when the contract is paused
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._update(from, to, amount);
    }
    
    /**
     * @dev Function that authorizes an upgrade to a new implementation
     * @param newImplementation Address of the new implementation contract
     * @notice Can only be called by accounts with UPGRADER_ROLE
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {
        // Additional checks for new implementation can be added here
        // No action needed for simple authorization check
    }
    
    /**
     * @dev Returns the number of decimals used for token
     * @return The number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}