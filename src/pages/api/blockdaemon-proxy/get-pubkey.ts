import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "~/utils/api/signerProxyUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chainId, curve, keyId } = req.body;

    console.log("BlockDaemon get-pubkey request:", { chainId, curve, keyId });

    // For now, BlockDaemon TSM only supports secp256k1
    // if (curve === "ed25519") {
    //   throw new Error("BlockDaemon TSM does not support ed25519 curves yet");
    // }

    // Use the existing key ID from env
    const actualKeyId = keyId || process.env.BLOCKDAEMON_EXISTING_KEY_IDS;

    // Get the public key for this key ID
    let preGeneratedPubKey = process.env.BLOCKDAEMON_PUBLIC_KEY;

    if (!preGeneratedPubKey) {
      throw new Error(
        `BlockDaemon public key not found for key ID: ${actualKeyId}\n` +
          "Please run the following command to get the public key:\n" +
          `go run main.go get-pubkey ${actualKeyId}\n` +
          "Then add to .env.local: BLOCKDAEMON_PUBLIC_KEY=<base64-public-key>"
      );
    }

    // Convert the base64 public key to compressed hex format
    // First, decode the base64 to see what format we have
    const decodedKey = Buffer.from(preGeneratedPubKey, "base64").toString(
      "utf8"
    );

    let publicKeyHex: string | undefined;

    // Check if it's JSON format (newer BlockDaemon format)
    if (decodedKey.startsWith("{") && decodedKey.includes('"point"')) {
      const keyData = JSON.parse(decodedKey);
      console.log("BlockDaemon key data:", keyData);

      if (keyData.scheme !== "ECDSA" || keyData.curve !== "secp256k1") {
        throw new Error(
          `Unsupported key type: ${keyData.scheme}/${keyData.curve}`
        );
      }

      // The point is base64 encoded
      const pointBuffer = Buffer.from(keyData.point, "base64");

      // Check if it's already compressed (33 bytes starting with 0x02 or 0x03)
      if (
        (pointBuffer[0] === 0x02 || pointBuffer[0] === 0x03) &&
        pointBuffer.length === 33
      ) {
        publicKeyHex = pointBuffer.toString("hex");
      } else if (pointBuffer[0] === 0x04 && pointBuffer.length === 65) {
        // Uncompressed, need to compress
        const x = pointBuffer.slice(1, 33);
        const y = pointBuffer.slice(33, 65);
        const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
        const compressed = Buffer.concat([Buffer.from([prefix]), x]);
        publicKeyHex = compressed.toString("hex");
      } else if (pointBuffer.length === 64) {
        // Raw x,y coordinates without prefix
        const x = pointBuffer.slice(0, 32);
        const y = pointBuffer.slice(32, 64);
        const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
        const compressed = Buffer.concat([Buffer.from([prefix]), x]);
        publicKeyHex = compressed.toString("hex");
      } else {
        throw new Error(
          `Unexpected point format from BlockDaemon. Length: ${pointBuffer.length}`
        );
      }
    } else {
      // Fallback to DER format parsing (older format)
      const pubKeyBuffer = Buffer.from(preGeneratedPubKey, "base64");

      if (pubKeyBuffer[0] === 0x30) {
        // DER-encoded key - find the uncompressed point
        // Look for the 0x04 marker (uncompressed point)
        let pointStart = -1;
        for (let i = 0; i < pubKeyBuffer.length - 65; i++) {
          if (
            pubKeyBuffer[i] === 0x04 &&
            (i === pubKeyBuffer.length - 65 || // At the end
              (i > 0 && pubKeyBuffer[i - 1] === 0x41))
          ) {
            // Or preceded by length byte 0x41 (65)
            pointStart = i;
            break;
          }
        }

        if (pointStart !== -1) {
          const uncompressed = pubKeyBuffer.slice(pointStart, pointStart + 65);
          const x = uncompressed.slice(1, 33);
          const y = uncompressed.slice(33, 65);
          // Determine prefix based on y coordinate parity
          const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
          const compressed = Buffer.concat([Buffer.from([prefix]), x]);
          publicKeyHex = compressed.toString("hex");
        } else {
          // If we can't find uncompressed point, try to extract from the end
          // Sometimes the key is at the end of the DER structure
          const lastBytes = pubKeyBuffer.slice(-65);
          if (lastBytes[0] === 0x04) {
            const x = lastBytes.slice(1, 33);
            const y = lastBytes.slice(33, 65);
            const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
            const compressed = Buffer.concat([Buffer.from([prefix]), x]);
            publicKeyHex = compressed.toString("hex");
          } else {
            throw new Error(
              "Unable to parse BlockDaemon public key - no uncompressed point found"
            );
          }
        }
      } else if (pubKeyBuffer[0] === 0x04 && pubKeyBuffer.length === 65) {
        // Already an uncompressed public key
        const x = pubKeyBuffer.slice(1, 33);
        const y = pubKeyBuffer.slice(33, 65);
        const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
        const compressed = Buffer.concat([Buffer.from([prefix]), x]);
        publicKeyHex = compressed.toString("hex");
      } else if (
        (pubKeyBuffer[0] === 0x02 || pubKeyBuffer[0] === 0x03) &&
        pubKeyBuffer.length === 33
      ) {
        // Already compressed
        publicKeyHex = pubKeyBuffer.toString("hex");
      } else {
        // Try one more strategy - sometimes the key is wrapped in additional encoding
        // Look for any occurrence of 65 consecutive bytes starting with 0x04
        let found = false;
        for (let i = 0; i <= pubKeyBuffer.length - 65; i++) {
          if (pubKeyBuffer[i] === 0x04) {
            const candidate = pubKeyBuffer.slice(i, i + 65);
            // Verify it looks like a valid key (x and y should be 32 bytes each)
            const x = candidate.slice(1, 33);
            const y = candidate.slice(33, 65);
            // Basic sanity check - at least one byte should be non-zero
            if (x.some((b) => b !== 0) && y.some((b) => b !== 0)) {
              const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
              const compressed = Buffer.concat([Buffer.from([prefix]), x]);
              publicKeyHex = compressed.toString("hex");
              found = true;
              break;
            }
          }
        }

        if (!found) {
          console.error(
            "Unable to parse public key. Buffer:",
            pubKeyBuffer.toString("hex")
          );
          throw new Error(
            `Unsupported public key format from BlockDaemon. Length: ${
              pubKeyBuffer.length
            }, First byte: 0x${pubKeyBuffer[0].toString(16)}`
          );
        }
      }
    }

    if (!publicKeyHex) {
      throw new Error("Failed to extract public key from BlockDaemon response");
    }

    console.log("BlockDaemon public key retrieved:", publicKeyHex);

    return res.status(200).json({
      publicKey: publicKeyHex,
      keyId: actualKeyId,
      message: "Using pre-generated BlockDaemon key",
    });
  } catch (error) {
    console.error("BlockDaemon get-pubkey error:", error);
    return handleApiError(res, error, "blockdaemon");
  }
}
