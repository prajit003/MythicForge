import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const METADATA_URI =
  "ipfs://bafkreibvexsi64bcv5lw5neqndaajgepqgtqa24dniw56qrgyv4ygsqfq4";

async function main() {
  console.log("Starting Storm Mage mint...");

  const { ethers } = await network.connect();

  const [account] = await ethers.getSigners();

  console.log("Minter:", account.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS,
    account
  );

  console.log(
    "\nGameCard contract:",
    GAME_CARD_ADDRESS
  );

  console.log("\nMinting Storm Mage...");

  const tx = await gameCard.mintCard(
    "Storm Mage",
    "A powerful mage who commands lightning and devastating storms.",
    "Rare",
    75,
    70,
    METADATA_URI
  );

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("Storm Mage minted successfully!");

  const tokenId = 3;

  const owner = await gameCard.ownerOf(tokenId);

  console.log("\nToken ID:", tokenId);
  console.log("Owner:", owner);

  const card = await gameCard.getCard(tokenId);

  console.log("\nCard Information:");
  console.log("Name:", card.name);
  console.log("Description:", card.description);
  console.log("Rarity:", card.rarity);
  console.log("Attack:", card.attack.toString());
  console.log("Defense:", card.defense.toString());

  const tokenURI = await gameCard.tokenURI(tokenId);

  console.log("\nMetadata URI:");
  console.log(tokenURI);
}

main().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exitCode = 1;
}); 