// A simple Node.js script to test the Sodot vertex directly
require("dotenv").config({ path: ".env.local" });

// Use environment variables from .env.local
const vertexUrl =
  process.env.SODOT_VERTEX_0_URL || process.env.SODOT_VERTEX_URL_0;
const apiKey =
  process.env.SODOT_VERTEX_0_API_KEY || process.env.SODOT_VERTEX_API_KEY_0;

// Get key IDs from environment variables
const ecdsaKeyIds = (process.env.SODOT_EXISTING_ECDSA_KEY_IDS || "").split(",");
const ed25519KeyIds = (process.env.SODOT_EXISTING_ED25519_KEY_IDS || "").split(
  ","
);

console.log("Sodot Vertex URL:", vertexUrl || "Not set");
console.log(
  "API Key:",
  apiKey
    ? "Set (first few chars: " + apiKey.substring(0, 8) + "...)"
    : "Not set"
);

console.log(
  "ECDSA Key IDs:",
  ecdsaKeyIds.length > 0 ? `${ecdsaKeyIds.length} keys loaded` : "Not set"
);
console.log(
  "ED25519 Key IDs:",
  ed25519KeyIds.length > 0 ? `${ed25519KeyIds.length} keys loaded` : "Not set"
);

if (!vertexUrl || !apiKey) {
  console.error("❌ Missing required environment variables!");
  console.error("Please ensure your .env.local file contains:");
  console.error("  SODOT_VERTEX_URL_0=<your-vertex-url>");
  console.error("  SODOT_VERTEX_API_KEY_0=<your-api-key>");
  console.error("  SODOT_EXISTING_ECDSA_KEY_IDS=<comma-separated-key-ids>");
  console.error("  SODOT_EXISTING_ED25519_KEY_IDS=<comma-separated-key-ids>");
  process.exit(1);
}

if (ecdsaKeyIds.length === 0 || ecdsaKeyIds[0] === "") {
  console.error("❌ No ECDSA key IDs found in SODOT_EXISTING_ECDSA_KEY_IDS");
  process.exit(1);
}

if (ed25519KeyIds.length === 0 || ed25519KeyIds[0] === "") {
  console.error(
    "❌ No ED25519 key IDs found in SODOT_EXISTING_ED25519_KEY_IDS"
  );
  process.exit(1);
}

async function testECDSADerivePubkey() {
  const curve = "ecdsa";
  const keyId = ecdsaKeyIds[0]; // Use first ECDSA key ID from env
  const derivationPath = [44, 60, 0, 0, 0]; // Ethereum derivation path

  console.log("\n=== TESTING ECDSA CURVE ===");
  const url = `${vertexUrl}/${curve}/derive-pubkey`;

  console.log("Making request to:", url);
  console.log("Request body:", {
    key_id: keyId,
    derivation_path: derivationPath,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        key_id: keyId,
        derivation_path: derivationPath,
      }),
    });

    console.log("\nResponse status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log("\nRaw response text:", responseText);

    if (responseText && responseText.trim() !== "") {
      try {
        const parsedResponse = JSON.parse(responseText);
        console.log(
          "\nParsed response:",
          JSON.stringify(parsedResponse, null, 2)
        );
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
      }
    } else {
      console.log("Response is empty");
    }
  } catch (error) {
    console.error("Error making request:", error);
  }
}

async function testED25519DerivePubkey() {
  const curve = "ed25519";
  const keyId = ed25519KeyIds[0]; // Use first ED25519 key ID from env
  const derivationPath = [44, 118, 0, 0, 0]; // Cosmos derivation path

  console.log("\n=== TESTING ED25519 CURVE ===");
  const url = `${vertexUrl}/${curve}/derive-pubkey`;

  console.log("Making request to:", url);
  console.log("Request body:", {
    key_id: keyId,
    derivation_path: derivationPath,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        key_id: keyId,
        derivation_path: derivationPath,
      }),
    });

    console.log("\nResponse status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log("\nRaw response text:", responseText);

    if (responseText && responseText.trim() !== "") {
      try {
        const parsedResponse = JSON.parse(responseText);
        console.log(
          "\nParsed response:",
          JSON.stringify(parsedResponse, null, 2)
        );
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
      }
    } else {
      console.log("Response is empty");
    }
  } catch (error) {
    console.error("Error making request:", error);
  }
}

// Run the tests
async function runTests() {
  await testECDSADerivePubkey();
  await testED25519DerivePubkey();
}

runTests();
