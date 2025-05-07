// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GPUListing {
    address public seller;
    address public buyer;
    address public arbiter;
    address public gpu_registration;
    uint256 public price;
    uint256 public commission;
    bool public deposited;

    mapping(address => bool) public approvedRelease;  // who has approved release
    uint8   public release_ApprovalCount;

    mapping(address => bool) public approvedRefund;  // who has approved refund
    uint8   public refund_ApprovalCount;


    constructor(address _arbiter, uint256 _priceWei, uint256 _commission_perc, address _gpu_registration) {
        seller  = msg.sender;
        arbiter = _arbiter;
        price   = _priceWei;
        commission = (_priceWei / 100) * _commission_perc;
        gpu_registration = _gpu_registration;
    }

    // Buyer Deposits Funds into Escrow
    function deposit() external payable {
        require(!deposited, "Already funded");
        require(msg.value == price, "Wrong amount");
        buyer    = msg.sender;
        deposited = true;
    }

    /// Any of buyer/seller/arbiter can call to “approve” a release
    function approveRelease() external {
        require(deposited, "No funds");
        require(
            msg.sender == buyer ||
            msg.sender == seller ||
            msg.sender == arbiter,
            "Not authorized"
        );
        require(!approvedRelease[msg.sender], "Already approved");

        approvedRelease[msg.sender] = true;
        release_ApprovalCount += 1;

        // Once two approvals exist, funds go to seller:
        if (release_ApprovalCount >= 2) {
            payable(arbiter).transfer(commission);
            payable(seller).transfer(address(this).balance);
            IGPURegistration(gpu_registration).setOwner(buyer);
            deposited = false;
        }
    }

    function approveRefund() external {
        require(deposited, "No funds");
        require(
            msg.sender == buyer ||
            msg.sender == seller ||
            msg.sender == arbiter,
            "Not authorized"
        );
        require(!approvedRefund[msg.sender], "Already approved");

        approvedRefund[msg.sender] = true;
        refund_ApprovalCount += 1;

        // Once two approvals exist, funds refunded to buyer:
        if (refund_ApprovalCount >= 2) {
            payable(buyer).transfer(address(this).balance);
            deposited = false;
        }
    }
}

interface IGPURegistration {
    function setOwner(address new_owner) external;
}
