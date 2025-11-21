const hre = require("hardhat");

const CONTRACT_ADDRESS = process.env.TEMPEST_LOTTERY_ADDRESS || "0x495EE44e3502c3896F962A759dd268E86e312C78";

async function main() {
  console.log("Seeding TempestGoalGrid with lottery rounds...");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Network:", hre.network.name);

  const TempestGoalGrid = await hre.ethers.getContractFactory("TempestGoalGrid");
  const lottery = TempestGoalGrid.attach(CONTRACT_ADDRESS);

  // Round configurations
  const rounds = [
    {
      roundId: "LOTTERY-2024-001",
      ticketPrice: hre.ethers.parseEther("0.001"),  // 0.001 ETH
      duration: 2 * 60 * 60,  // 2 hours
    },
    {
      roundId: "LOTTERY-2024-002",
      ticketPrice: hre.ethers.parseEther("0.0005"),  // 0.0005 ETH
      duration: 4 * 60 * 60,  // 4 hours
    },
    {
      roundId: "LUCKY-DRAW-001",
      ticketPrice: hre.ethers.parseEther("0.002"),  // 0.002 ETH
      duration: 24 * 60 * 60,  // 24 hours
    },
  ];

  console.log("\n📝 Creating lottery rounds...\n");

  for (const round of rounds) {
    try {
      // Check if round already exists
      try {
        const existing = await lottery.getRound(round.roundId);
        if (existing.exists) {
          console.log(`⚠️  Round ${round.roundId} already exists, skipping...`);
          continue;
        }
      } catch (e) {
        // Round doesn't exist, continue creating
      }

      console.log(`Creating round: ${round.roundId}`);
      console.log(`  - Ticket Price: ${hre.ethers.formatEther(round.ticketPrice)} ETH`);
      console.log(`  - Duration: ${round.duration / 3600} hours`);

      const tx = await lottery.createRound(
        round.roundId,
        round.ticketPrice,
        round.duration
      );
      await tx.wait();

      console.log(`  ✅ Created! TX: ${tx.hash}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${round.roundId}:`, error.message, "\n");
    }
  }

  // Verify created rounds
  console.log("\n📊 Verifying created rounds...\n");

  const allRoundIds = await lottery.listRoundIds();
  console.log("Total rounds:", allRoundIds.length);

  for (const roundId of allRoundIds) {
    const roundInfo = await lottery.getRound(roundId);
    const status = await lottery.getRoundStatus(roundId);
    const statusMap = ["NotFound", "Active", "Ended", "Settled", "Cancelled"];

    console.log(`\n🎰 ${roundId}`);
    console.log(`  Status: ${statusMap[status]}`);
    console.log(`  Ticket Price: ${hre.ethers.formatEther(roundInfo.ticketPrice)} ETH`);
    console.log(`  Prize Pool: ${hre.ethers.formatEther(roundInfo.prizePool)} ETH`);
    console.log(`  Participants: ${roundInfo.ticketCount}`);
    console.log(`  End Time: ${new Date(Number(roundInfo.endTime) * 1000).toLocaleString()}`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
