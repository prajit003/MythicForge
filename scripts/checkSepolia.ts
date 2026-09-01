import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [wallet] = await ethers.getSigners();

  console.log("Wallet:", wallet.address);

  const balance = await ethers.provider.getBalance(wallet.address);

  console.log(
    "Sepolia ETH:",
    ethers.formatEther(balance)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});