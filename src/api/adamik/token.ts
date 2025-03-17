"use server";

import fetch from "node-fetch";
import { env, ADAMIK_API_URL } from "~/env";
import { Token } from "~/utils/types";

interface TokenResponse {
  token: Token;
}

// TODO Better API error management, consistent for all endpoints
export const getTokenInfo = async (
  chainId: string,
  tokenId: string
): Promise<Token | null> => {
  try {
    const response = await fetch(
      `${ADAMIK_API_URL}/${chainId}/token/${tokenId}`,
      {
        headers: {
          Authorization: env.ADAMIK_API_KEY,
        },
        method: "GET",
      }
    );

    if (!response.ok) {
      console.error("token - backend error:", await response.text());
      return null;
    }

    const data = (await response.json()) as TokenResponse;
    return data.token || null;
  } catch (error) {
    console.error("token - fetch error:", error);
    return null;
  }
};
