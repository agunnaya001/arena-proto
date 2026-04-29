// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArenaMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public arenaCoin;
    IERC721 public fighterNFT;

    uint256 public constant MARKETPLACE_FEE_BPS = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public activeListingIndex; // MED-5: O(1) removal via index
    uint256[] public activeListingIds;

    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(address indexed seller, uint256 indexed tokenId);
    event PriceHistoryUpdated(uint256 indexed tokenId, uint256 newPrice, uint256 timestamp);

    constructor(
        address initialOwner,
        address _arenaCoin,
        address _fighterNFT
    ) Ownable(initialOwner) {
        require(_arenaCoin != address(0), "Invalid arenaCoin");
        require(_fighterNFT != address(0), "Invalid fighterNFT");
        arenaCoin = IERC20(_arenaCoin);
        fighterNFT = IERC721(_fighterNFT);
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(fighterNFT.ownerOf(tokenId) == msg.sender, "Not your fighter");
        require(fighterNFT.isApprovedForAll(msg.sender, address(this)) || fighterNFT.getApproved(tokenId) == address(this), "Marketplace not approved");
        require(price > 0, "Price must be > 0");
        require(!listings[tokenId].active, "Already listed");

        // Escrow pattern: Transfer NFT to marketplace for safety
        fighterNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        activeListingIndex[tokenId] = activeListingIds.length;
        activeListingIds.push(tokenId);
        
        emit NFTListed(msg.sender, tokenId, price);
        emit PriceHistoryUpdated(tokenId, price, block.timestamp);
    }

    function buyNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller != msg.sender, "Cannot buy your own listing");
        
        // MED-6: Re-check ownership at buy time
        require(fighterNFT.ownerOf(tokenId) == address(this), "NFT not in escrow");
        
        require(arenaCoin.balanceOf(msg.sender) >= listing.price, "Insufficient ARENA");

        uint256 fee = (listing.price * MARKETPLACE_FEE_BPS) / BASIS_POINTS;
        uint256 sellerAmount = listing.price - fee;

        // MED-1: Use SafeERC20 for all token transfers
        arenaCoin.safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        arenaCoin.safeTransferFrom(msg.sender, owner(), fee);

        // Transfer NFT from escrow to buyer
        fighterNFT.transferFrom(address(this), msg.sender, tokenId);

        listing.active = false;
        _removeFromActiveListings(tokenId);

        emit NFTSold(msg.sender, listing.seller, tokenId, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not your listing");
        require(listings[tokenId].active, "Not listed");

        address seller = listings[tokenId].seller;
        
        // Return NFT from escrow to seller
        fighterNFT.transferFrom(address(this), seller, tokenId);
        
        listings[tokenId].active = false;
        _removeFromActiveListings(tokenId);

        emit ListingCancelled(msg.sender, tokenId);
    }

    function getActiveListings() external view returns (uint256[] memory) {
        return activeListingIds;
    }

    // MED-5: O(1) removal instead of O(n) via swap-and-pop
    function _removeFromActiveListings(uint256 tokenId) internal {
        uint256 index = activeListingIndex[tokenId];
        uint256 lastIndex = activeListingIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = activeListingIds[lastIndex];
            activeListingIds[index] = lastTokenId;
            activeListingIndex[lastTokenId] = index;
        }

        activeListingIds.pop();
        delete activeListingIndex[tokenId];
    }
}
