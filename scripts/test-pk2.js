const crypto = require("crypto");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
let apiKeyLine = env.split("\n").find(line => line.startsWith("PAYKADUNA_LIVE_API_KEY="));
let engineCodeLine = env.split("\n").find(line => line.startsWith("PAYKADUNA_ENGINE_CODE="));

let apiKey = apiKeyLine.substring("PAYKADUNA_LIVE_API_KEY=".length).replace(/^["']|["'\r]$/g, '').trim();
let engineCode = engineCodeLine.substring("PAYKADUNA_ENGINE_CODE=".length).replace(/^["']|["'\r]$/g, '').trim();

const mdasId = "132";

const jsonPayload = JSON.stringify({
    engineCode: engineCode,
    identifier: "KIR-26T-007700",
    firstName: "DELE OLOJE",
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

async function run() {
    console.log("PAYLOAD:", jsonPayload);
    console.log("API KEY:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 10));
    
    // Test 1: UTF8 string hash (No Base64 decode)
    const hmac1 = crypto.createHmac("sha256", apiKey);
    hmac1.update(jsonPayload, "utf8");
    const sig1 = hmac1.digest("base64");
    
    // Test 2: Base64 decode hash
    const keyBytes = Buffer.from(apiKey, 'base64');
    const hmac2 = crypto.createHmac("sha256", keyBytes);
    hmac2.update(jsonPayload, "utf8");
    const sig2 = hmac2.digest("base64");

    // Test 3: Hex hash instead of base64
    const hmac3 = crypto.createHmac("sha256", apiKey);
    hmac3.update(jsonPayload, "utf8");
    const sig3 = hmac3.digest("hex");
    
    // Test 4: Base64 array hash but Payload without UTF-8 explicit
    const hmac4 = crypto.createHmac("sha256", keyBytes);
    hmac4.update(jsonPayload);
    const sig4 = hmac4.digest("base64");


    for (let i = 1; i <= 4; i++) {
        const sig = [sig1, sig2, sig3, sig4][i-1];
        console.log(`\n--- TESTING SIG ${i} ---`);
        console.log(`Sig Length: ${sig.length}`);
        console.log(`Sig: ${sig}`);
        const res = await fetch("https://api.paykaduna.com/api/ESBills/CreateESBill", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "X-Api-Signature": sig 
            },
            body: jsonPayload
        });
        const text = await res.text();
        console.log(`Status: ${res.status} ${text}`);
    }
}

run().catch(console.error);
