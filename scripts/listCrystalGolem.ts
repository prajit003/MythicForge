import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

async function main() {
  console.log("Starting Crystal Golem listing...");

  const { ethers } = await network.connect();

  const [seller] = await ethers.getSigners();

  console.log("Seller:", seller.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS,
    seller
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS,
    seller
  );

  const tokenId = 4;
  const price = ethers.parseEther("0.002");

  console.log("\nChecking NFT owner...");

  const owner = await gameCard.ownerOf(tokenId);

  console.log("NFT owner:", owner);

  if (
    owner.toLowerCase() !==
    seller.address.toLowerCase()
  ) {
    throw new Error(
      `Seller does not own Token #${tokenId}. Current owner: ${owner}`
    );
  }

  console.log("\nApproving marketplace...");

  const approveTx = await gameCard.approve(
    MARKETPLACE_ADDRESS,
    tokenId
  );

  console.log(
    "Approval transaction:",
    approveTx.hash
  );

  await approveTx.wait();

  console.log("Marketplace approved!");

  console.log("\nListing Crystal Golem...");
  console.log("Price: 0.002 ETH");

  const listTx = await marketplace.listCard(
    tokenId,
    price
  );

  console.log(
    "Listing transaction:",
    listTx.hash
  );

  await listTx.wait();

  console.log(
    "Crystal Golem listed successfully!"
  );

  const listing =
    await marketplace.listings(tokenId);

  console.log("\nListing information:");

  console.log(
    "Seller:",
    listing.seller
  );

  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );

  console.log(
    "\nMarketplace owns NFT:",
    await gameCard.ownerOf(tokenId)
  );
}

main().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exitCode = 1;
});