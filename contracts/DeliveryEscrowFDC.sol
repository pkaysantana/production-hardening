// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaymentEscrow {
    function releaseToSeller() external;
}

contract DeliveryEscrowFDC {
    IPaymentEscrow public paymentEscrow;
    address public attester;

    bool public deliveryConfirmed;

    event DeliveryConfirmed(bytes32 indexed orderId);

    constructor(address _paymentEscrow, address _attester) {
    require(_paymentEscrow != address(0), "Invalid escrow");
    require(_attester != address(0), "Invalid attester");

    paymentEscrow = IPaymentEscrow(_paymentEscrow);
    attester = _attester;
}
modifier onlyAttester() {
    require(msg.sender == attester, "Only attester");
    _;
}


    function confirmDelivery(
        bytes calldata attestationData,
        bytes32 orderId
    ) external onlyAttester{
        require(!deliveryConfirmed, "Delivery already confirmed");


        bool valid = _verifyFdcAttestation(attestationData);
        require(valid, "Invalid FDC attestation");

        
        deliveryConfirmed = true;
        emit DeliveryConfirmed(orderId);


        paymentEscrow.releaseToSeller();
    }

    
    function _verifyFdcAttestation(
        bytes calldata attestationData
    ) internal pure returns (bool) {
        
        return attestationData.length > 0;
    }
}
