import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

async function main() {
  const { ethers } = await network.connect();

  const [account] = await ethers.getSigners();

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS
  );

  const tokenId = 1;

  console.log("Seller:", account.address);

  // Remove current 0.01 ETH listing
  console.log("\nUnlisting Flame Dragon...");

  const unlistTx = await marketplace.unlistCard(tokenId);
  await unlistTx.wait();

  console.log("Flame Dragon unlisted!");

  // Approve marketplace
  console.log("\nApproving marketplace...");

  const approveTx = await gameCard.approve(
    MARKETPLACE_ADDRESS,
    tokenId
  );

  await approveTx.wait();

  console.log("Marketplace approved!");

  // New price: 0.003 ETH
  const newPrice = ethers.parseEther("0.003");

  console.log("\nListing Flame Dragon...");
  console.log("New price: 0.003 ETH");

  const listTx = await marketplace.listCard(
    tokenId,
    newPrice
  );

  await listTx.wait();

  console.log("Flame Dragon listed successfully!");

  const listing = await marketplace.listings(tokenId);

  console.log("\nListing information:");
  console.log("Seller:", listing.seller);
  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});