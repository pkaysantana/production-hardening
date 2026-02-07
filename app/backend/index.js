const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// STEP 1: DELIVERY PROOF ENDPOINT (THIS IS WHAT FDC READS)
app.get("/api/delivery-proof/:itemId", (req, res) => {
  if (req.params.itemId !== "item-001") {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json({
    itemId: "item-001",
    status: "DELIVERED",
    buyer: "0x270216787A9bc1EDC945a8D24E40FbDEdb35B605",
    seller: "0xSELLER_ADDRESS",
    timestamp: 1700000000
  });
});

// (optional, for your button)
app.post("/api/confirm-delivery", (req, res) => {
  res.json({ success: true });
});

// START SERVER
app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});

