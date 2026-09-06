MythicForge

MythicForge is a decentralized NFT marketplace for unique digital game cards built on the Ethereum Sepolia Testnet.

The platform allows users to mint unique game cards, store artwork and metadata on IPFS, list NFTs for sale, purchase NFTs from other users, and view their NFT collection through a modern Web3 interface.

Project Overview

MythicForge combines blockchain technology, NFTs, IPFS, and Web3 wallet integration to create a decentralized game-card marketplace.

Each game card is represented by a unique ERC-721 NFT with its own token ID. Important game-card information such as name, description, rarity, attack, and defense is stored through the GameCard smart contract, while artwork and rich metadata are stored on IPFS.

The Marketplace smart contract enables decentralized peer-to-peer trading using Sepolia ETH.

The project demonstrates how blockchain technology can provide transparent digital ownership and decentralized trading of unique digital game assets.

Live Demo

MythicForge Live Demo

Features
NFT Game Cards
Mint unique ERC-721 game cards
Every card receives a unique token ID
Ten unique game cards are currently included
Each card includes:
Name
Description
Rarity
Attack
Defense
Element
Speed
Magic
Artwork
IPFS Storage
NFT artwork is stored on IPFS
NFT metadata is stored on IPFS
Metadata is connected to NFTs through the token URI
Decentralized storage removes dependence on a centralized image server
Decentralized Marketplace
List owned NFTs for sale
Set a price in Sepolia ETH
Purchase NFTs from other users
Cancel active listings
NFT ownership is transferred through the blockchain
Marketplace listings are stored on-chain
Listed NFTs are held in marketplace escrow
Wallet Integration
MetaMask wallet connection
Ethereum Sepolia Testnet support
Wallet-specific NFT collection
Blockchain transactions confirmed through MetaMask
Marketplace Gallery
Browse available game cards
View card rarity
View attack and defense statistics
View card prices
Open detailed NFT information
Purchase listed NFTs
Collection Dashboard
View NFTs owned by the connected wallet
Display collection statistics
View rarity information
Open individual NFT details
Transaction Feedback

The application provides feedback during blockchain interactions, including:

Transaction requests
Transaction submission
Transaction confirmation
Transaction failure
Wallet rejection
Architecture

MythicForge consists of a React frontend, MetaMask wallet, Ethereum Sepolia smart contracts, and IPFS decentralized storage.

Application Flow
User
  |
  v
MythicForge Frontend
  |
  +--------------------+
  |                    |
  v                    v
MetaMask              IPFS
  |                    |
  v                    +--> Artwork
Ethereum Sepolia       |
  |                    +--> Metadata
  |
  +-------------------------+
  |                         |
  v                         v
GameCard.sol          Marketplace.sol
  |                         |
  v                         v
ERC-721 NFTs            NFT Trading
NFT Lifecycle
Mint NFT
   |
   v
Store Artwork + Metadata on IPFS
   |
   v
Store Metadata URI in NFT
   |
   v
NFT Owned by User
   |
   v
Approve Marketplace
   |
   v
List NFT
   |
   v
NFT Held in Marketplace Escrow
   |
   v
Buyer Purchases NFT
   |
   v
NFT Transferred to Buyer
Blockchain
Property	Value
Network	Ethereum Sepolia Testnet
Chain ID	11155111
NFT Standard	ERC-721
Currency	Sepolia ETH
Smart Contract Language	Solidity
Wallet	MetaMask
Smart Contracts
GameCard Contract

The GameCard contract implements ERC-721 NFTs using OpenZeppelin's ERC721URIStorage.

Contract Address

0x2e05C142d522c7b6912017c45b068aE5e064bDb9

View GameCard Contract on Sepolia Etherscan

The GameCard contract handles:

NFT minting
Unique token IDs
NFT ownership
Token metadata URI
Game-card information

Essential card information stored on-chain includes:

Name
Description
Rarity
Attack
Defense
Marketplace Contract

The Marketplace contract provides decentralized trading functionality for MythicForge NFTs.

Contract Address

0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5

View Marketplace Contract on Blockscout

The Marketplace contract handles:

NFT listing
NFT pricing
NFT purchasing
Listing cancellation
NFT escrow
NFT transfers
Seller payments
Ownership validation
Payment validation
Unauthorized access protection
Reentrancy protection

When an NFT is listed, ownership is transferred to the Marketplace contract as escrow. The NFT remains there until it is purchased or the listing is cancelled.

Marketplace Operations

The Marketplace contract exposes the following main operations:

listCard()
buyCard()
unlistCard()

The contract emits the following events:

CardListed
CardSold
CardUnlisted

These events provide an on-chain record of marketplace operations.

Game Cards

MythicForge currently contains ten unique game cards.

Token ID	Card Name	Rarity
#1	Flame Dragon	Legendary
#2	Shadow Knight	Epic
#3	Storm Mage	Rare
#4	Crystal Golem	Epic
#5	Void Assassin	Legendary
#6	Inferno Phoenix	Legendary
#7	Frost Titan	Epic
#8	Thunder Beast	Rare
#9	Blood Moon Samurai	Legendary
#10	Emerald Guardian	Epic

Each card has its own artwork and IPFS metadata.

IPFS Implementation

MythicForge uses IPFS for decentralized NFT artwork and metadata storage.

The storage flow is:

NFT metadata contains information such as:

Card name
Description
Image
Rarity
Attack
Defense
Element
Speed
Magic

Example metadata URI:

ipfs://<metadata-cid>

The NFT stores the IPFS metadata URI through the ERC-721 token URI mechanism.

This separates blockchain ownership from decentralized asset storage:

Blockchain
    |
    +--> NFT Ownership
    +--> Token ID
    +--> Core Card Attributes
    +--> Metadata URI
                         |
                         v
                       IPFS
                         |
                         +--> Artwork
                         +--> Rich Metadata
Tech Stack
Frontend
React
TypeScript
Vite
CSS
ethers.js
Blockchain
Solidity
Ethereum Sepolia Testnet
ERC-721
OpenZeppelin Contracts
Hardhat
Wallet
MetaMask
Decentralized Storage
IPFS
Testing
Hardhat
Mocha
Chai
Deployment
Vercel
Development Tools
Node.js
npm
Git
GitHub
Project Structure
MythicForge/
|
├── contracts/
│   ├── GameCard.sol
│   └── Marketplace.sol
|
├── test/
│   └── Marketplace.js
|
├── scripts/
│   └── deploy.js
|
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
|
├── docs/
│   └── screenshots/
│       ├── homepage.png
│       ├── marketplace.png
│       ├── card-details.png
│       ├── transaction-failed.png
│       ├── buy-transaction-request.png
│       ├── transaction-submitted.png
│       ├── collection-dashboard.png
│       ├── recent-activity.png
│       ├── blockchain-transaction.png
│       ├── sell-price.png
│       └── nft-approval.png
|
├── hardhat.config.js
├── package.json
├── README.md
└── .gitignore
Installation
Prerequisites

Install the following before running the project:

Node.js
npm
Git
MetaMask

Make sure MetaMask is configured for the Ethereum Sepolia Testnet.

Clone the Repository
git clone https://github.com/prajit003/MythicForge.git
cd MythicForge
Install Blockchain Dependencies
npm install
Install Frontend Dependencies
cd frontend
npm install
Running the Frontend

From the frontend directory:

npm run dev

The Vite development server will normally be available at:

http://localhost:5173

Open the URL in a browser with MetaMask installed.

Connecting MetaMask
Install MetaMask.
Create or import a wallet.
Enable the Ethereum Sepolia Test Network.
Switch MetaMask to Sepolia.
Open the MythicForge application.
Connect the wallet.
Approve the connection request.

Sepolia ETH is required for blockchain transactions.

Using the Marketplace
Browse Cards

Open the Marketplace section to view available NFT game cards.

Each card displays information such as:

Card name
Token ID
Rarity
Attack
Defense
Price
View Card Details

Click on a card to open its detailed view.

The detail view provides:

NFT artwork
Token ID
Card attributes
Owner
Marketplace status
Current price
Purchase option
Buy an NFT
Select a listed NFT.
Click the purchase option.
MetaMask opens a transaction request.
Review the transaction.
Confirm the transaction.
Wait for blockchain confirmation.
The NFT is transferred to the buyer.
Sell an NFT

NFT owners can list their NFTs for sale.

The process is:

NFT Owner
    |
    v
Set Selling Price
    |
    v
Approve Marketplace
    |
    v
List NFT
    |
    v
NFT Held by Marketplace
    |
    v
Buyer Purchases NFT
    |
    v
NFT Transferred to Buyer
Cancel a Listing

The seller can cancel an active listing.

The NFT is returned from marketplace escrow to the seller.

Tests

The project includes automated smart-contract tests using Hardhat and Mocha.

Current test result:

25 passing

The tests cover:

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
Incorrect payment handling
Unauthorized access
Cancelled listing protection
Sold NFT protection
Running Tests

From the project root:

npx hardhat test

Expected result:

25 passing
Security

The Marketplace contract includes several security checks.

Ownership Verification

Only the current NFT owner can list an NFT.

Price Validation

Listings must have a price greater than zero.

Payment Validation

The buyer must send exactly the listed ETH amount.

Seller Restriction

A seller cannot purchase their own listing.

Listing Validation

An NFT must be actively listed before it can be purchased.

Listing Authorization

Only the seller who created a listing can cancel it.

Reentrancy Protection

The purchase function uses OpenZeppelin's ReentrancyGuard to reduce the risk of reentrancy attacks.

Escrow

Listed NFTs are transferred to the Marketplace contract until they are sold or unlisted.

Testing Strategy

The smart contracts were tested against both successful and unsuccessful scenarios.

Normal Operations
    |
    +-- List NFT
    +-- Buy NFT
    +-- Cancel Listing

Invalid Operations
    |
    +-- Incorrect Payment
    +-- Zero Price
    +-- Non-owner Listing
    +-- Unauthorized Cancellation
    +-- Buying Unlisted NFT
    +-- Seller Buying Own NFT

Security
    |
    +-- Escrow Verification
    +-- Ownership Verification
    +-- Listing State
    +-- Reentrancy Protection
Frontend Build

To create a production build:

cd frontend
npm run build

The production build is generated inside:

frontend/dist/
Deployment

The frontend is deployed using Vercel.

Live Application

MythicForge

The application connects to the Ethereum Sepolia Testnet and interacts with the deployed smart contracts.

Problem Statement

Build a decentralized marketplace where users can mint, list, and buy unique digital game cards on a blockchain testnet.

The marketplace should provide:

Unique NFT game cards
Decentralized ownership
IPFS-based artwork and metadata
Wallet connectivity
NFT listing
NFT purchasing
NFT collection display
Marketplace gallery
Testnet blockchain interaction

MythicForge addresses this problem through an ERC-721 based NFT system and a decentralized marketplace smart contract deployed on Ethereum Sepolia.

Screenshots

The following screenshots demonstrate the main features and blockchain interactions of MythicForge on the Ethereum Sepolia Testnet.

1. Homepage

The MythicForge homepage with MetaMask connected to the Ethereum Sepolia Testnet.

2. Marketplace

The marketplace displays available NFT game cards along with their rarity, attack, defense, price, and purchase options.

3. NFT Card Details

Detailed view of an NFT game card showing its token ID, attributes, current owner, marketplace status, price, and purchase option.

4. Transaction Failed

The frontend displays an error message when a blockchain transaction fails or is rejected.

5. Buy Transaction Request

MetaMask transaction request for purchasing the Flame Dragon NFT using Sepolia ETH.

6. Transaction Submitted

The application waits for blockchain confirmation after the NFT purchase transaction is submitted through MetaMask.

7. Collection Dashboard

The My Collection dashboard displays the NFTs owned by the connected wallet along with collection statistics and rarity information.

8. Recent Marketplace Activity

The Recent Activity section demonstrates marketplace transaction activity.

9. Blockchain Transaction Verification

A successful NFT transaction can be independently verified on the Ethereum Sepolia blockchain explorer.

10. Sell NFT – Set Price

NFT owners can list their cards for sale by entering a selling price in ETH.

11. NFT Marketplace Approval

MetaMask requests approval before allowing the marketplace smart contract to transfer the NFT on behalf of its owner.

Deployment Information
Frontend

Deployed on Vercel:

MythicForge

Blockchain Network
Ethereum Sepolia Testnet
Chain ID: 11155111
Currency: Sepolia ETH
GameCard Contract
0x2e05C142d522c7b6912017c45b068aE5e064bDb9

GameCard Contract on Etherscan

Marketplace Contract
0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5

Marketplace Contract on Blockscout

Future Improvements

Potential future improvements include:

NFT filtering by rarity
Advanced marketplace search
Sorting by price and rarity
Marketplace activity history
Improved transaction history
Additional game-card attributes
Card battling functionality
Card upgrading and crafting
User profiles
Creator royalties
Multi-chain support
More advanced IPFS integrations
Improved mobile wallet compatibility
Project Highlights

MythicForge demonstrates practical implementation of:

Blockchain development
Solidity smart contracts
ERC-721 NFTs
NFT marketplaces
IPFS decentralized storage
MetaMask wallet integration
Ethereum Sepolia Testnet
Smart contract security
Automated contract testing
React and TypeScript frontend development
Vercel deployment
GitHub project management
Important Links
Live Demo

https://mythic-forge1.vercel.app/

GitHub Repository

https://github.com/prajit003/MythicForge

GameCard Contract

https://sepolia.etherscan.io/address/0x2e05C142d522c7b6912017c45b068aE5e064bDb9

Marketplace Contract

https://eth-sepolia.blockscout.com/address/0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5#code

License

This project is developed for educational and demonstration purposes.