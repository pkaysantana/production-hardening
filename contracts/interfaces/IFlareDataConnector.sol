// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFlareDataConnector {
    function verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 merkleRoot,
        bytes32 leaf
    ) external view returns (bool);
}
