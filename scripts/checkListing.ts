import { network } from "hardhat";

const MARKETPLACE_ADDRESS =
  "0x09003af707554132C3760F12De1856861890F2Ac";

async function main() {
  const { ethers } = await network.connect();

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS
  );

  const tokenId = 1;

  const listing = await marketplace.listings(tokenId);

  console.log("Seller:", listing.seller);
  console.log(
    "Price:",
    ethers.formatEther(listing.price),
    "ETH"
  );

  if (listing.seller === ethers.ZeroAddress) {
    console.log("NFT is NOT listed.");
  } else {
    console.log("NFT is currently LISTED.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});