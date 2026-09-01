import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

const TOKEN_ID = 1;

async function main() {
  const { ethers } = await network.connect();

  const [seller] = await ethers.getSigners();

  console.log("Seller:", seller.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS
  );

  console.log("\nGameCard:", GAME_CARD_ADDRESS);
  console.log("Marketplace:", MARKETPLACE_ADDRESS);

  // Check current owner
  const owner = await gameCard.ownerOf(TOKEN_ID);

  console.log("\nCurrent NFT owner:", owner);

  // Approve marketplace
  console.log("\nApproving marketplace...");

  const approvalTx = await gameCard.approve(
    MARKETPLACE_ADDRESS,
    TOKEN_ID
  );

  await approvalTx.wait();

  console.log("Marketplace approved!");

  // Set price
  const price = ethers.parseEther("0.01");

  console.log("\nListing Flame Dragon...");
  console.log("Price:", ethers.formatEther(price), "ETH");

  const listingTx = await marketplace.listCard(
    TOKEN_ID,
    price
  );

  await listingTx.wait();

  console.log("NFT listed successfully!");

  // Check listing
  const listing = await marketplace.listings(TOKEN_ID);

  console.log("\nListing information:");
  console.log("Seller:", listing.seller);
  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );

  // Check new owner
  const newOwner = await gameCard.ownerOf(TOKEN_ID);

  console.log("\nNFT is now held by:", newOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});