import { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";

// Helper function to get the base URL
function getBaseUrl(req: NextApiRequest): string {
  // Prefer Vercel URL if available (for production)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // Use request headers for local development
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check if we have the pre-configured key IDs
    const keyIds = process.env.SODOT_EXISTING_ECDSA_KEY_IDS?.split(",");

    if (!keyIds || keyIds.length < 3) {
      return res.status(500).json({
        status: 500,
        error: "Missing key IDs",
        message: "No ECDSA key IDs found in environment variables",
      });
    }

    const baseUrl = getBaseUrl(req);

    // Make parallel requests to derive pubkeys from all vertices
    const vertexPromises = [0, 1, 2].map(async (vertexId) => {
      try {
        const keyId = keyIds[vertexId];
        if (!keyId) {
          throw new Error(`No key ID found for vertex ${vertexId}`);
        }

        // Use our proxy to call derive-pubkey
        const response = await fetch(
          `${baseUrl}/api/sodot-proxy/ecdsa/derive-pubkey?vertex=${vertexId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key_id: keyId,
              derivation_path: [44, 60, 0, 0, 0], // Default Ethereum path
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        const result = await response.json();
        if (!result || !result.data) {
          throw new Error("Invalid response format");
        }

        return {
          vertexId,
          status: response.status,
          compressed: result.data.compressed,
          uncompressed: result.data.uncompressed,
        };
      } catch (e: any) {
        console.error(`Error getting pubkey from vertex ${vertexId}:`, e);
        return {
          vertexId,
          status: 500,
          error: e.message,
        };
      }
    });

    const results = await Promise.all(vertexPromises);

    return res.status(200).json({
      status: 200,
      data: {
        vertices: results.map((result) => ({
          id: result.vertexId,
          status: result.status,
          compressed: result.compressed,
          uncompressed: result.uncompressed,
          error: result.error,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error in get-keys handler:", error);
    return res.status(500).json({
      status: 500,
      error: "Failed to get keys",
      message: error.message,
    });
  }
}
