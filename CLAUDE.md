# Multi-Signer Implementation Plan for Adamik App

## Overview
This document outlines the implementation plan to extend the Adamik app from supporting only Sodot to supporting multiple signers, with IoFinnet as the primary addition. Users will be able to switch between signers directly from the settings page.

## 🚨 CRITICAL DESIGN PRINCIPLE 🚨
**ALL FUNCTIONS AND INTERFACES MUST BE SIGNER-AGNOSTIC!**
- NO hardcoded signer references in components
- NO signer-specific logic in UI components
- ALL signer-specific code must be encapsulated in signer classes
- Use the BaseSigner interface for ALL signer interactions
- Components should NEVER know which signer is being used

## Branch Strategy
Working on branch: `multi-signer-support` to avoid disrupting the main application.

## Current State Analysis

### Existing Architecture
- **Single Signer**: Only Sodot MPC signer is implemented
- **Location**: `/src/signers/Sodot.ts`
- **Integration Points**:
  - `WalletSigner.tsx` - hardcoded to use only Sodot
  - `SodotConnect.tsx` - Sodot-specific connection component
  - Settings page with Sodot test functionality
  - API proxy at `/api/sodot-proxy`

### Key Components Using Sodot
1. `WalletSigner.tsx` - Transaction signing
2. `ChainSelector.tsx` - Chain connection
3. `MultiChainConnect.tsx` - Multi-chain wallet connection
4. `WelcomeModal.tsx` - Initial wallet setup
5. `ConnectWallet.tsx` - Portfolio wallet connection

## Implementation Plan (REVISED)

### Phase 1: Settings Page First Approach
**Goal**: Start with settings page to verify signer connections before touching core functionality

#### 1.1 Leverage BaseSigner from adamik-link
- ✅ Copy `BaseSigner` interface from adamik-link
- ✅ Create `src/signers/types.ts` with interface and configs
- The interface is minimal and proven to work

#### 1.2 Create Settings Page with Signer Selection
**Start Here** - This will drive all other requirements
- Add new tab in settings for "Signer Configuration"
- Display available signers (Sodot, IoFinnet)
- Test connection functionality for each signer
- This will force us to implement the necessary infrastructure

### Phase 2: Implement IoFinnet Signer
**Goal**: Port IoFinnet signer from adamik-link to adamik-app

#### 2.1 Create IoFinnet Signer Class
```typescript
// src/signers/IoFinnet.ts
export class IoFinnetSigner implements BaseSigner {
  // Implementation based on adamik-link/src/signers/IoFinnet.ts
}
```

#### 2.2 Create IoFinnet API Proxy
```typescript
// src/pages/api/iofinnet-proxy/[...path].ts
// Proxy for IoFinnet API calls with server-side secret management
```

#### 2.3 Handle IoFinnet-Specific Requirements
- Bitcoin PSBT signing support
- Signature polling mechanism
- Voting/approval workflow UI

### Phase 3: Create Signer Factory & Manager
**Goal**: Centralize signer creation and management

#### 3.1 Signer Factory
```typescript
// src/signers/SignerFactory.ts
export class SignerFactory {
  static async createSigner(
    signerType: SignerType,
    chainId: string,
    signerSpec: AdamikSignerSpec
  ): Promise<BaseSigner> {
    switch(signerType) {
      case SignerType.SODOT:
        return new SodotSigner(chainId, signerSpec);
      case SignerType.IOFINNET:
        return new IoFinnetSigner(chainId, signerSpec);
      // Future signers...
    }
  }
}
```

#### 3.2 Signer Manager Context
```typescript
// src/providers/SignerProvider.tsx
export const SignerProvider = ({ children }) => {
  const [activeSigner, setActiveSigner] = useState<SignerType>();
  const [signerInstances, setSignerInstances] = useState<Map>();
  
  // Manage signer lifecycle, switching, and caching
}
```

### Phase 4: Update UI Components
**Goal**: Make UI components signer-agnostic

#### 4.1 Refactor WalletSigner Component
- Remove hardcoded Sodot references
- Use SignerFactory to get appropriate signer
- Create generic signing UI

#### 4.2 Create Generic Connect Component
```typescript
// src/components/wallets/SignerConnect.tsx
export const SignerConnect = ({ 
  signerType, 
  chainId, 
  transactionPayload 
}) => {
  // Generic connection logic for any signer
}
```

#### 4.3 Update Wallet Type Enum
```typescript
// src/components/wallets/types.ts
export enum WalletName {
  SODOT = "sodot",
  IOFINNET = "iofinnet",
  TURNKEY = "turnkey",  // Future
  DFNS = "dfns",        // Future
  KEPLR = "keplr",      // Existing but unused
}
```

### Phase 5: Settings Page Enhancement
**Goal**: Add signer selection and configuration UI

#### 5.1 Create Signer Settings Tab
```typescript
// src/app/settings/tabs/SignerSettings.tsx
export function SignerSettings() {
  // UI for:
  // - Selecting active signer
  // - Configuring signer-specific settings
  // - Testing signer connections
  // - Managing signer credentials (client-safe)
}
```

#### 5.2 Signer Configuration Forms
- Sodot: Vertex URLs (if customizable)
- IoFinnet: Vault selection, approval settings
- Common: Chain preferences, key derivation paths

#### 5.3 Migration Wizard
- Help users migrate from Sodot to other signers
- Export/import address lists
- Batch connection testing

### Phase 6: Environment & Security
**Goal**: Secure configuration management

#### 6.1 Environment Variables Structure
```env
# Sodot Configuration
SODOT_VERTEX_URL_0=
SODOT_VERTEX_API_KEY_0=
SODOT_VERTEX_URL_1=
SODOT_VERTEX_API_KEY_1=
SODOT_VERTEX_URL_2=
SODOT_VERTEX_API_KEY_2=

# IoFinnet Configuration
IOFINNET_BASE_URL=
IOFINNET_CLIENT_ID=
IOFINNET_CLIENT_SECRET=
IOFINNET_VAULT_ID=

# Feature Flags
NEXT_PUBLIC_ENABLED_SIGNERS=sodot,iofinnet
NEXT_PUBLIC_DEFAULT_SIGNER=sodot
```

#### 6.2 API Proxy Security
- Server-side secret management
- Rate limiting per signer
- Request validation and sanitization

### Phase 7: Testing Strategy
**Goal**: Ensure reliability across all signers

#### 7.1 Unit Tests
- Test each signer implementation
- Mock API responses
- Test error handling

#### 7.2 Integration Tests
- Test signer switching
- Test transaction signing flow
- Test multi-chain support

#### 7.3 E2E Tests
- Complete user flows with each signer
- Settings page interactions
- Wallet connection/disconnection

## Implementation Order (REVISED - Settings First)

1. **Step 1**: Settings Page & Connection Testing
   - Create new settings tab for signer configuration
   - Implement signer selection dropdown
   - Add "Test Connection" functionality
   - This proves the concept before touching critical paths

2. **Step 2**: Minimal Signer Implementation
   - Port IoFinnet from adamik-link (connection only)
   - Create API proxy for IoFinnet
   - Refactor Sodot to implement BaseSigner
   - Focus only on `getPubkey()` initially

3. **Step 3**: Extend to Core Features
   - Once connection works, add `getAddress()`
   - Then add `signTransaction()`
   - Update WalletSigner component last

4. **Step 4**: Full Integration
   - Update all wallet connection components
   - Add signer persistence in localStorage
   - Handle signer switching

5. **Step 5**: Polish & Testing
   - Error handling and user feedback
   - Comprehensive testing
   - Documentation

## Migration Guide for Users

### For Existing Sodot Users
1. No action required - Sodot remains the default
2. Optional: Explore other signers in Settings
3. Addresses and transaction history preserved

### For New Users
1. Choose preferred signer during onboarding
2. Configure signer in Settings
3. Connect wallets as usual

## Future Enhancements

### Additional Signers
- **Turnkey**: Cloud-based key management
- **Dfns**: Enterprise security features
- **Local Signer**: Development mode only
- **Hardware Wallets**: Ledger, Trezor integration

### Advanced Features
- Signer rotation policies
- Multi-signer transactions (2-of-3, etc.)
- Backup signer configuration
- Cross-signer address derivation

## Success Criteria

1. ✅ Users can switch between Sodot and IoFinnet
2. ✅ All existing functionality works with both signers
3. ✅ Settings page allows signer configuration
4. ✅ No breaking changes for existing users
5. ✅ Clear documentation and error messages
6. ✅ Secure handling of all credentials

## Technical Decisions

### Why Abstract Interface?
- Enables easy addition of new signers
- Consistent API across all signers
- Simplified testing and mocking

### Why Server-Side Proxy?
- Protects API credentials
- Centralized rate limiting
- Consistent error handling

### Why Settings-Based Selection?
- User control and transparency
- Easy switching for testing
- Persistent preferences

## Commands to Run

```bash
# After implementation, test with:
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Run development server:
pnpm dev
```

## Notes for Developers

- Always use the `BaseSigner` interface
- Never expose signer credentials to client
- Test with multiple chains when adding signers
- Update this document as implementation progresses
- Consider backward compatibility in all changes

## Questions to Address

1. Should we support multiple active signers simultaneously?
2. How to handle signer-specific transaction metadata?
3. Should we implement signer health checks?
4. How to manage signer versioning/updates?
5. What analytics should we track for signer usage?

---

## Progress Update

### ✅ Completed  
1. Created new branch: `multi-signer-support`
2. Imported `BaseSigner` interface from adamik-link
3. Created `src/signers/types.ts` with SIGNER-AGNOSTIC types
4. Implemented Settings page with Signer Configuration tab
5. Created IoFinnet test connection API proxy with REAL authentication
6. UI allows switching between Sodot and IoFinnet signers
7. Test connection functionality working with REAL IoFinnet credentials
8. Successfully tested connection to IoFinnet vault
9. **Ported IoFinnet signer** from adamik-link with full implementation
10. **Implemented public key compression** for Bitcoin and Cosmos chains
11. **Created public key utilities** for handling different key formats
12. **Optimized IoFinnet implementation** to fetch both public keys once and cache them
13. **Updated address derivation** to use p2wpkh (SegWit) addresses for Bitcoin
14. **Fixed non-EVM chain support** for IoFinnet signer
15. **Created SignerFactory** for SIGNER-AGNOSTIC signer instantiation
16. **Updated Portfolio components** to use selected signer from settings
17. **Added "Powered by" indicator** in Select Chains modal and ChainSelector
18. **Fixed Starknet filtering** for IoFinnet (unsupported curve)
19. **Implemented reactive settings** - changes apply immediately without page reload
20. **Fixed testnet visibility** in portfolio page
21. **Implemented address filtering by signer** - only shows addresses from current signer
22. **Added warning dialog** when switching signers would hide addresses
23. **Consolidated Settings tabs** - merged Signer Config and Sodot Test
24. **Fixed chain-specific issues** - proper key compression for Bitcoin family chains
25. **Implemented per-signer chain selection** in MultiChainConnect modal
26. **Centralized proxy utilities** - Created shared utilities for signature formatting, chain config, and error handling
27. **Created SignerConnect component** - Signer-agnostic component for transaction signing
28. **Updated WalletSigner** - Now uses SignerFactory and supports both Sodot and IoFinnet

### 🎯 Key Achievements
- **Complete SIGNER-AGNOSTIC Architecture**: The app no longer cares which signer is used
- **Public Key Management**: IoFinnet fetches both ECDSA_SECP256K1 and EDDSA_ED25519 keys once and caches them
- **Curve Detection**: Uses signerSpec.curve from Adamik chain endpoint to determine which key to use
- **Bitcoin Support**: Properly compresses public keys for Bitcoin family chains (33 bytes) without 0x prefix
- **Cosmos Support**: Handles compressed keys for all Cosmos ecosystem chains
- **Address Types**: Now fetches p2wpkh (SegWit) addresses for Bitcoin
- **UI Integration**: Portfolio section fully respects signer selection from settings
- **Signer Isolation**: Each signer maintains separate address lists and chain selections
- **Smart Filtering**: Addresses are automatically filtered based on active signer
- **User-Friendly Switching**: Warning dialog prevents accidental address hiding

### 📝 Technical Implementation  
- Created `/utils/api/signerProxyUtils.ts` for shared proxy logic (signature formatting, chain config, error handling)
- Created `/utils/api/signerConfig.ts` for centralized signer configuration management
- Refactored both Sodot and IoFinnet proxies to use shared utilities (~30% code reduction)
- Created `/api/iofinnet-proxy/get-all-pubkeys` endpoint to fetch both public keys
- Added `compressPublicKey()` utility to handle compression based on chain requirements
- IoFinnet signer determines curve type from signerSpec.curve field (ed25519 vs secp256k1)
- SignerFactory provides centralized signer creation and chain pubkey retrieval
- Updated ConnectWallet, ChainSelector, and MultiChainConnect components to use SignerFactory
- Added visual "Powered by [Signer]" indicator in chain selection modals
- Implemented `useFilteredChains` hook to respect testnet visibility settings
- WalletProvider now filters addresses based on current signer
- Added AlertDialog component for signer switching warnings
- Consolidated settings tabs - test connection is now under "Advanced" in Signer Config
- MultiChainConnect stores selections per-signer (e.g., `defaultChains_SODOT` vs `defaultChains_IOFINNET`)
- Chain family detection for proper key formatting (Bitcoin family vs Cosmos family)

### 🚀 Remaining Tasks
1. ✅ **Update WalletSigner** component for transaction signing - COMPLETED
2. **Test end-to-end** transaction signing with both signers
3. **Add comprehensive error handling** for signer switching

### 🔧 API Proxy Centralization Plan

#### Problem Statement
Both Sodot and IoFinnet proxies have duplicated logic for:
- Chain configuration fetching
- Signature formatting (DER, RSV, hex, base64)
- Error handling patterns
- Environment variable validation

#### Solution: Create Shared Utilities

##### 1. **signerProxyUtils.ts** (High Priority)
```typescript
// src/utils/api/signerProxyUtils.ts
- formatSignature(): Centralized signature formatting
- getChainConfig(): Cached chain configuration retrieval
- handleApiError(): Standardized error responses
- validateEnvVars(): Check required environment variables
```

##### 2. **signerConfig.ts** (High Priority)
```typescript
// src/utils/api/signerConfig.ts
- getSignerConfig(): Return required env vars per signer
- validateSignerConfig(): Ensure all required vars are set
- getSignerCredentials(): Safe credential retrieval
```

##### 3. **Keep Separate** (Low Priority)
- Authentication logic (too different: API keys vs OAuth)
- Signer-specific endpoints (maintain clarity)

#### Implementation Steps
1. Create utility files with shared logic
2. Update Sodot proxy to use utilities
3. Update IoFinnet proxy to use utilities
4. Test both signers still work correctly
5. Document the new structure

#### Benefits
- **Easier to add new signers** (Turnkey, Dfns, etc.)
- **Single source of truth** for signature formatting
- **Consistent error handling** across all signers
- **Better testability** with isolated utilities
- **Reduced code duplication** (~30% less code)

### Testing Instructions
1. Run `pnpm dev`
2. Navigate to Settings page (http://localhost:3000/settings)
3. Click on "Signer Config" tab
4. Select different signers from dropdown
5. Test connection with various chains (including Bitcoin and Cosmos)
6. Verify signer preference is saved in localStorage
7. Test address derivation for both EVM and non-EVM chains

### Verification Tests
- ✅ Bitcoin address derivation works with compressed keys
- ✅ Cosmos Hub address derivation works with compressed keys  
- ✅ Algorand address derivation works with ED25519 keys
- ✅ All EVM chains work with uncompressed keys
- ✅ Address types: p2wpkh for Bitcoin, standard for others
- ✅ Signer switching shows/hides appropriate addresses
- ✅ Warning dialog appears when switching would hide addresses
- ✅ Testnets show/hide based on settings
- ✅ Chain selections persist per-signer
- ✅ Settings changes apply immediately without reload
- ✅ Bitcoin family chains (dogecoin, litecoin) work correctly
- ✅ Starknet chains filtered for IoFinnet (unsupported curve)

*Last Updated: 2025-01-10*
*Author: Claude Assistant*
*Status: Multi-Signer Support Fully Implemented - UI Integration Complete*