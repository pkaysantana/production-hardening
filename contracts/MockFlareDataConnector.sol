// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IFlareDataConnector.sol";

contract MockFlareDataConnector is IFlareDataConnector {
    bool public shouldVerify;

    constructor() {
        shouldVerify = true;
    }

    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }

    function verifyMerkleProof(
        bytes32[] calldata, /* proof */
        bytes32, /* merkleRoot */
        bytes32 /* leaf */
    ) external view override returns (bool) {
        return shouldVerify;
    }
}
