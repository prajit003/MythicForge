import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const OLD_MARKETPLACE =
    "0x09003af707554132C3760F12De1856861890F2Ac";

  const expectedSeller =
    "0xB5A3b0914685A20be6954a3F2af8fd494208b6aa";

  const tokenIds = [3, 4];

  const marketplaceAbi = [
    "function listings(uint256 tokenId) view returns (address seller, uint256 price)",
    "function unlistCard(uint256 tokenId)"
  ];

  const [signer] = await ethers.getSigners();

  const signerAddress = await signer.getAddress();

  console.log("Connected wallet:", signerAddress);
  console.log("Expected seller:", expectedSeller);
  console.log("Old Marketplace:", OLD_MARKETPLACE);
  console.log("");

  if (
    signerAddress.toLowerCase() !==
    expectedSeller.toLowerCase()
  ) {
    throw new Error(
      "Wrong wallet! Please use the wallet that originally listed cards #3 and #4."
    );
  }

  const marketplace = new ethers.Contract(
    OLD_MARKETPLACE,
    marketplaceAbi,
    signer
  );

  for (const tokenId of tokenIds) {
    console.log(`Checking Card #${tokenId}...`);

    const listing = await marketplace.listings(tokenId);

    console.log("Seller:", listing.seller);
    console.log(
      "Price:",
      ethers.formatEther(listing.price),
      "ETH"
    );

    if (
      listing.seller.toLowerCase() ===
      ethers.ZeroAddress.toLowerCase()
    ) {
      console.log(`Card #${tokenId} is not listed.`);
      console.log("");
      continue;
    }

    if (
      listing.seller.toLowerCase() !==
      signerAddress.toLowerCase()
    ) {
      console.log(
        `Skipping Card #${tokenId}: you are not the seller.`
      );
      console.log("");
      continue;
    }

    console.log(`Unlisting Card #${tokenId}...`);

    const tx = await marketplace.unlistCard(tokenId);

    console.log("Transaction:", tx.hash);

    await tx.wait();

    console.log(
      `Card #${tokenId} successfully returned to your wallet.`
    );
    console.log("");
  }

  console.log("=================================");
  console.log("Old marketplace migration complete!");
  console.log("=================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});