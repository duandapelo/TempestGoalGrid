// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title TempestGoalGrid - FHE-Encrypted Lottery
 * @notice A decentralized lottery game using Fully Homomorphic Encryption
 * @dev Uses Zama fhEVM 0.9.1 for encrypted random number generation and ticket verification
 *
 * Game Mechanics:
 * - Players purchase tickets with encrypted lucky numbers (1-100)
 * - When a round ends, the winning number is determined by encrypted computation
 * - Winners are determined by proximity to the winning number
 * - Prize pool is distributed based on tier matching
 *
 * Privacy Features:
 * - Ticket numbers remain encrypted until settlement
 * - Individual choices are never revealed
 * - Only aggregate results are made public
 */
contract TempestGoalGrid is ZamaEthereumConfig {

    // ============ Structs ============

    struct Ticket {
        bool exists;
        bool claimed;
        euint64 encryptedNumber;  // Encrypted lucky number (1-100)
        uint256 purchaseTime;
    }

    struct Round {
        bool exists;
        string roundId;
        address creator;
        uint256 ticketPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 ticketCount;
        bool cancelled;
        bool settled;
        bool winningNumberReady;
        euint64 encryptedWinningNumber;
        uint64 revealedWinningNumber;
        uint256 tier1Winners;  // Exact match
        uint256 tier2Winners;  // Within ±5
        uint256 tier3Winners;  // Within ±10
        address[] participants;
    }

    struct RoundSnapshot {
        bool exists;
        string roundId;
        address creator;
        uint256 ticketPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 ticketCount;
        bool cancelled;
        bool settled;
        bool winningNumberReady;
        uint64 revealedWinningNumber;
        uint256 tier1Winners;
        uint256 tier2Winners;
        uint256 tier3Winners;
        bytes32 winningNumberHandle;
    }

    struct PlayerTicket {
        bool exists;
        bool claimed;
        uint256 purchaseTime;
        bytes32 numberHandle;
    }

    // ============ State Variables ============

    mapping(string => Round) private rounds;
    mapping(string => mapping(address => Ticket)) private tickets;
    string[] private roundIds;

    // ============ Constants ============

    uint256 public constant MIN_TICKET_PRICE = 0.0003 ether;
    uint256 public constant MIN_DURATION = 10 minutes;
    uint256 public constant MAX_DURATION = 72 hours;
    uint256 public constant MAX_NUMBER = 100;
    uint256 public constant MIN_NUMBER = 1;

    // Prize distribution (percentage of pool)
    uint256 public constant TIER1_SHARE = 50;  // Exact match: 50%
    uint256 public constant TIER2_SHARE = 30;  // Within ±5: 30%
    uint256 public constant TIER3_SHARE = 20;  // Within ±10: 20%

    // ============ Events ============

    event RoundCreated(
        string indexed roundId,
        uint256 ticketPrice,
        uint256 startTime,
        uint256 endTime
    );
    event TicketPurchased(
        string indexed roundId,
        address indexed player,
        uint256 ticketNumber
    );
    event WinningNumberGenerated(
        string indexed roundId
    );
    event WinningNumberRevealed(
        string indexed roundId,
        uint64 winningNumber
    );
    event RoundSettled(
        string indexed roundId,
        uint64 winningNumber,
        uint256 tier1Winners,
        uint256 tier2Winners,
        uint256 tier3Winners
    );
    event PrizeClaimed(
        string indexed roundId,
        address indexed player,
        uint256 amount,
        uint8 tier
    );
    event RefundClaimed(
        string indexed roundId,
        address indexed player,
        uint256 amount
    );
    event RoundCancelled(string indexed roundId);

    // ============ Errors ============

    error RoundExists();
    error RoundMissing();
    error InvalidPrice();
    error InvalidDuration();
    error InvalidNumber();
    error RoundNotActive();
    error RoundNotEnded();
    error AlreadyPurchased();
    error TicketMissing();
    error NotSettled();
    error AlreadyClaimed();
    error NotRefundable();
    error NotCreator();
    error AlreadySettled();
    error WinningNumberNotReady();
    error NoWinners();
    error TransferFailed();

    // ============ Round Management ============

    /**
     * @notice Create a new lottery round
     * @param roundId Unique identifier for the round
     * @param ticketPrice Price per ticket in ETH
     * @param duration Duration of the round in seconds
     */
    function createRound(
        string calldata roundId,
        uint256 ticketPrice,
        uint256 duration
    ) external {
        if (rounds[roundId].exists) revert RoundExists();
        if (ticketPrice < MIN_TICKET_PRICE) revert InvalidPrice();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();

        Round storage round = rounds[roundId];
        round.exists = true;
        round.roundId = roundId;
        round.creator = msg.sender;
        round.ticketPrice = ticketPrice;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + duration;

        // Initialize encrypted winning number to 0 (will be generated at settlement)
        round.encryptedWinningNumber = FHE.asEuint64(0);
        FHE.allowThis(round.encryptedWinningNumber);

        roundIds.push(roundId);

        emit RoundCreated(roundId, ticketPrice, round.startTime, round.endTime);
    }

    /**
     * @notice Purchase a lottery ticket with an encrypted lucky number
     * @param roundId The round to participate in
     * @param encryptedNumber The encrypted lucky number (1-100)
     * @param proof Zero-knowledge proof for the encrypted number
     */
    function purchaseTicket(
        string calldata roundId,
        externalEuint64 encryptedNumber,
        bytes calldata proof
    ) external payable {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (round.cancelled) revert RoundNotActive();
        if (block.timestamp >= round.endTime) revert RoundNotActive();
        if (msg.value != round.ticketPrice) revert InvalidPrice();

        Ticket storage ticket = tickets[roundId][msg.sender];
        if (ticket.exists) revert AlreadyPurchased();

        // Convert external encrypted number to internal
        euint64 number = FHE.fromExternal(encryptedNumber, proof);

        // Store ticket
        ticket.exists = true;
        ticket.claimed = false;
        ticket.encryptedNumber = number;
        ticket.purchaseTime = block.timestamp;
        FHE.allow(number, msg.sender);

        // Accumulate for random seed generation
        round.encryptedWinningNumber = FHE.add(round.encryptedWinningNumber, number);
        FHE.allowThis(round.encryptedWinningNumber);

        round.prizePool += msg.value;
        round.ticketCount += 1;
        round.participants.push(msg.sender);

        emit TicketPurchased(roundId, msg.sender, round.ticketCount);
    }

    // ============ Settlement ============

    /**
     * @notice Generate the winning number using FHE random number generation
     * @dev Uses FHE.randEuint8(128) to generate encrypted random number [0-127]
     *      Then normalizes to [1-100] range after decryption
     * @param roundId The round to generate winning number for
     */
    function generateWinningNumber(string calldata roundId) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (round.cancelled) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert RoundNotEnded();
        if (round.settled) revert AlreadySettled();
        if (round.ticketCount == 0) revert NoWinners();

        // Generate cryptographically secure random number using FHE
        // Use 128 as upper bound (must be power of 2) to get range [0-127]
        euint8 randomValue = FHE.randEuint8(128);

        // Convert to euint64 and add accumulated ticket numbers for additional entropy
        euint64 randomAsUint64 = FHE.asEuint64(randomValue);
        round.encryptedWinningNumber = FHE.add(round.encryptedWinningNumber, randomAsUint64);

        FHE.allowThis(round.encryptedWinningNumber);
        FHE.makePubliclyDecryptable(round.encryptedWinningNumber);

        emit WinningNumberGenerated(roundId);
    }

    /**
     * @notice Finalize winning number reveal after decryption is ready
     * @param roundId The round to reveal winning number for
     */
    function finalizeWinningNumber(string calldata roundId) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (round.settled) revert AlreadySettled();

        // Check if decryption is ready
        require(FHE.isPubliclyDecryptable(round.encryptedWinningNumber), "Decryption not ready");

        // Read the decrypted value and normalize to 1-100 range
        uint64 rawValue = uint64(uint256(FHE.toBytes32(round.encryptedWinningNumber)));
        round.revealedWinningNumber = (rawValue % uint64(MAX_NUMBER)) + 1;
        round.winningNumberReady = true;

        emit WinningNumberRevealed(roundId, round.revealedWinningNumber);
    }

    /**
     * @notice Settle the round after winning number is revealed
     * @param roundId The round to settle
     * @param playerNumbers Array of revealed player numbers (submitted off-chain)
     * @param signatures Array of decryption signatures
     */
    function settleRound(
        string calldata roundId,
        uint64[] calldata playerNumbers,
        bytes[] calldata signatures
    ) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (round.cancelled) revert RoundNotActive();
        if (!round.winningNumberReady) revert WinningNumberNotReady();
        if (round.settled) revert AlreadySettled();

        require(playerNumbers.length == round.participants.length, "Invalid player count");
        require(signatures.length == round.participants.length, "Invalid signature count");

        uint64 winningNum = round.revealedWinningNumber;

        // Count winners in each tier
        for (uint256 i = 0; i < round.participants.length; i++) {
            uint64 playerNum = playerNumbers[i];

            // Calculate distance from winning number
            uint64 distance;
            if (playerNum > winningNum) {
                distance = playerNum - winningNum;
            } else {
                distance = winningNum - playerNum;
            }

            // Categorize by tier
            if (distance == 0) {
                round.tier1Winners += 1;
            } else if (distance <= 5) {
                round.tier2Winners += 1;
            } else if (distance <= 10) {
                round.tier3Winners += 1;
            }
        }

        round.settled = true;

        emit RoundSettled(
            roundId,
            winningNum,
            round.tier1Winners,
            round.tier2Winners,
            round.tier3Winners
        );
    }

    /**
     * @notice Cancel a round (only by creator, before settlement)
     * @param roundId The round to cancel
     */
    function cancelRound(string calldata roundId) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (round.creator != msg.sender) revert NotCreator();
        if (round.settled) revert AlreadySettled();

        round.cancelled = true;

        emit RoundCancelled(roundId);
    }

    // ============ Claims ============

    /**
     * @notice Claim prize for a winning ticket
     * @param roundId The round to claim from
     * @param playerNumber The revealed player number
     * @param tier The winning tier (1, 2, or 3)
     */
    function claimPrize(
        string calldata roundId,
        uint64 playerNumber,
        uint8 tier
    ) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (!round.settled || round.cancelled) revert NotSettled();

        Ticket storage ticket = tickets[roundId][msg.sender];
        if (!ticket.exists) revert TicketMissing();
        if (ticket.claimed) revert AlreadyClaimed();

        uint64 winningNum = round.revealedWinningNumber;
        uint64 distance;
        if (playerNumber > winningNum) {
            distance = playerNumber - winningNum;
        } else {
            distance = winningNum - playerNumber;
        }

        uint256 payout = 0;

        // Verify tier and calculate payout
        if (tier == 1 && distance == 0 && round.tier1Winners > 0) {
            payout = (round.prizePool * TIER1_SHARE) / 100 / round.tier1Winners;
        } else if (tier == 2 && distance > 0 && distance <= 5 && round.tier2Winners > 0) {
            payout = (round.prizePool * TIER2_SHARE) / 100 / round.tier2Winners;
        } else if (tier == 3 && distance > 5 && distance <= 10 && round.tier3Winners > 0) {
            payout = (round.prizePool * TIER3_SHARE) / 100 / round.tier3Winners;
        } else {
            revert NoWinners();
        }

        ticket.claimed = true;

        (bool success, ) = payable(msg.sender).call{ value: payout }("");
        if (!success) revert TransferFailed();

        emit PrizeClaimed(roundId, msg.sender, payout, tier);
    }

    /**
     * @notice Claim refund for cancelled round
     * @param roundId The round to claim refund from
     */
    function claimRefund(string calldata roundId) external {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        if (!round.cancelled) revert NotRefundable();

        Ticket storage ticket = tickets[roundId][msg.sender];
        if (!ticket.exists) revert TicketMissing();
        if (ticket.claimed) revert AlreadyClaimed();

        ticket.claimed = true;

        (bool success, ) = payable(msg.sender).call{ value: round.ticketPrice }("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(roundId, msg.sender, round.ticketPrice);
    }

    // ============ View Functions ============

    /**
     * @notice Get round information
     * @param roundId The round to query
     */
    function getRound(string calldata roundId) external view returns (RoundSnapshot memory snapshot) {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();

        snapshot.exists = round.exists;
        snapshot.roundId = round.roundId;
        snapshot.creator = round.creator;
        snapshot.ticketPrice = round.ticketPrice;
        snapshot.startTime = round.startTime;
        snapshot.endTime = round.endTime;
        snapshot.prizePool = round.prizePool;
        snapshot.ticketCount = round.ticketCount;
        snapshot.cancelled = round.cancelled;
        snapshot.settled = round.settled;
        snapshot.winningNumberReady = round.winningNumberReady;
        snapshot.revealedWinningNumber = round.revealedWinningNumber;
        snapshot.tier1Winners = round.tier1Winners;
        snapshot.tier2Winners = round.tier2Winners;
        snapshot.tier3Winners = round.tier3Winners;
        snapshot.winningNumberHandle = FHE.toBytes32(round.encryptedWinningNumber);
    }

    /**
     * @notice Get player's ticket information
     * @param roundId The round to query
     * @param player The player address
     */
    function getTicket(
        string calldata roundId,
        address player
    ) external view returns (PlayerTicket memory playerTicket) {
        Ticket storage ticket = tickets[roundId][player];
        if (!ticket.exists) revert TicketMissing();

        playerTicket.exists = ticket.exists;
        playerTicket.claimed = ticket.claimed;
        playerTicket.purchaseTime = ticket.purchaseTime;
        playerTicket.numberHandle = FHE.toBytes32(ticket.encryptedNumber);
    }

    /**
     * @notice List all round IDs
     */
    function listRoundIds() external view returns (string[] memory) {
        return roundIds;
    }

    /**
     * @notice Get participants of a round
     * @param roundId The round to query
     */
    function getParticipants(string calldata roundId) external view returns (address[] memory) {
        Round storage round = rounds[roundId];
        if (!round.exists) revert RoundMissing();
        return round.participants;
    }

    /**
     * @notice Check if a round is currently active
     * @param roundId The round to check
     */
    function isRoundActive(string calldata roundId) external view returns (bool) {
        Round storage round = rounds[roundId];
        if (!round.exists) return false;
        return !round.cancelled &&
               !round.settled &&
               block.timestamp < round.endTime;
    }

    /**
     * @notice Get the current status of a round
     * @param roundId The round to check
     * @return status 0=NotFound, 1=Active, 2=Ended, 3=Settled, 4=Cancelled
     */
    function getRoundStatus(string calldata roundId) external view returns (uint8 status) {
        Round storage round = rounds[roundId];
        if (!round.exists) return 0;
        if (round.cancelled) return 4;
        if (round.settled) return 3;
        if (block.timestamp >= round.endTime) return 2;
        return 1;
    }
}
