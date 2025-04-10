import { NextApiRequest, NextApiResponse } from "next";
import { encodePubKeyToAddress } from "~/api/adamik/encode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get parameters from the request
    const { pubkey, chain } = req.query;

    if (
      !pubkey ||
      !chain ||
      typeof pubkey !== "string" ||
      typeof chain !== "string"
    ) {
      return res.status(400).json({
        status: 400,
        error: "Missing parameters",
        message: "Both pubkey and chain are required",
      });
    }

    // Use the server-side encodePubKeyToAddress function
    const { address, type, allAddresses } = await encodePubKeyToAddress(
      pubkey,
      chain
    );

    // Return the address information
    return res.status(200).json({
      status: 200,
      data: {
        address,
        type,
        allAddresses,
      },
    });
  } catch (error: any) {
    console.error(`Error deriving address:`, error);
    return res.status(500).json({
      status: 500,
      error: "Failed to derive address",
      message: error.message,
    });
  }
}
