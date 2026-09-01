import { network } from "hardhat";

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

async function main() {
  const { ethers } = await network.connect();

  const gameCard = await ethers.getContractAt(
    "GameCard",
    GAME_CARD_ADDRESS
  );

  const owner = await gameCard.ownerOf(1);

  console.log("Token #1 owner:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});