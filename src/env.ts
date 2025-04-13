import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const ADAMIK_API_URL =
  // Custom URL that can be defined in an env var, locally or in Vercel
  process.env.NEXT_PUBLIC_ADAMIK_API_TEST_URL ||
  // Prod URL when running in a Vercel deployment
  `https://api.adamik.io/api`;

const MOBULA_API_URL = "https://api.mobula.io/api/1";

const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    ADAMIK_API_KEY: z.string().min(1),
    MOBULA_API_KEY: z.string().min(1),
    // Sodot Vertex Configuration
    SODOT_VERTEX_URL_0: z.string().url(),
    SODOT_VERTEX_API_KEY_0: z.string().min(1),
    SODOT_VERTEX_URL_1: z.string().url(),
    SODOT_VERTEX_API_KEY_1: z.string().min(1),
    SODOT_VERTEX_URL_2: z.string().url(),
    SODOT_VERTEX_API_KEY_2: z.string().min(1),
    // Sodot Key IDs
    SODOT_EXISTING_ECDSA_KEY_IDS: z.string().min(1),
    SODOT_EXISTING_ED25519_KEY_IDS: z.string().min(1),
  },

  /*
   * Client-side Environment variables, available on both server and client.
   */
  client: {
    // Make NEXT_PUBLIC_ADAMIK_API_TEST_URL optional with a default value
    NEXT_PUBLIC_ADAMIK_API_TEST_URL: z
      .string()
      .url()
      .optional()
      .default("https://api.adamik.io/api"),
  },

  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   */
  runtimeEnv: {
    ADAMIK_API_KEY: process.env.ADAMIK_API_KEY,
    MOBULA_API_KEY: process.env.MOBULA_API_KEY,
    // Client-side variables
    NEXT_PUBLIC_ADAMIK_API_TEST_URL:
      process.env.NEXT_PUBLIC_ADAMIK_API_TEST_URL,
    // Sodot Vertex Configuration
    SODOT_VERTEX_URL_0: process.env.SODOT_VERTEX_URL_0,
    SODOT_VERTEX_API_KEY_0: process.env.SODOT_VERTEX_API_KEY_0,
    SODOT_VERTEX_URL_1: process.env.SODOT_VERTEX_URL_1,
    SODOT_VERTEX_API_KEY_1: process.env.SODOT_VERTEX_API_KEY_1,
    SODOT_VERTEX_URL_2: process.env.SODOT_VERTEX_URL_2,
    SODOT_VERTEX_API_KEY_2: process.env.SODOT_VERTEX_API_KEY_2,
    // Sodot Key IDs
    SODOT_EXISTING_ECDSA_KEY_IDS: process.env.SODOT_EXISTING_ECDSA_KEY_IDS,
    SODOT_EXISTING_ED25519_KEY_IDS: process.env.SODOT_EXISTING_ED25519_KEY_IDS,
  },
});

export { env, ADAMIK_API_URL, MOBULA_API_URL };
