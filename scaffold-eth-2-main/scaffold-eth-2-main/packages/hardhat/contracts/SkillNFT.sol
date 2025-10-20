// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillNFT
 * @notice Minimal ERC721 for tokenizing AI skills as NFTs with simple listing and purchase flow.
 * @dev Stores a tokenURI per token. Marketplace logic is embedded for MVP simplicity (no fees/royalties).
 */
contract SkillNFT is ERC721, Ownable {
    using Strings for uint256;

    struct SkillMeta {
        // IPFS or HTTP metadata URI for the skill
        string metadataURI;
        // Whether the skill is currently listed for sale
        bool listed;
        // Current listing price in wei (only meaningful if listed == true)
        uint256 price;
        // The original creator of the skill
        address creator;
    }

    // Incremental token id counter
    uint256 private _tokenIdCounter;

    // Per-token data
    mapping(uint256 => SkillMeta) private _skills;

    // Events for front-end consumption
    event SkillMinted(address indexed creator, uint256 indexed tokenId, string metadataURI);
    event SkillListed(address indexed owner, uint256 indexed tokenId, uint256 price);
    event SkillUnlisted(address indexed owner, uint256 indexed tokenId);
    event SkillPurchased(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);

    constructor() ERC721("MetaSkill Skill", "SKILL") Ownable(msg.sender) {}

    /**
     * @notice Mint a new Skill NFT.
     * @param to Recipient of the newly minted token (typically msg.sender)
     * @param metadataURI IPFS/HTTP URI for skill metadata (name, description, license, pointers)
     * @param initialPrice Optional initial listing price in wei. Set 0 to not list.
     * @dev If initialPrice > 0, the token is listed immediately.
     */
    function mintSkill(address to, string calldata metadataURI, uint256 initialPrice) external returns (uint256 tokenId) {
        require(bytes(metadataURI).length > 0, "Invalid metadataURI");

        tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);

        SkillMeta storage s = _skills[tokenId];
        s.metadataURI = metadataURI;
        s.creator = msg.sender;
        if (initialPrice > 0) {
            s.listed = true;
            s.price = initialPrice;
            emit SkillListed(to, tokenId, initialPrice);
        }

        emit SkillMinted(msg.sender, tokenId, metadataURI);
    }

    /**
     * @notice List a token for sale.
     */
    function listSkill(uint256 tokenId, uint256 price) external {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_, "Not owner");
        require(price > 0, "Price must be > 0");

        SkillMeta storage s = _skills[tokenId];
        s.listed = true;
        s.price = price;

        emit SkillListed(owner_, tokenId, price);
    }

    /**
     * @notice Unlist a token from sale.
     */
    function unlistSkill(uint256 tokenId) external {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_, "Not owner");
        SkillMeta storage s = _skills[tokenId];
        require(s.listed, "Not listed");
        s.listed = false;
        s.price = 0;
        emit SkillUnlisted(owner_, tokenId);
    }

    /**
     * @notice Purchase a listed skill.
     * @dev Transfers ETH to seller and token to buyer. Unlists the token. No fees.
     */
    function purchaseSkill(uint256 tokenId) external payable {
        SkillMeta storage s = _skills[tokenId];
        require(s.listed, "Not listed");
        address seller = ownerOf(tokenId);
        require(seller != address(0), "Invalid token");
        require(msg.sender != seller, "Owner cannot buy");
        uint256 price = s.price;
        require(msg.value >= price, "Insufficient payment");

        // Effects: unlist first to avoid reentrancy surface
        s.listed = false;
        s.price = 0;

        // Interactions
        _safeTransfer(seller, msg.sender, tokenId, "");
        (bool ok, ) = payable(seller).call{value: price}("");
        require(ok, "Payout failed");

        // Refund excess if any
        if (msg.value > price) {
            (ok, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(ok, "Refund failed");
        }

        emit SkillPurchased(seller, msg.sender, tokenId, price);
    }

    /**
     * @notice Get metadata for a skill token.
     */
    function getSkill(uint256 tokenId)
        external
        view
        returns (
            string memory metadataURI,
            bool listed,
            uint256 price,
            address creator,
            address owner_
        )
    {
        address ownerAddr = ownerOf(tokenId);
        SkillMeta storage s = _skills[tokenId];
        return (s.metadataURI, s.listed, s.price, s.creator, ownerAddr);
    }

    /**
     * @dev Override tokenURI to return stored value for marketplaces.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId);
        return _skills[tokenId].metadataURI;
    }
}

