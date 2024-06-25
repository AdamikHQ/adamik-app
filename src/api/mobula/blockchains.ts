"use server";

import { env, MOBULA_API_URL } from "~/env";
import { MobulaBlockchain } from "./types";

export const getMobulaBlockchains = async (): Promise<MobulaBlockchain[]> => {
  const url = `${MOBULA_API_URL}/blockchains`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: env.MOBULA_API_KEY,
    },
    method: "GET",
  });

  if (response.status === 200) {
    const data: { data: MobulaBlockchain[] } = await response.json();

    return data.data;
  }

  return [];
};
