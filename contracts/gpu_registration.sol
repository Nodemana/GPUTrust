// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GPURegistration {
    string public UUID;
    bytes32[] public benchmark_hashs;
    address[] public owners;

    constructor(string memory _UUID, bytes32 benchmark_hash) {
        UUID = _UUID;
        benchmark_hashs.push(benchmark_hash);
        owners.push(msg.sender);
    }

    function setOwner(address new_owner) public {
        owners.push(new_owner);
    }

    function setBenchmark(bytes32 new_benchmark_hash) public {
        benchmark_hashs.push(new_benchmark_hash);
    }

    function getDetails() public view returns (string memory, address[] memory, bytes32[] memory) {
       return (UUID, owners, benchmark_hashs);
    }
}
