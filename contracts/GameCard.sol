// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract GameCard is ERC721URIStorage {

    uint256 private nextTokenId;

    struct Card {
        string name;
        string description;
        string rarity;
        uint256 attack;
        uint256 defense;
    }

    mapping(uint256 => Card) public cards;

    constructor() ERC721("MythicForge Card", "MFC") {
        nextTokenId = 1;
    }

    function mintCard(
        string memory name,
        string memory description,
        string memory rarity,
        uint256 attack,
        uint256 defense,
        string memory metadataURI
    ) public returns (uint256) {

        uint256 tokenId = nextTokenId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        cards[tokenId] = Card(
            name,
            description,
            rarity,
            attack,
            defense
        );

        nextTokenId++;

        return tokenId;
    }

    function getCard(uint256 tokenId)
        public
        view
        returns (Card memory)
    {
        require(
            ownerOf(tokenId) != address(0),
            "Card does not exist"
        );

        return cards[tokenId];
    }
}