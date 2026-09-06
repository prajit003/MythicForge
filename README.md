# MythicForge

## Decentralized Game Card NFT Marketplace

MythicForge is a decentralized marketplace for collecting, trading, and owning unique blockchain-based game cards.

Each game card is represented as an ERC-721 NFT with a unique token ID. Card artwork and metadata are stored on IPFS, while ownership, card information, listings, purchases, and transfers are handled through Ethereum smart contracts.

The project is deployed on the Ethereum Sepolia Testnet.

---

## Live Demo

Live Application:

https://mythic-forge1.vercel.app/

GitHub Repository:

https://github.com/prajit003/MythicForge

---

## Features

### NFT Game Cards

- Mint unique game cards as ERC-721 NFTs
- Every card receives a unique token ID
- Each card contains:
  - Name
  - Description
  - Rarity
  - Attack
  - Defense
  - Additional attributes
- Artwork and metadata are stored on IPFS

### Decentralized Marketplace

Users can:

- List cards for sale
- Set prices in ETH
- Purchase listed cards
- Cancel active listings
- Transfer NFT ownership
- View cards available in the marketplace

### Web3 Wallet

- Connect MetaMask
- Connect to Ethereum Sepolia
- View connected wallet
- View NFTs owned by the connected wallet
- Perform blockchain transactions directly from the frontend

### Marketplace Discovery

- NFT card gallery
- Search cards by name
- Filter by rarity
- Sort cards
- View detailed card information
- Display token IDs
- Display listing prices
- View ownership status

### Collection Dashboard

The collection section provides:

- Owned NFT count
- Collection overview
- Collection value
- Rarity distribution
- Owned cards

### IPFS Storage

IPFS is used to store:

- NFT artwork
- NFT metadata

The NFT stores an IPFS metadata URI, allowing the blockchain asset to reference decentralized media.

---

## Architecture

```text
                     MetaMask
                    Web3 Wallet
                         |
                         v
                React + TypeScript
                     Frontend
                         |
              +----------+----------+
              |                     |
              v                     v
        GameCard Contract     Marketplace Contract
             ERC-721                 |
              |                      |
              +----------+-----------+
                         |
                         v
                Ethereum Sepolia
                     Testnet
                         |
                         v
                       IPFS
                Artwork + Metadata
---

Blockchain
Property	Value
Network	Ethereum Sepolia Testnet
Chain ID	11155111
NFT Standard	ERC-721
Currency	Sepolia ETH
Smart Contract Language	Solidity
Smart Contracts
GameCard Contract

The GameCard contract implements ERC-721 NFTs using OpenZeppelin's ERC721URIStorage.

Contract Address:

0x2e05C142d522c7b6912017c45b068aE5e064bDb9

Explorer:

https://sepolia.etherscan.io/address/0x2e05C142d522c7b6912017c45b068aE5e064bDb9

The GameCard contract handles:

NFT minting
Unique token IDs
NFT ownership
Token metadata URI
Game card information

Essential card information stored on-chain includes:

Name
Description
Rarity
Attack
Defense
Marketplace Contract

The Marketplace contract provides decentralized trading functionality for MythicForge NFTs.

Contract Address:

0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5

Verified Contract:

https://eth-sepolia.blockscout.com/address/0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5#code

Marketplace flow:

Seller
  |
  v
List NFT
  |
  v
NFT transferred to Marketplace escrow
  |
  v
Buyer sends exact ETH price
  |
  v
NFT transferred to Buyer
  |
  v
Seller receives payment

Cancellation flow:

Listed NFT
    |
    v
Seller cancels listing
    |
    v
NFT returned to Seller
Game Cards

MythicForge currently features 10 unique game cards:

Token ID	Card
#1	Flame Dragon
#2	Shadow Knight
#3	Storm Mage
#4	Crystal Golem
#5	Void Assassin
#6	Inferno Phoenix
#7	Frost Titan
#8	Thunder Beast
#9	Blood Moon Samurai
#10	Emerald Guardian
IPFS Implementation

MythicForge uses IPFS for decentralized NFT media storage.

The blockchain stores NFT ownership and the metadata URI, while IPFS stores the artwork and rich metadata.

NFT
 |
 +-- Metadata URI
        |
        +-- IPFS
             |
             +-- Card Image
             +-- Description
             +-- Rarity
             +-- Attributes

Example metadata URI:

ipfs://<metadata-CID>

Example metadata structure:

{
  "name": "Flame Dragon",
  "description": "A legendary dragon forged in eternal flame.",
  "image": "ipfs://<image-CID>",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Attack",
      "value": 95
    },
    {
      "trait_type": "Defense",
      "value": 82
    }
  ]
}

This approach keeps large media files off-chain while maintaining decentralized references to NFT assets.

Tech Stack
Frontend
React
TypeScript
Vite
CSS
ethers.js
Blockchain
Solidity
Ethereum
Ethereum Sepolia Testnet
ERC-721
OpenZeppelin Contracts
Decentralized Storage
IPFS
Development and Testing
Hardhat
Mocha
Chai
TypeScript
Wallet
MetaMask
Deployment
Vercel
Project Structure
MythicForge/
|
├── contracts/
│   ├── GameCard.sol
│   └── Marketplace.sol
|
├── test/
│   ├── GameCard.ts
│   └── Marketplace.ts
|
├── scripts/
│   ├── checkOldListings.ts
│   ├── checkOwners.ts
│   └── unlistOldMarketplace.ts
|
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── ...
│   |
│   ├── package.json
│   └── vite.config.ts
|
├── docs/
│   └── screenshots/
│       ├── blockchain-transaction.png
│       ├── buy-transaction-request.png
│       ├── card-details.png
│       ├── collection-dashboard.png
│       ├── homepage.png
│       ├── marketplace.png
│       ├── nft-approval.png
│       ├── recent-activity.png
│       ├── sell-price.png
│       ├── transaction-failed.png
│       └── transaction-submitted.png
|
├── ignition/
│   └── modules/
|
├── hardhat.config.ts
├── package.json
└── README.md
Installation
Prerequisites

Install the following:

Node.js
npm
Git
MetaMask

For blockchain transactions, connect MetaMask to the Ethereum Sepolia Testnet and use Sepolia ETH.

Clone the Repository
git clone https://github.com/prajit003/MythicForge.git
cd MythicForge
Install Blockchain Dependencies
npm install
Running Smart Contract Tests

Run:

npx hardhat test

Current test result:

25 passing

The test suite covers:

NFT minting
Unique token IDs
NFT ownership
Marketplace listing
NFT escrow
NFT purchases
Payment validation
Listing cancellation
Ownership validation
NFT transfers
Listing cleanup
Seller restrictions
Marketplace security cases
Running the Frontend

Navigate to the frontend directory:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The application will normally be available at:

http://localhost:5173
Production Build

Run:

npm run build

The production build is generated in:

frontend/dist
Security

The marketplace contract includes several protections.

Reentrancy Protection

Purchase transactions use OpenZeppelin's ReentrancyGuard.

Ownership Validation

Only the current NFT owner can list a card.

Price Validation

Listings must have a price greater than zero.

Exact Payment

Buyers must send exactly the listed ETH amount.

Seller Protection

A seller cannot purchase their own listing.

Listing Authorization

Only the seller who created a listing can cancel it.

Listing Cleanup

Listings are removed after successful purchases or cancellations.

Testing

MythicForge currently has:

25 passing tests

The tests cover both the GameCard NFT contract and Marketplace contract.

Marketplace test coverage includes:

List NFT
Buy NFT
Cancel Listing
Incorrect Payment
Non-owner Listing
Unlisted NFT Purchase
Unauthorized Cancellation
Zero Price Rejection
NFT Escrow
NFT Transfer
Listing Removal
Seller Cannot Buy Own NFT
Failed Purchase Handling
Cancelled Listing Protection
Sold NFT Protection
Unauthorized Access Protection
Problem Statement

Traditional digital game items are commonly controlled by centralized platforms.

Users may not have transparent ownership of their digital assets, and transactions often depend on centralized marketplace infrastructure.

MythicForge explores a decentralized approach using blockchain NFTs.

Game Card
    |
    v
ERC-721 NFT
    |
    v
Blockchain Ownership
    |
    v
IPFS Artwork + Metadata
    |
    v
Decentralized Marketplace
    |
    v
Blockchain-Based Trading

The goal is to provide transparent digital ownership and peer-to-peer trading of unique game cards.

## Screenshots

The following screenshots demonstrate the main features and blockchain interactions of MythicForge on the Ethereum Sepolia Testnet.

### 1. Homepage

The MythicForge homepage with MetaMask connected to the Ethereum Sepolia Testnet.

![MythicForge Homepage](./docs/screenshots/homepage.png)

### 2. Marketplace

The marketplace displays available NFT game cards along with their rarity, attack, defense, price, and purchase options.

![MythicForge Marketplace](./docs/screenshots/marketplace.png)

### 3. NFT Card Details

Detailed view of an NFT game card showing its token ID, attributes, current owner, marketplace status, price, and purchase option.

![NFT Card Details](./docs/screenshots/card-details.png)

### 4. Transaction Failed

The frontend displays an error message when a blockchain transaction fails or is rejected.

![Transaction Failed](./docs/screenshots/transaction-failed.png)

### 5. Buy Transaction Request

MetaMask transaction request for purchasing the Flame Dragon NFT using Sepolia ETH.

![Buy Transaction Request](./docs/screenshots/buy-transaction-request.png)

### 6. Transaction Submitted

The application waits for blockchain confirmation after the NFT purchase transaction is submitted through MetaMask.

![Transaction Submitted](./docs/screenshots/transaction-submitted.png)

### 7. Collection Dashboard

The My Collection dashboard displays the NFTs owned by the connected wallet along with collection statistics and rarity information.

![Collection Dashboard](./docs/screenshots/collection-dashboard.png)

### 8. Recent Marketplace Activity

The Recent Activity section demonstrates marketplace transaction activity.

![Recent Marketplace Activity](./docs/screenshots/recent-activity.png)

### 9. Blockchain Transaction Verification

A successful NFT transaction can be independently verified on the Ethereum Sepolia blockchain explorer.

![Blockchain Transaction](./docs/screenshots/blockchain-transaction.png)

### 10. Sell NFT – Set Price

NFT owners can list their cards for sale by entering a selling price in ETH.

![Set NFT Selling Price](./docs/screenshots/sell-price.png)

### 11. NFT Marketplace Approval

MetaMask requests approval before allowing the marketplace smart contract to transfer the NFT on behalf of its owner.

![NFT Marketplace Approval](./docs/screenshots/nft-approval.png)

Deployment

The frontend is deployed using Vercel.

Live Application:

https://mythic-forge1.vercel.app/

The smart contracts are deployed on the Ethereum Sepolia Testnet.

Future Improvements

Possible future enhancements include:

Creator royalties
Advanced marketplace analytics
On-chain marketplace activity indexing
NFT-to-NFT trading
Batch NFT minting
More game-card attributes
Card animations
Rarity-based visual effects
Multiple blockchain networks
Advanced transaction history
Mobile wallet optimization
Automated IPFS pinning
Marketplace statistics
User profiles
Leaderboards
Project Highlights

MythicForge combines:

React
+
Web3
+
Solidity
+
ERC-721 NFTs
+
Ethereum Sepolia
+
IPFS
+
MetaMask
+
Decentralized Marketplace

The project demonstrates the complete NFT lifecycle:

Mint
  |
  v
Store Metadata
  |
  v
Own
  |
  v
List
  |
  v
Buy
  |
  v
Transfer
Important Links

Live Application:

https://mythic-forge1.vercel.app/

GitHub Repository:

https://github.com/prajit003/MythicForge

GameCard Contract:

https://sepolia.etherscan.io/address/0x2e05C142d522c7b6912017c45b068aE5e064bDb9

Marketplace Contract:

https://eth-sepolia.blockscout.com/address/0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5#code

License

This project is created for educational and demonstration purposes.