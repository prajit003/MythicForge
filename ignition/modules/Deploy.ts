import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployModule = buildModule("DeployModule", (m) => {

  const gameCard = m.contract("GameCard");

  const marketplace = m.contract("Marketplace", [gameCard]);

  return {
    gameCard,
    marketplace,
  };
});

export default DeployModule;