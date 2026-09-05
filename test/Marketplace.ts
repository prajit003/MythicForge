import { expect } from "chai";
import { network } from "hardhat";

describe("Marketplace", function () {

  async function deployContracts() {
    const { ethers } = await network.connect();

    const [seller, buyer, attacker] = await ethers.getSigners();

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
      attacker,
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

    await gameCard.connect(seller).mintCard(
      "Flame Dragon",
      "A legendary fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await expect(
      marketplace.connect(seller).listCard(1, price)
    )
      .to.emit(marketplace, "CardListed")
      .withArgs(1, seller.address, price);

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);

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

    await gameCard.connect(seller).mintCard(
      "Shadow Knight",
      "A powerful knight of darkness",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    const sellerBalanceBefore =
      await ethers.provider.getBalance(seller.address);

    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: price
        }
      )
    )
      .to.emit(marketplace, "CardSold")
      .withArgs(
        1,
        seller.address,
        buyer.address,
        price
      );

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(buyer.address);

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(ethers.ZeroAddress);
    expect(listing.price).to.equal(0);

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

    await expect(
      marketplace.connect(seller).unlistCard(1)
    )
      .to.emit(marketplace, "CardUnlisted")
      .withArgs(1, seller.address);

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(seller.address);

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(ethers.ZeroAddress);
    expect(listing.price).to.equal(0);
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

    await gameCard.connect(seller).mintCard(
      "Flame Dragon",
      "A legendary fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

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

    await gameCard.connect(seller).mintCard(
      "Shadow Knight",
      "A powerful knight of darkness",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await expect(
      marketplace.connect(buyer).unlistCard(1)
    ).to.be.revertedWith("You are not the seller");
  });


  // TEST 8
  it("should reject listing with a zero price", async function () {

    const {
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    await gameCard.connect(seller).mintCard(
      "Void Assassin",
      "A deadly assassin from the void",
      "Epic",
      90,
      75,
      "ipfs://assassin"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await expect(
      marketplace.connect(seller).listCard(1, 0)
    ).to.be.revertedWith("Price must be greater than zero");
  });


  // TEST 9
  it("should keep the NFT in escrow while it is listed", async function () {

    const {
      ethers,
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    await gameCard.connect(seller).mintCard(
      "Inferno Phoenix",
      "A legendary phoenix",
      "Legendary",
      94,
      72,
      "ipfs://phoenix"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(await marketplace.getAddress());

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);
  });


  // TEST 10
  it("should transfer the NFT to the buyer after purchase", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.02");

    await gameCard.connect(seller).mintCard(
      "Frost Titan",
      "A colossal guardian of the frozen realms",
      "Epic",
      88,
      96,
      "ipfs://frost"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await marketplace.connect(buyer).buyCard(
      1,
      {
        value: price
      }
    );

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(buyer.address);
  });


  // TEST 11
  it("should return the NFT to the seller after cancellation", async function () {

    const {
      ethers,
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.03");

    await gameCard.connect(seller).mintCard(
      "Thunder Beast",
      "A fearsome beast charged with storm power",
      "Rare",
      92,
      78,
      "ipfs://thunder"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(await marketplace.getAddress());

    await marketplace.connect(seller).unlistCard(1);

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(seller.address);
  });


  // TEST 12
  it("should remove the listing after a successful purchase", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.04");

    await gameCard.connect(seller).mintCard(
      "Blood Moon Samurai",
      "A deadly warrior powered by the crimson moon",
      "Epic",
      95,
      82,
      "ipfs://samurai"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await marketplace.connect(buyer).buyCard(
      1,
      {
        value: price
      }
    );

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(ethers.ZeroAddress);
    expect(listing.price).to.equal(0);
  });


  // TEST 13
  it("should prevent the seller from buying their own card", async function () {

    const {
      ethers,
      seller,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    await gameCard.connect(seller).mintCard(
      "Emerald Guardian",
      "An ancient guardian of nature",
      "Legendary",
      84,
      97,
      "ipfs://emerald"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await expect(
      marketplace.connect(seller).buyCard(
        1,
        {
          value: price
        }
      )
    ).to.be.revert(ethers);
  });


  // TEST 14
  it("should keep the listing active after an incorrect payment", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");
    const wrongPrice = ethers.parseEther("0.01");

    await gameCard.connect(seller).mintCard(
      "Flame Dragon",
      "A legendary fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: wrongPrice
        }
      )
    ).to.be.revertedWith("Incorrect payment");

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(await marketplace.getAddress());
  });


  // TEST 15
  it("should not allow a cancelled listing to be purchased", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

    await gameCard.connect(seller).mintCard(
      "Shadow Knight",
      "A powerful knight of darkness",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await marketplace.connect(seller).unlistCard(1);

    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: price
        }
      )
    ).to.be.revertedWith("Card is not listed");

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(seller.address);
  });


  // TEST 16
  it("should not allow a sold NFT to be purchased again", async function () {

    const {
      ethers,
      seller,
      buyer,
      attacker,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.05");

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

    await marketplace.connect(buyer).buyCard(
      1,
      {
        value: price
      }
    );

    await expect(
      marketplace.connect(attacker).buyCard(
        1,
        {
          value: price
        }
      )
    ).to.be.revertedWith("Card is not listed");

    expect(
      await gameCard.ownerOf(1)
    ).to.equal(buyer.address);
  });


  // TEST 17
  it("should preserve the listing after an unsuccessful purchase", async function () {

    const {
      ethers,
      seller,
      buyer,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.08");
    const wrongPrice = ethers.parseEther("0.02");

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

    await expect(
      marketplace.connect(buyer).buyCard(
        1,
        {
          value: wrongPrice
        }
      )
    ).to.be.revertedWith("Incorrect payment");

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);
  });


  // TEST 18
  it("should prevent an attacker from cancelling an active listing", async function () {

    const {
      ethers,
      seller,
      attacker,
      gameCard,
      marketplace
    } = await deployContracts();

    const price = ethers.parseEther("0.06");

    await gameCard.connect(seller).mintCard(
      "Void Assassin",
      "A deadly assassin from the void",
      "Epic",
      90,
      75,
      "ipfs://assassin"
    );

    await gameCard.connect(seller).approve(
      await marketplace.getAddress(),
      1
    );

    await marketplace.connect(seller).listCard(
      1,
      price
    );

    await expect(
      marketplace.connect(attacker).unlistCard(1)
    ).to.be.revertedWith("You are not the seller");

    const listing = await marketplace.listings(1);

    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(price);
  });

});