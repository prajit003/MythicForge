import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const METADATA_URI =
  "ipfs://bafkreiffufwq762mkfcyukfdifapghxxmdcmy2rt7ryxam2jbqv3jl6uxm";

async function main() {
  const { ethers } = await network.connect();

  const [account] = await ethers.getSigners();

  console.log("Wallet:", account.address);

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS
  );

  console.log("\nGameCard contract:", GAME_CARD_ADDRESS);

  console.log("\nMinting Flame Dragon...");

  const tx = await gameCard.mintCard(
    "Flame Dragon",
    "A legendary dragon forged in eternal fire.",
    "Legendary",
    95,
    80,
    METADATA_URI
  );

  await tx.wait();

  console.log("Card minted successfully!");

  const tokenId = 1;

  console.log("\nToken ID:", tokenId);

  const owner = await gameCard.ownerOf(tokenId);

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
  console.error(error);
  process.exitCode = 1;
});