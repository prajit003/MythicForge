import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

const TOKEN_ID = 6;

// Set the selling price here
const PRICE_ETH = "0.05";

async function main() {

  console.log("Starting Inferno Phoenix listing...");

  const { ethers } = await network.connect();

  const [account] = await ethers.getSigners();

  console.log("Seller:", account.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS,
    account
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS,
    account
  );

  console.log(
    "\nGameCard contract:",
    GAME_CARD_ADDRESS
  );

  console.log(
    "Marketplace contract:",
    MARKETPLACE_ADDRESS
  );

  console.log("\nToken ID:", TOKEN_ID);

  // Check ownership
  const owner = await gameCard.ownerOf(TOKEN_ID);

  console.log("Current owner:", owner);

  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(
      "You do not own Inferno Phoenix (#6)."
    );
  }

  // Approve marketplace
  console.log("\nApproving marketplace...");

  const approvalTx = await gameCard.approve(
    MARKETPLACE_ADDRESS,
    TOKEN_ID
  );

  console.log(
    "Approval transaction:",
    approvalTx.hash
  );

  await approvalTx.wait();

  console.log("Marketplace approved successfully!");

  // Convert ETH price to wei
  const price = ethers.parseEther(PRICE_ETH);

  // List card
  console.log(
    `\nListing Inferno Phoenix for ${PRICE_ETH} ETH...`
  );

  const tx = await marketplace.listCard(
    TOKEN_ID,
    price
  );

  console.log(
    "Listing transaction:",
    tx.hash
  );

  await tx.wait();

  console.log(
    "\nInferno Phoenix listed successfully!"
  );

  // Verify listing
  const listing = await marketplace.listings(
    TOKEN_ID
  );

  console.log("\nListing Information:");

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
    "\nInferno Phoenix (#6) is now available on the marketplace!"
  );
}

main().catch((error) => {

  console.error("\nERROR:");

  console.error(error);

  process.exitCode = 1;
});