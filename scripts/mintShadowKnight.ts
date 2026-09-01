import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const METADATA_URI =
  "ipfs://bafkreid4sp6vmxhyyseozvnwrbzvozvgcfrpwgwtetmjuf35w4nur55d74";

async function main() {
  console.log("Starting Shadow Knight mint...");

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

  console.log("\nMinting Shadow Knight...");

  const tx = await gameCard.mintCard(
    "Shadow Knight",
    "An elite warrior forged in darkness, protected by enchanted shadow armor.",
    "Epic",
    85,
    90,
    METADATA_URI
  );

  console.log(
    "Transaction:",
    tx.hash
  );

  await tx.wait();

  console.log(
    "Shadow Knight minted successfully!"
  );

  // Because Flame Dragon is Token #1,
  // Shadow Knight should now be Token #2.
  const tokenId = 2;

  const owner =
    await gameCard.ownerOf(tokenId);

  console.log(
    "\nToken ID:",
    tokenId
  );

  console.log(
    "Owner:",
    owner
  );

  const card =
    await gameCard.getCard(tokenId);

  console.log("\nCard Information:");

  console.log(
    "Name:",
    card.name
  );

  console.log(
    "Description:",
    card.description
  );

  console.log(
    "Rarity:",
    card.rarity
  );

  console.log(
    "Attack:",
    card.attack.toString()
  );

  console.log(
    "Defense:",
    card.defense.toString()
  );

  const tokenURI =
    await gameCard.tokenURI(tokenId);

  console.log(
    "\nMetadata URI:"
  );

  console.log(tokenURI);
}

main().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exitCode = 1;
});