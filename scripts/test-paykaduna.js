"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const apiKey = process.env.PAYKADUNA_LIVE_API_KEY.replace(/^["']|["']$/g, '').trim();
const engineCode = process.env.PAYKADUNA_ENGINE_CODE.replace(/^["']|["']$/g, '').trim();
const mdasId = "132";
const jsonPayload = JSON.stringify({
    engineCode: engineCode,
    identifier: "KIR-26T-007700",
    firstName: "DELE OLOJE ",
    middleName: "",
    lastName: "& CO",
    telephone: "+2349073355108",
    address: "Kaduna",
    esBillDetailsDto: [
        {
            amount: 89500,
            mdasId: Number(mdasId),
            narration: "Withholding Tax on Rent - 2026"
        }
    ]
});
// TEST 1: RAW STRING UTF-8
const hmac1 = crypto.createHmac("sha256", apiKey);
hmac1.update(jsonPayload, "utf8");
const signature1 = hmac1.digest("base64");
// TEST 2: BASE64 DECODED KEY
const keyBytes = Buffer.from(apiKey, 'base64');
const hmac2 = crypto.createHmac("sha256", keyBytes);
hmac2.update(jsonPayload, "utf8");
const signature2 = hmac2.digest("base64");
async function run() {
    console.log("PAYLOAD:", jsonPayload);
    console.log("SIG 1 (UTF8):", signature1);
    console.log("SIG 2 (Base64):", signature2);
    console.log("\n--- TESTING SIG 1 ---");
    const res1 = await fetch("https://api.paykaduna.com/api/ESBills/CreateESBill", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Signature": signature1 },
        body: jsonPayload
    });
    console.log("Status:", res1.status, await res1.text());
    console.log("\n--- TESTING SIG 2 ---");
    const res2 = await fetch("https://api.paykaduna.com/api/ESBills/CreateESBill", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Signature": signature2 },
        body: jsonPayload
    });
    console.log("Status:", res2.status, await res2.text());
}
run().catch(console.error);
