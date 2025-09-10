import { SignerFactory } from "../SignerFactory";
import { SignerType } from "../types";
import { SodotSigner } from "../Sodot";
import { IoFinnetSigner } from "../IoFinnet";
import { AdamikCurve, AdamikSignerSpec } from "~/utils/types";

describe("SignerFactory", () => {
  const mockChainId = "ethereum";
  const mockSignerSpec: AdamikSignerSpec = {
    curve: AdamikCurve.SECP256K1,
    coinType: "60",
    signatureFormat: "hex",
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("createSigner", () => {
    it("should create a Sodot signer when type is SODOT", async () => {
      const signer = await SignerFactory.createSigner(
        SignerType.SODOT,
        mockChainId,
        mockSignerSpec
      );

      expect(signer).toBeInstanceOf(SodotSigner);
      expect(signer.signerName).toBe("Sodot");
      expect(signer.chainId).toBe(mockChainId);
    });

    it("should create an IoFinnet signer when type is IOFINNET", async () => {
      const signer = await SignerFactory.createSigner(
        SignerType.IOFINNET,
        mockChainId,
        mockSignerSpec
      );

      expect(signer).toBeInstanceOf(IoFinnetSigner);
      expect(signer.signerName).toBe("IoFinnet");
      expect(signer.chainId).toBe(mockChainId);
    });

    it("should throw error for unsupported signer type", async () => {
      await expect(
        SignerFactory.createSigner(
          "UNSUPPORTED" as SignerType,
          mockChainId,
          mockSignerSpec
        )
      ).rejects.toThrow("Unsupported signer type: UNSUPPORTED");
    });
  });

  describe("getSelectedSignerType", () => {
    it("should return SODOT as default when no preference is saved", () => {
      const signerType = SignerFactory.getSelectedSignerType();
      expect(signerType).toBe(SignerType.SODOT);
    });

    it("should return saved preference from localStorage", () => {
      localStorage.setItem("preferredSigner", SignerType.IOFINNET);
      const signerType = SignerFactory.getSelectedSignerType();
      expect(signerType).toBe(SignerType.IOFINNET);
    });

    it("should return SODOT if invalid value in localStorage", () => {
      localStorage.setItem("preferredSigner", "INVALID");
      const signerType = SignerFactory.getSelectedSignerType();
      expect(signerType).toBe(SignerType.SODOT);
    });
  });

  describe("setSelectedSignerType", () => {
    it("should save signer type to localStorage", () => {
      SignerFactory.setSelectedSignerType(SignerType.IOFINNET);
      expect(localStorage.getItem("preferredSigner")).toBe(SignerType.IOFINNET);
    });
  });

  describe("createPreferredSigner", () => {
    it("should create signer based on saved preference", async () => {
      localStorage.setItem("preferredSigner", SignerType.IOFINNET);
      
      const signer = await SignerFactory.createPreferredSigner(
        mockChainId,
        mockSignerSpec
      );

      expect(signer).toBeInstanceOf(IoFinnetSigner);
    });

    it("should create Sodot signer when no preference saved", async () => {
      const signer = await SignerFactory.createPreferredSigner(
        mockChainId,
        mockSignerSpec
      );

      expect(signer).toBeInstanceOf(SodotSigner);
    });
  });

  describe("SIGNER-AGNOSTIC verification", () => {
    it("all signers should implement BaseSigner interface", async () => {
      const sodot = await SignerFactory.createSigner(
        SignerType.SODOT,
        mockChainId,
        mockSignerSpec
      );
      
      const iofinnet = await SignerFactory.createSigner(
        SignerType.IOFINNET,
        mockChainId,
        mockSignerSpec
      );

      // Verify all required methods exist
      const requiredMethods = ["getPubkey", "getAddress", "signTransaction"];
      
      for (const method of requiredMethods) {
        expect(typeof (sodot as any)[method]).toBe("function");
        expect(typeof (iofinnet as any)[method]).toBe("function");
      }
    });
  });
});