import { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";

// This endpoint helps diagnose issues with environment variables in Vercel
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development or with an admin key check
  if (
    process.env.NODE_ENV !== "development" &&
    req.headers.authorization !== process.env.ADMIN_DEBUG_KEY
  ) {
    return res.status(403).json({
      message: "Forbidden: This endpoint is only available in development",
    });
  }

  // Get the available environment keys (NOT their values for security reasons)
  const envKeys = {
    // Vercel environment
    vercelUrl: process.env.VERCEL_URL ? "SET" : "NOT_SET",
    vercelEnv: process.env.VERCEL_ENV || "NOT_SET",
    nodeEnv: process.env.NODE_ENV || "NOT_SET",

    // Sodot related env keys
    hasVertexUrls: {
      0: !!env.SODOT_VERTEX_URL_0,
      1: !!env.SODOT_VERTEX_URL_1,
      2: !!env.SODOT_VERTEX_URL_2,
    },
    hasVertexApiKeys: {
      0: !!env.SODOT_VERTEX_API_KEY_0,
      1: !!env.SODOT_VERTEX_API_KEY_1,
      2: !!env.SODOT_VERTEX_API_KEY_2,
    },
    hasSodotKeyIds: {
      ecdsa: !!env.SODOT_EXISTING_ECDSA_KEY_IDS,
      ed25519: !!env.SODOT_EXISTING_ED25519_KEY_IDS,
    },

    // Request info
    requestHost: req.headers.host || "NOT_SET",
    requestProtocol: req.headers["x-forwarded-proto"] || "NOT_SET",
  };

  // Return environment diagnostic information
  return res.status(200).json({
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    envKeys,
    baseUrl: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : req.headers.host
      ? `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
      : "unknown",
  });
}
