import { expect } from "chai";
import { network } from "hardhat";

describe("Marketplace", function () {

  async function deployContracts() {
    const { ethers } = await network.connect();

    const [seller, buyer] = await ethers.getSigners();

    const GameCard = await ethers.getContractFactory("GameCard");
    const gameCard = await GameCard.deploy();

    await gameCard.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(
      await gameCard.getAddress()
    );

    await marketplace.waitForDeployment();

    return {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    };
  }


  // TEST 1
  it("should allow a user to list a card", async function () {

    const {
      ethers,
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    // Mint card
    await gameCard.connect(seller).mintCard(
      "Flame Dragon",
      "A legendary fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    // Give marketplace permission to transfer NFT
    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    // List card
    await marketplace.connect(seller).listCard(
      1,
      price
    );

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);

    // Marketplace should now own the NFT
    expect(
      await gameCard.ownerOf(1)
    ).to.equal(await marketplace.getAddress());
  });


  // TEST 2
  it("should allow another user to buy a listed card", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    // Seller mints card
    await gameCard.connect(seller).mintCard(
      "Shadow Knight",
      "A powerful knight of darkness",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    // Approve marketplace
    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    // List card
    await marketplace.connect(seller).listCard(
      1,
      price
    );

    // Record seller balance before sale
    const sellerBalanceBefore =
      await ethers.provider.getBalance(seller.address);

    // Buyer purchases card
    await marketplace.connect(buyer).buyCard(
      1,
      {
        value: price
      }
    );

    // NFT now belongs to buyer
    expect(
      await gameCard.ownerOf(1)
    ).to.equal(buyer.address);

    // Listing should be removed
    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(ethers.ZeroAddress);
    expect(listing.price).to.equal(0);

    // Seller received the payment
    const sellerBalanceAfter =
      await ethers.provider.getBalance(seller.address);

    expect(sellerBalanceAfter).to.equal(
      sellerBalanceBefore + price
    );
  });


  // TEST 3
  it("should allow the seller to cancel a listing", async function () {

    const {
      ethers,
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.1");

    await gameCard.connect(seller).mintCard(
      "Storm Mage",
      "A powerful master of lightning",
      "Rare",
      70,
      60,
      "ipfs://mage"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    // Cancel listing
    await marketplace.connect(seller).unlistCard(1);

    // NFT should return to seller
    expect(
      await gameCard.ownerOf(1)
    ).to.equal(seller.address);

    // Listing should be removed
    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(ethers.ZeroAddress);
  });


  // TEST 4
  it("should reject an incorrect payment", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    await gameCard.connect(seller).mintCard(
      "Crystal Golem",
      "A powerful magical creature",
      "Rare",
      75,
      85,
      "ipfs://golem"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    // Try to pay only 0.01 ETH
    const wrongPrice = ethers.parseEther("0.01");

    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: wrongPrice
        }
      )
    ).to.be.revertedWith("Incorrect payment");
  });


  // TEST 5
  it("should reject listing by a non-owner", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    // Seller owns the card
    await gameCard.connect(seller).mintCard(
      "Flame Dragon",
      "A legendary fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    // Buyer tries to list seller's NFT
    await expect(
      marketplace.connect(buyer).listCard(
        1,
        price
      )
    ).to.be.revertedWith("You do not own this card");
  });


  // TEST 6
  it("should reject buying an unlisted card", async function () {

    const {
      ethers,
      buyer,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    // Token 1 has never been listed
    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: price
        }
      )
    ).to.be.revertedWith("Card is not listed");
  });


  // TEST 7
  it("should reject cancellation by a non-seller", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    // Seller mints card
    await gameCard.connect(seller).mintCard(
      "Shadow Knight",
      "A powerful knight of darkness",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    // Seller approves marketplace
    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    // Seller lists card
    await marketplace.connect(seller).listCard(
      1,
      price
    );

    // Buyer tries to cancel seller's listing
    await expect(
      marketplace.connect(buyer).unlistCard(1)
    ).to.be.revertedWith("You are not the seller");
  });

});