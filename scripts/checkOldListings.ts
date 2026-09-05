import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const OLD_MARKETPLACE =
    "0x09003af707554132C3760F12De1856861890F2Ac";

  const ABI = [
    "function listings(uint256 tokenId) view returns (address seller, uint256 price)"
  ];

  const marketplace = new ethers.Contract(
    OLD_MARKETPLACE,
    ABI,
    ethers.provider
  );

  for (const tokenId of [3, 4]) {
    const listing = await marketplace.listings(tokenId);

    console.log(`Card #${tokenId}`);
    console.log("Seller:", listing.seller);
    console.log(
      "Price:",
      ethers.formatEther(listing.price),
      "ETH"
    );
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});