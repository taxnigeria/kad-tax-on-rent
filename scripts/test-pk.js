const crypto = require("crypto");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
let apiKey = env.split("\n").find(line => line.startsWith("PAYKADUNA_LIVE_API_KEY")).split("=")[1].replace(/^["']|["']$/g, '').trim();
let engineCode = env.split("\n").find(line => line.startsWith("PAYKADUNA_ENGINE_CODE")).split("=")[1].replace(/^["']|["']$/g, '').trim();

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
            mdasId: mdasId, // Keeping as string to match old behavior
            narration: "Withholding Tax on Rent - 2026"
        }
    ]
});

// TEST 1: RAW STRING UTF-8
const hmac1 = crypto.createHmac("sha256", apiKey);
hmac1.update(jsonPayload, "utf8");
const signature1 = hmac1.digest("base64");

// TEST 2: BASE64 DECODED KEY
const keyBytes = apiKey.endsWith('=') ? Buffer.from(apiKey, 'base64') : apiKey;
const hmac2 = crypto.createHmac("sha256", keyBytes);
hmac2.update(jsonPayload, "utf8");
const signature2 = hmac2.digest("base64");

async function run() {
    console.log("PAYLOAD:", jsonPayload);
    console.log("API KEY:", apiKey.substring(0, 10) + "...");
    
    console.log("\n--- TESTING SIG 1 (UTF-8 Key) ---");
    console.log("Sig:", signature1);
    const res1 = await fetch("https://api.paykaduna.com/api/ESBills/CreateESBill", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Signature": signature1 },
        body: jsonPayload
    });
    console.log(res1.status, await res1.text());

    console.log("\n--- TESTING SIG 2 (Base64 Key) ---");
    console.log("Sig:", signature2);
    const res2 = await fetch("https://api.paykaduna.com/api/ESBills/CreateESBill", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Signature": signature2 },
        body: jsonPayload
    });
    console.log(res2.status, await res2.text());
}

run().catch(console.error);
