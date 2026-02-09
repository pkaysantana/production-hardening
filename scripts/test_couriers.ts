import { FDCService } from "../backend/services/FDCService";

async function main() {
    console.log("🚀 Testing Multi-Courier Support...");

    const fdcService = new FDCService();

    // Test Cases
    const cases = [
        "DHL-123456",       // Should be Delivered (via DHL)
        "FEDEX-999-DEL",    // Should be Delivered (via FedEx)
        "FEDEX-111-TRANSIT",// Should be InTransit (via FedEx) -> Null Attestation
        "UNKNOWN-000"       // Should fallback to DHL (InTransit) -> Null Attestation
    ];

    for (const id of cases) {
        console.log(`\n-----------------------------------`);
        console.log(`Testing Shipment ID: ${id}`);
        const result = await fdcService.getAttestation(id);

        if (result) {
            console.log(`✅ Attestation Generated!`);
            console.log(`   Source ID: ${result.sourceId}`);
            console.log(`   Leaf:      ${result.leaf}`);
        } else {
            console.log(`❌ No Attestation (Likely In Transit or Unknown)`);
        }
    }
}

main().catch(console.error);
