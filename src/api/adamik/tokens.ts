"use server";

import { env, ADAMIK_API_URL } from "~/env";
import { TokenInfo } from "~/utils/types";

// TODO Better API error management, consistent for all endpoints
export const getTokenInfo = async (
  chainId: string,
  tokenId: string
): Promise<TokenInfo | null> => {
  try {
    const response = await fetch(
      `${ADAMIK_API_URL}/chains/${chainId}/token/${tokenId}`,
      {
        headers: {
          Authorization: env.ADAMIK_API_KEY,
        },
        method: "GET",
      }
    );

    if (response.status === 200) {
      const data: TokenInfo = await response.json();
      return data;
    } else {
      console.error("getTokenInfo - backend error:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
};
