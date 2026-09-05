import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

const TOKEN_ID = 10;

// Emerald Guardian listing price
const PRICE_ETH = "0.008";

async function main() {

  console.log("Starting Emerald Guardian listing...");

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

  const owner = await gameCard.ownerOf(TOKEN_ID);

  console.log("Current owner:", owner);

  if (
    owner.toLowerCase() !==
    account.address.toLowerCase()
  ) {
    throw new Error(
      "You do not own Emerald Guardian (#10)."
    );
  }

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

  console.log(
    "Marketplace approved successfully!"
  );

  const price = ethers.parseEther(PRICE_ETH);

  console.log(
    `\nListing Emerald Guardian for ${PRICE_ETH} ETH...`
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
    "\nEmerald Guardian listed successfully!"
  );

  const listing =
    await marketplace.listings(TOKEN_ID);

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
    "\nEmerald Guardian (#10) is now available on the marketplace!"
  );
}

main().catch((error) => {

  console.error("\nERROR:");

  console.error(error);

  process.exitCode = 1;
});