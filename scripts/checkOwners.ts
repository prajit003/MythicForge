import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const GAME_CARD_ADDRESS =
    "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

  const GAME_CARD_ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)"
  ];

  const gameCard = new ethers.Contract(
    GAME_CARD_ADDRESS,
    GAME_CARD_ABI,
    ethers.provider
  );

  console.log("Checking NFT ownership...");
  console.log("");

  for (const tokenId of [3, 4]) {
    try {
      const owner = await gameCard.ownerOf(tokenId);

      console.log(
        `Card #${tokenId} owner: ${owner}`
      );
    } catch (error) {
      console.log(
        `Card #${tokenId}: could not determine owner`
      );
      console.log(error);
    }
  }

  console.log("");
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});