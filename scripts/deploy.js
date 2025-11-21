const hre = require("hardhat");

async function main() {
  console.log("Deploying TempestGoalGrid FHE Lottery contract...");
  console.log("Network:", hre.network.name);

  const TempestGoalGrid = await hre.ethers.getContractFactory("TempestGoalGrid");
  const lottery = await TempestGoalGrid.deploy();

  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log("✅ TempestGoalGrid deployed to:", address);

  // Read contract constants
  const minPrice = await lottery.MIN_TICKET_PRICE();
  const minDuration = await lottery.MIN_DURATION();
  const maxDuration = await lottery.MAX_DURATION();
  const maxNumber = await lottery.MAX_NUMBER();
  const tier1Share = await lottery.TIER1_SHARE();
  const tier2Share = await lottery.TIER2_SHARE();
  const tier3Share = await lottery.TIER3_SHARE();

  console.log("\n📋 Contract Configuration:");
  console.log("  MIN_TICKET_PRICE:", hre.ethers.formatEther(minPrice), "ETH");
  console.log("  MIN_DURATION:", minDuration.toString(), "seconds (", (Number(minDuration) / 60), "minutes)");
  console.log("  MAX_DURATION:", maxDuration.toString(), "seconds (", (Number(maxDuration) / 3600), "hours)");
  console.log("  MAX_NUMBER:", maxNumber.toString());

  console.log("\n🎰 Prize Distribution:");
  console.log("  Tier 1 (Exact Match):", tier1Share.toString(), "%");
  console.log("  Tier 2 (Within ±5):", tier2Share.toString(), "%");
  console.log("  Tier 3 (Within ±10):", tier3Share.toString(), "%");

  console.log("\n🔧 Update frontend/src/constants/contracts.ts with:");
  console.log(`export const TEMPEST_GOAL_GRID_ADDRESS: Address = "${address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
