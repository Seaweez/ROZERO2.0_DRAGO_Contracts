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
 *      using the UUPS proxy pattern for future upgrades
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
    
    // ========== STORAGE V1 ==========
    // Reserved slots for future upgrades
    uint256[50] private __gap;
    
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
    
    // ========== CUSTOM ERRORS ==========
    /// @dev Custom errors for gas efficiency
    error ZeroAddressNotAllowed();
    error ZeroAmountNotAllowed();
    error InsufficientBalance(uint256 available, uint256 required);
    error NotAuthorized(bytes32 role, address account);
    error InvalidUpgrade();
    
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
     */
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert ZeroAddressNotAllowed();
        
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
        
        // Initial roles can be granted to admin, but best practice is to separate concerns
        // and grant specific roles to appropriate addresses in a separate transaction
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
     * @dev Withdraws tokens to a player's wallet 
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
        
        // Mints tokens directly to recipient
        _mint(to, amount);
        
        emit Withdrawn(to, amount);
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