import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const METADATA_URI =
  "ipfs://bafkreibzxedmicga2dnd5zqwxlbxnnutyv6ionxukv2wbw43kmx6bndasq";

async function main() {

  console.log("Starting Frost Titan mint...");

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

  console.log("\nMinting Frost Titan...");

  const tx = await gameCard.mintCard(
    "Frost Titan",
    "A colossal guardian of the frozen realms, wielding an ancient ice-forged warhammer with the power to freeze anything in its path.",
    "Epic",
    88,
    96,
    METADATA_URI
  );

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("Frost Titan minted successfully!");

  const tokenId = 7;

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