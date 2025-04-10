import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // First check if we have the key IDs
    const keyIds = process.env.SODOT_EXISTING_ECDSA_KEY_IDS?.split(",");

    if (!keyIds || keyIds.length < 3) {
      return res.status(500).json({
        status: 500,
        error: "Missing key IDs",
        message: "No ECDSA key IDs found in environment variables",
      });
    }

    // Make parallel requests to all vertices
    const vertexPromises = [0, 1, 2].map(async (vertexId) => {
      try {
        const keyId = keyIds[vertexId];
        if (!keyId) {
          throw new Error(`No key ID found for vertex ${vertexId}`);
        }

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_VERCEL_URL ||
            req.headers.origin ||
            "http://localhost:3000"
          }/api/sodot-proxy/ecdsa/derive-pubkey?vertex=${vertexId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key_id: keyId,
              derivation_path: [44, 60, 0, 0, 0],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
        console.error(`Error getting keys from vertex ${vertexId}:`, e);
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
    return res.status(500).json({
      status: 500,
      error: "Failed to get keys",
      message: error.message,
    });
  }
}
