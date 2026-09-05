import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const gameCardAddress =
    "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

  console.log("Deploying Marketplace...");
  console.log("GameCard:", gameCardAddress);

  const Marketplace =
    await ethers.getContractFactory("Marketplace");

  const marketplace =
    await Marketplace.deploy(gameCardAddress);

  await marketplace.waitForDeployment();

  const marketplaceAddress =
    await marketplace.getAddress();

  console.log("");
  console.log("=================================");
  console.log("Marketplace deployed successfully!");
  console.log("=================================");
  console.log("GameCard:", gameCardAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("");
  console.log(
    "Etherscan:",
    `https://sepolia.etherscan.io/address/${marketplaceAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});