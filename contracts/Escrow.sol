// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    enum Status { AWAITING_PAYMENT, ACTIVE, CLOSED }

    struct Record {
        address buyer;
        address seller;
        uint256 amount; // in ETB (scaled by 100, e.g., 500.00 ETB = 50000)
        Status status;
        bool exists;
    }

    mapping(uint256 => Record) public escrows;
    uint256 public nextId = 1;

    event EscrowCreated(uint256 indexed id, address buyer, address seller, uint256 amount);
    event PaymentConfirmed(uint256 indexed id, Status status);
    event EscrowFinalized(uint256 indexed id, Status status);

    function createEscrow(
        address buyer,
        address seller,
        uint256 amount
    ) external returns (uint256) {
        uint256 id = nextId++;
        escrows[id] = Record({
            buyer: buyer,
            seller: seller,
            amount: amount,
            status: Status.AWAITING_PAYMENT,
            exists: true
        });

        emit EscrowCreated(id, buyer, seller, amount);
        return id;
    }

    function confirmPayment(uint256 id) external {
        require(escrows[id].exists, "Escrow does not exist");
        require(escrows[id].status == Status.AWAITING_PAYMENT, "Invalid status");

        escrows[id].status = Status.ACTIVE;
        emit PaymentConfirmed(id, Status.ACTIVE);
    }

    function finalizeEscrow(uint256 id) external {
        require(escrows[id].exists, "Escrow does not exist");
        require(escrows[id].status == Status.ACTIVE, "Invalid status");

        escrows[id].status = Status.CLOSED;
        emit EscrowFinalized(id, Status.CLOSED);
    }

    function getEscrow(uint256 id) external view returns (Record memory) {
        require(escrows[id].exists, "Escrow does not exist");
        return escrows[id];
    }
}