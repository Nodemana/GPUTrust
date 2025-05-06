// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GPURegistration {
    string public UUID;

    function setName(string memory _name) public {
        storeName = _name;
    }

    function getName() public view returns (string memory) {
        return storeName;
    }
}
