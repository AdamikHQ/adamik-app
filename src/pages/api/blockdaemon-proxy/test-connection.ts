import { NextApiRequest, NextApiResponse } from "next";
import { handleApiError } from "~/utils/api/signerProxyUtils";
import https from "https";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if BlockDaemon is configured
    const missingVars = [];
    if (!process.env.BLOCKDAEMON_TSM_ENDPOINT) missingVars.push("BLOCKDAEMON_TSM_ENDPOINT");
    if (!process.env.BLOCKDAEMON_CLIENT_CERT_CONTENT && !process.env.BLOCKDAEMON_CLIENT_CERT_PATH) {
      missingVars.push("BLOCKDAEMON_CLIENT_CERT_CONTENT or BLOCKDAEMON_CLIENT_CERT_PATH");
    }
    if (!process.env.BLOCKDAEMON_CLIENT_KEY_CONTENT && !process.env.BLOCKDAEMON_CLIENT_KEY_PATH) {
      missingVars.push("BLOCKDAEMON_CLIENT_KEY_CONTENT or BLOCKDAEMON_CLIENT_KEY_PATH");
    }

    if (missingVars.length > 0) {
      return res.status(200).json({
        success: false,
        message: `BlockDaemon not configured. Missing environment variables: ${missingVars.join(", ")}`,
      });
    }

    console.log("Testing BlockDaemon Vault TSM connection...");

    // Get certificates
    const cert = process.env.BLOCKDAEMON_CLIENT_CERT_CONTENT || 
                (process.env.BLOCKDAEMON_CLIENT_CERT_PATH ? 
                  require('fs').readFileSync(process.env.BLOCKDAEMON_CLIENT_CERT_PATH, 'utf8') : 
                  undefined);
    
    const key = process.env.BLOCKDAEMON_CLIENT_KEY_CONTENT || 
                (process.env.BLOCKDAEMON_CLIENT_KEY_PATH ? 
                  require('fs').readFileSync(process.env.BLOCKDAEMON_CLIENT_KEY_PATH, 'utf8') : 
                  undefined);

    if (!cert || !key) {
      return res.status(200).json({
        success: false,
        message: "Failed to load BlockDaemon certificates",
      });
    }

    // Test connection to TSM endpoint
    const endpoint = process.env.BLOCKDAEMON_TSM_ENDPOINT;
    const url = new URL(endpoint);
    
    // Create HTTPS agent with client certificates
    const agent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });

    // Make a simple request to test connectivity
    const testResponse = await fetch(`${endpoint}/version`, {
      method: "GET",
      agent: agent as any,
    });

    if (testResponse.ok) {
      const version = await testResponse.text();
      console.log("BlockDaemon TSM connection successful. Version:", version);
      
      return res.status(200).json({
        success: true,
        message: "BlockDaemon Vault TSM connection successful",
        details: {
          endpoint,
          version,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `BlockDaemon TSM connection failed: ${testResponse.status} ${testResponse.statusText}`,
      });
    }
  } catch (error) {
    console.error("BlockDaemon test connection error:", error);
    return handleApiError(error, "blockdaemon");
  }
}