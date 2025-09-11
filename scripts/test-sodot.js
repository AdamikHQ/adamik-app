// A simple Node.js script to test the Sodot vertex directly
require("dotenv").config({ path: ".env.local" });

// Use environment variables from .env.local
const vertexUrl =
  process.env.SODOT_VERTEX_0_URL || process.env.SODOT_VERTEX_URL_0;
const apiKey =
  process.env.SODOT_VERTEX_0_API_KEY || process.env.SODOT_VERTEX_API_KEY_0;

console.log("Sodot Vertex URL:", vertexUrl || "Not set");
console.log(
  "API Key:",
  apiKey
    ? "Set (first few chars: " + apiKey.substring(0, 8) + "...)"
    : "Not set"
);

if (!vertexUrl || !apiKey) {
  console.error("❌ Missing required environment variables!");
  console.error("Please ensure your .env.local file contains:");
  console.error("  SODOT_VERTEX_URL_0=<your-vertex-url>");
  console.error("  SODOT_VERTEX_API_KEY_0=<your-api-key>");
  process.exit(1);
}

async function testECDSADerivePubkey() {
  const curve = "ecdsa";
  const keyId = "8306e478-e39f-4e68-9c87-fdf9bfa6d1ad"; // Example key ID from .env
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
  const keyId = "868a7bea-a410-40d3-a03a-ea06200f9fe6"; // Example ED25519 key ID from .env
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
