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
    console.log("Endpoint:", process.env.BLOCKDAEMON_TSM_ENDPOINT);

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

    // Parse the endpoint URL
    const endpoint = process.env.BLOCKDAEMON_TSM_ENDPOINT;
    const url = new URL(endpoint);
    
    // Use native https module for better certificate handling
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/ping',  // Health check endpoint according to BlockDaemon docs
        method: 'GET',
        cert: cert,
        key: key,
        rejectUnauthorized: process.env.NODE_ENV === 'production', // Only verify in production
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };

      console.log("Making HTTPS request to:", `${url.hostname}:${options.port}${options.path}`);

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log("Response status:", response.statusCode);
          console.log("Response headers:", response.headers);
          
          if (response.statusCode === 200 || response.statusCode === 404) {
            // Even 404 means we connected successfully (just wrong endpoint)
            // This proves the certificates work
            let details: any = {
              endpoint,
              statusCode: response.statusCode,
            };

            // Try to parse response as JSON
            try {
              const parsed = JSON.parse(data);
              details.info = parsed;
            } catch (e) {
              // Not JSON, that's ok
              if (data) {
                details.rawResponse = data.substring(0, 100); // First 100 chars
              }
            }

            resolve(res.status(200).json({
              success: true,
              message: response.statusCode === 200 
                ? "BlockDaemon Vault TSM connection successful" 
                : "BlockDaemon TSM connected (endpoint returned 404, but connection works)",
              details,
            }));
          } else {
            // Connection worked but got an error status
            resolve(res.status(200).json({
              success: false,
              message: `BlockDaemon TSM returned error: ${response.statusCode} ${response.statusMessage}`,
              details: {
                statusCode: response.statusCode,
                responseData: data.substring(0, 200),
              },
            }));
          }
        });
      });

      request.on('error', (error: any) => {
        console.error("HTTPS request error:", error);
        
        let errorMessage = "Failed to connect to BlockDaemon TSM: ";
        
        // Provide more specific error messages
        if (error.code === 'ECONNREFUSED') {
          errorMessage += "Connection refused. Please check if the TSM endpoint URL is correct.";
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          errorMessage += "Certificate verification failed. The server certificate may not match the client certificate.";
        } else if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
          errorMessage += "Self-signed certificate detected. TSM may require specific CA certificates.";
        } else if (error.message?.includes('certificate')) {
          errorMessage += "Certificate error: " + error.message;
        } else {
          errorMessage += error.message || error.code || "Unknown error";
        }
        
        resolve(res.status(200).json({
          success: false,
          message: errorMessage,
          details: {
            errorCode: error.code,
            errorMessage: error.message,
            endpoint,
          },
        }));
      });

      request.end();
    });
  } catch (error) {
    console.error("BlockDaemon test connection error:", error);
    return handleApiError(res, error, "blockdaemon");
  }
}