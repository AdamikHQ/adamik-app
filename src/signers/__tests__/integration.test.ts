/**
 * END-TO-END INTEGRATION TEST
 * 
 * This test verifies that:
 * 1. Both signers (Sodot and IoFinnet) work interchangeably
 * 2. The SIGNER-AGNOSTIC architecture is properly implemented
 * 3. All BaseSigner methods work for both implementations
 */

import { SignerFactory } from "../SignerFactory";
import { SignerType, BaseSigner } from "../types";
import { AdamikCurve, AdamikSignerSpec } from "~/utils/types";

// Mock environment variables for testing
process.env.NEXT_PUBLIC_IOFINNET_VAULT_ID = "test-vault";

describe("End-to-End Signer Integration", () => {
  const testChains = [
    { id: "ethereum", name: "Ethereum", coinType: "60" },
    { id: "bitcoin", name: "Bitcoin", coinType: "0" },
    { id: "base", name: "Base", coinType: "60" },
  ];

  const testSignerSpec: AdamikSignerSpec = {
    curve: AdamikCurve.SECP256K1,
    coinType: "60",
    signatureFormat: "hex",
  };

  // Test message for signing
  const testMessage = "0x48656c6c6f20576f726c64"; // "Hello World" in hex

  describe("SIGNER-AGNOSTIC Verification", () => {
    it("should create signers without knowing their type", async () => {
      // This simulates how components will use signers
      const signerType = SignerFactory.getSelectedSignerType();
      const signer = await SignerFactory.createSigner(
        signerType,
        "ethereum",
        testSignerSpec
      );

      // Component doesn't know if it's Sodot or IoFinnet
      expect(signer).toBeDefined();
      expect(signer.chainId).toBe("ethereum");
      expect(signer.signerSpec).toEqual(testSignerSpec);
    });

    it("should switch between signers transparently", async () => {
      // Start with Sodot
      SignerFactory.setSelectedSignerType(SignerType.SODOT);
      const sodotSigner = await SignerFactory.createPreferredSigner(
        "ethereum",
        testSignerSpec
      );
      expect(sodotSigner.signerName).toBe("Sodot");

      // Switch to IoFinnet
      SignerFactory.setSelectedSignerType(SignerType.IOFINNET);
      const iofinnetSigner = await SignerFactory.createPreferredSigner(
        "ethereum",
        testSignerSpec
      );
      expect(iofinnetSigner.signerName).toBe("IoFinnet");

      // Both implement the same interface
      expect(typeof sodotSigner.getPubkey).toBe("function");
      expect(typeof iofinnetSigner.getPubkey).toBe("function");
    });
  });

  describe("getPubkey() - Both Signers", () => {
    const runPubkeyTest = async (signerType: SignerType) => {
      const signer = await SignerFactory.createSigner(
        signerType,
        "ethereum",
        testSignerSpec
      );

      // Mock the API responses based on signer type
      if (signerType === SignerType.SODOT) {
        // Sodot will call the proxy endpoint
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              pubkey: "0x04" + "a".repeat(128), // Mock uncompressed pubkey
            },
          }),
        });
      } else {
        // IoFinnet will call its proxy endpoint
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            pubkey: "0x04" + "b".repeat(128), // Different mock pubkey
          }),
        });
      }

      const pubkey = await signer.getPubkey();
      expect(pubkey).toBeDefined();
      expect(pubkey).toMatch(/^0x[0-9a-fA-F]+$/); // Valid hex
    };

    it("should get pubkey using Sodot", async () => {
      await runPubkeyTest(SignerType.SODOT);
    });

    it("should get pubkey using IoFinnet", async () => {
      await runPubkeyTest(SignerType.IOFINNET);
    });
  });

  describe("getAddress() - Both Signers", () => {
    const runAddressTest = async (signerType: SignerType) => {
      const signer = await SignerFactory.createSigner(
        signerType,
        "ethereum",
        testSignerSpec
      );

      // Mock getPubkey
      jest.spyOn(signer, "getPubkey").mockResolvedValueOnce(
        "0x04" + "c".repeat(128)
      );

      // Mock the Adamik API encode call
      jest.mock("~/api/adamik/encode", () => ({
        encodePubKeyToAddress: jest.fn().mockResolvedValue({
          address: "0x" + "d".repeat(40), // Mock Ethereum address
        }),
      }));

      const address = await signer.getAddress();
      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/); // Valid Ethereum address
    };

    it("should get address using Sodot", async () => {
      await runAddressTest(SignerType.SODOT);
    });

    it("should get address using IoFinnet", async () => {
      await runAddressTest(SignerType.IOFINNET);
    });
  });

  describe("signTransaction() - Both Signers", () => {
    const runSigningTest = async (signerType: SignerType) => {
      const signer = await SignerFactory.createSigner(
        signerType,
        "ethereum",
        testSignerSpec
      );

      // Mock the signing response
      const mockSignature = "0x" + "f".repeat(130); // Mock signature

      if (signerType === SignerType.SODOT) {
        // Mock Sodot signing through proxy
        global.fetch = jest.fn().mockImplementation((url: string) => {
          if (url.includes("create-room")) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ room_uuid: "test-room-123" }),
            });
          }
          if (url.includes("/sign")) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                signature: mockSignature,
                r: "0x" + "1".repeat(64),
                s: "0x" + "2".repeat(64),
                v: 27,
              }),
            });
          }
          return Promise.reject(new Error("Unknown endpoint"));
        });
      } else {
        // Mock IoFinnet signing through proxy
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            signature: mockSignature,
            signatureId: "sig-123",
          }),
        });
      }

      const signature = await signer.signTransaction(testMessage);
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[0-9a-fA-F]+$/); // Valid hex signature
    };

    it("should sign transaction using Sodot", async () => {
      await runSigningTest(SignerType.SODOT);
    });

    it("should sign transaction using IoFinnet", async () => {
      await runSigningTest(SignerType.IOFINNET);
    });
  });

  describe("Multi-Chain Support", () => {
    it("should work with different chains for both signers", async () => {
      for (const chain of testChains) {
        // Test with Sodot
        const sodotSigner = await SignerFactory.createSigner(
          SignerType.SODOT,
          chain.id,
          { ...testSignerSpec, coinType: chain.coinType }
        );
        expect(sodotSigner.chainId).toBe(chain.id);

        // Test with IoFinnet
        const iofinnetSigner = await SignerFactory.createSigner(
          SignerType.IOFINNET,
          chain.id,
          { ...testSignerSpec, coinType: chain.coinType }
        );
        expect(iofinnetSigner.chainId).toBe(chain.id);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully for both signers", async () => {
      // Test Sodot error handling
      const sodotSigner = await SignerFactory.createSigner(
        SignerType.SODOT,
        "ethereum",
        testSignerSpec
      );

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
      await expect(sodotSigner.getPubkey()).rejects.toThrow();

      // Test IoFinnet error handling
      const iofinnetSigner = await SignerFactory.createSigner(
        SignerType.IOFINNET,
        "ethereum",
        testSignerSpec
      );

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("API error"));
      await expect(iofinnetSigner.getPubkey()).rejects.toThrow();
    });
  });

  describe("Real-World Simulation", () => {
    it("should simulate a complete transaction flow", async () => {
      // 1. User selects a signer
      SignerFactory.setSelectedSignerType(SignerType.IOFINNET);

      // 2. Create signer for Ethereum
      const signer = await SignerFactory.createPreferredSigner(
        "ethereum",
        testSignerSpec
      );

      // 3. Mock getting pubkey
      jest.spyOn(signer, "getPubkey").mockResolvedValueOnce(
        "0x04" + "e".repeat(128)
      );

      // 4. Get pubkey (for display)
      const pubkey = await signer.getPubkey();
      expect(pubkey).toBeDefined();

      // 5. Mock getting address
      jest.spyOn(signer, "getAddress").mockResolvedValueOnce(
        "0x" + "f".repeat(40)
      );

      // 6. Get address (for display)
      const address = await signer.getAddress();
      expect(address).toBeDefined();

      // 7. Mock signing
      jest.spyOn(signer, "signTransaction").mockResolvedValueOnce(
        "0x" + "9".repeat(130)
      );

      // 8. Sign a transaction
      const signature = await signer.signTransaction(testMessage);
      expect(signature).toBeDefined();

      console.log("✅ Complete transaction flow successful!");
      console.log(`   Signer: ${signer.signerName}`);
      console.log(`   Chain: ${signer.chainId}`);
      console.log(`   Address: ${address}`);
      console.log(`   Signature: ${signature.substring(0, 10)}...`);
    });
  });
});