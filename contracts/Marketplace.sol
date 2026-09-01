// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {

    IERC721 public immutable gameCard;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;

    event CardListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event CardSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    event CardUnlisted(
        uint256 indexed tokenId,
        address indexed seller
    );

    constructor(address gameCardAddress) {
        gameCard = IERC721(gameCardAddress);
    }

    function listCard(
        uint256 tokenId,
        uint256 price
    ) external {

        require(price > 0, "Price must be greater than zero");

        require(
            gameCard.ownerOf(tokenId) == msg.sender,
            "You do not own this card"
        );

        gameCard.transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price
        });

        emit CardListed(
            tokenId,
            msg.sender,
            price
        );
    }

    function buyCard(
        uint256 tokenId
    ) external payable nonReentrant {

        Listing memory listing = listings[tokenId];

        require(
            listing.seller != address(0),
            "Card is not listed"
        );

        require(
            msg.value == listing.price,
            "Incorrect payment"
        );

        delete listings[tokenId];

        gameCard.transferFrom(
            address(this),
            msg.sender,
            tokenId
        );

        (bool success, ) = payable(listing.seller).call{
            value: msg.value
        }("");

        require(
            success,
            "Payment failed"
        );

        emit CardSold(
            tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    function unlistCard(
        uint256 tokenId
    ) external {

        Listing memory listing = listings[tokenId];

        require(
            listing.seller == msg.sender,
            "You are not the seller"
        );

        delete listings[tokenId];

        gameCard.transferFrom(
            address(this),
            msg.sender,
            tokenId
        );

        emit CardUnlisted(
            tokenId,
            msg.sender
        );
    }
}