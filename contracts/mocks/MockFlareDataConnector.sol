// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFlareDataConnector.sol";

contract MockFlareDataConnector is IFlareDataConnector {
    mapping(bytes32 => mapping(bytes32 => bool)) public validProofs;

    function setProofValidity(bytes32 root, bytes32 leaf, bool isValid) external {
        validProofs[root][leaf] = isValid;
    }

    function verifyMerkleProof(
        bytes32[] calldata, /* proof */
        bytes32 merkleRoot,
        bytes32 leaf
    ) external view override returns (bool) {
        return validProofs[merkleRoot][leaf];
    }
}
