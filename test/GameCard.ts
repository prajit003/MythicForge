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

    expect(await gameCard.ownerOf(1))
      .to.equal((await gameCard.runner!.getAddress()));

    const card = await gameCard.getCard(1);

    expect(card.name).to.equal("Flame Dragon");
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

    expect(await gameCard.ownerOf(1))
      .to.equal(await gameCard.runner!.getAddress());

    expect(await gameCard.ownerOf(2))
      .to.equal(await gameCard.runner!.getAddress());

    expect(1).to.not.equal(2);
  });

});