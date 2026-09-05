import { expect } from "chai";
import { network } from "hardhat";

describe("GameCard", function () {

  async function deployGameCard() {
    const { ethers } = await network.connect();

    const GameCard = await ethers.getContractFactory("GameCard");
    const gameCard = await GameCard.deploy();

    await gameCard.waitForDeployment();

    return { gameCard, ethers };
  }

  it("should mint a card with a unique token ID", async function () {
    const { gameCard } = await deployGameCard();

    const tx = await gameCard.mintCard(
      "Flame Dragon",
      "A legendary dragon forged in eternal fire.",
      "Legendary",
      95,
      80,
      "ipfs://example-metadata"
    );

    await tx.wait();

    const owner = await gameCard.runner!.getAddress();

    expect(await gameCard.ownerOf(1)).to.equal(owner);

    const card = await gameCard.getCard(1);

    expect(card.name).to.equal("Flame Dragon");
    expect(card.description).to.equal(
      "A legendary dragon forged in eternal fire."
    );
    expect(card.rarity).to.equal("Legendary");
    expect(card.attack).to.equal(95);
    expect(card.defense).to.equal(80);
  });

  it("should give different token IDs to different cards", async function () {
    const { gameCard } = await deployGameCard();

    await gameCard.mintCard(
      "Flame Dragon",
      "Fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    await gameCard.mintCard(
      "Shadow Knight",
      "Dark warrior",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    const owner = await gameCard.runner!.getAddress();

    expect(await gameCard.ownerOf(1)).to.equal(owner);
    expect(await gameCard.ownerOf(2)).to.equal(owner);

    expect(1).to.not.equal(2);
  });

  it("should store the metadata URI correctly", async function () {
    const { gameCard } = await deployGameCard();

    const metadataURI = "ipfs://example-metadata";

    await gameCard.mintCard(
      "Flame Dragon",
      "Fire dragon",
      "Legendary",
      95,
      80,
      metadataURI
    );

    expect(await gameCard.tokenURI(1)).to.equal(metadataURI);
  });

  it("should allow the NFT owner to transfer the card", async function () {
    const { gameCard, ethers } = await deployGameCard();

    const [owner, recipient] = await ethers.getSigners();

    await gameCard.mintCard(
      "Flame Dragon",
      "Fire dragon",
      "Legendary",
      95,
      80,
      "ipfs://dragon"
    );

    expect(await gameCard.ownerOf(1)).to.equal(owner.address);

    await gameCard.transferFrom(
      owner.address,
      recipient.address,
      1
    );

    expect(await gameCard.ownerOf(1)).to.equal(recipient.address);
  });

  it("should keep card data after transferring ownership", async function () {
    const { gameCard, ethers } = await deployGameCard();

    const [owner, recipient] = await ethers.getSigners();

    await gameCard.mintCard(
      "Shadow Knight",
      "Dark warrior",
      "Epic",
      85,
      90,
      "ipfs://knight"
    );

    await gameCard.transferFrom(
      owner.address,
      recipient.address,
      1
    );

    const card = await gameCard.getCard(1);

    expect(card.name).to.equal("Shadow Knight");
    expect(card.description).to.equal("Dark warrior");
    expect(card.rarity).to.equal("Epic");
    expect(card.attack).to.equal(85);
    expect(card.defense).to.equal(90);
  });

  it("should reject access to a card that does not exist", async function () {
    const { gameCard, ethers } = await deployGameCard();

    await expect(
      gameCard.getCard(999)
    ).to.be.revert(ethers);
  });

  it("should reject ownerOf for a token that does not exist", async function () {
    const { gameCard, ethers } = await deployGameCard();

    await expect(
      gameCard.ownerOf(999)
    ).to.be.revert(ethers);
  });

});