export enum AdamikCurve {
  SECP256K1 = "secp256k1",
  ED25519 = "ed25519",
}

export enum AdamikHashFunction {
  SHA256 = "sha256",
  KECCAK256 = "keccak256",
}

export interface AdamikSignerSpec {
  curve: AdamikCurve;
  hashFunction: AdamikHashFunction;
  coinType: string;
  signatureFormat: string;
}
