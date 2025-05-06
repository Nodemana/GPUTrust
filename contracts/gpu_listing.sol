// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GPUListing {
    address public seller;
    address public gpu_registration;
    int public price;
    address public buyer;

    constructor(string memory _UUID, bytes32 benchmark_hash) {
        UUID = _UUID;
        benchmark_hashs.push(benchmark_hash);
        owners.push(msg.sender);
    }

    function depositFunds(address new_owner) public payable {

    }

    function setBenchmark(bytes32 new_benchmark_hash) public {
        benchmark_hashs.push(new_benchmark_hash);
    }

    function getDetails() public view returns (string memory, address[] memory, bytes32[] memory) {
       return (UUID, owners, benchmark_hashs);
    }
}
