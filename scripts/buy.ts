import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

async function main() {
  const { ethers } = await network.connect();

  const buyer = new ethers.Wallet(
    process.env.BUYER_PRIVATE_KEY!,
    ethers.provider
  );

  console.log("Buyer:", buyer.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS,
    buyer
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS,
    buyer
  );

  const tokenId = 1;

  const listing = await marketplace.listings(tokenId);

  console.log("\nSeller:", listing.seller);
  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );

  console.log("\nBuying Flame Dragon...");

  const tx = await marketplace.buyCard(tokenId, {
    value: listing.price
  });

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("\nFlame Dragon purchased successfully!");

  const owner = await gameCard.ownerOf(tokenId);

  console.log("New NFT owner:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});