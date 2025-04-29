"use client";

import {
  isInArgentMobileAppBrowser,
  ArgentMobileConnector,
} from "starknetkit/argentMobile";
import {
  BraavosMobileConnector,
  isInBraavosMobileAppBrowser,
} from "starknetkit/braavosMobile";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import { getStarknet } from "@starknet-io/get-starknet-core";
import { constants } from "starknet";

// CONFIGURATION OPTIONS
// Enable or disable specific wallet connectors
export const ENABLED_CONNECTORS = {
  argentX: false,
  braavos: false,
  metamask: false,
  argentMobile: false,
  braavosMobile: false,
  argentWebWallet: true, // Only this one is enabled
};

// Chain ID to use - Set to mainnet
// Using the NetworkName constant for compatibility
const CHAIN_ID = constants.NetworkName.SN_MAIN;

// Default Argent Web Wallet URLs
// Mainnet
const ARGENT_WEBWALLET_URL_MAINNET = "https://web.argent.xyz";
// Testnet (Sepolia)
const ARGENT_WEBWALLET_URL_TESTNET = "https://web.hydrogen.argent.xyz";

// Select correct URL based on the chain
const ARGENT_WEBWALLET_URL =
  CHAIN_ID === constants.NetworkName.SN_MAIN
    ? ARGENT_WEBWALLET_URL_MAINNET
    : ARGENT_WEBWALLET_URL_TESTNET;

const isMobileDevice = () => {
  if (typeof window === "undefined") {
    return false;
  }

  // Ensure getStarknet is called for proper initialization
  getStarknet();

  // Primary method: User Agent + Touch support check
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent);
  const hasTouchSupport =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Backup method: Screen size
  const isSmallScreen = window.innerWidth <= 768;

  // Combine checks: Must match user agent AND (touch support OR small screen)
  return isMobileUA && (hasTouchSupport || isSmallScreen);
};

export const getAvailableConnectors = () => {
  // Special cases for in-wallet browsers
  if (isInArgentMobileAppBrowser() && ENABLED_CONNECTORS.argentMobile) {
    return [
      ArgentMobileConnector.init({
        options: {
          url: typeof window !== "undefined" ? window.location.href : "",
          dappName: "Adamik StarkNet Wallet",
          chainId: CHAIN_ID,
        },
      }),
    ];
  }

  if (isInBraavosMobileAppBrowser() && ENABLED_CONNECTORS.braavosMobile) {
    return [BraavosMobileConnector.init({})];
  }

  // Build array of enabled connectors
  const connectors = [
    // ArgentX browser extension
    ENABLED_CONNECTORS.argentX
      ? new InjectedConnector({ options: { id: "argentX" } })
      : null,

    // Braavos browser extension
    ENABLED_CONNECTORS.braavos
      ? new InjectedConnector({ options: { id: "braavos" } })
      : null,

    // Metamask Snap for StarkNet
    ENABLED_CONNECTORS.metamask
      ? new InjectedConnector({ options: { id: "metamask" } })
      : null,

    // Argent mobile wallet
    ENABLED_CONNECTORS.argentMobile
      ? ArgentMobileConnector.init({
          options: {
            url: typeof window !== "undefined" ? window.location.href : "",
            dappName: "Adamik StarkNet Wallet",
            chainId: CHAIN_ID,
          },
        })
      : null,

    // Braavos mobile wallet
    ENABLED_CONNECTORS.braavosMobile && isMobileDevice()
      ? BraavosMobileConnector.init({})
      : null,

    // Argent Web Wallet - Fixed with only supported options
    ENABLED_CONNECTORS.argentWebWallet
      ? new WebWalletConnector({
          url: ARGENT_WEBWALLET_URL,
          theme: "dark",
        })
      : null,
  ].filter((connector) => connector !== null);

  return connectors;
};
