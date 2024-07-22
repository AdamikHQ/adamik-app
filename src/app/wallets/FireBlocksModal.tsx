import { useState } from "react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";

export const FireBlocksModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: { address: string; pubKey: string }) => void;
}> = ({ isOpen, onClose, onConnect }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const mockAddress = "cosmos1yvuhqg73fdzxvam9sj7mazfa38gpn7ulsavh7s";
    const chainId = "cosmoshub";
    const mockPubKey =
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    onConnect({ address: mockAddress, pubKey: mockPubKey, chainId: chainId });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Connect to Fireblocks
          </h1>
          <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
            <p>
              Enable raw signing on your workspace.
              <a
                href="https://support.fireblocks.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block mt-2"
              >
                More details on setting up Fireblocks API users.
              </a>
            </p>
          </div>
          <form className="mt-4 space-y-4 w-full px-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-500"
              >
                API Key
              </label>
              <input
                type="text"
                id="apiKey"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="  e.g. 8f2d47a1-4c5e-4739-bb1e-0d91b1ef23bc"
              />
            </div>
            <div>
              <label
                htmlFor="apiSecret"
                className="block text-sm font-medium text-gray-500"
              >
                API Secret
              </label>
              <input
                type="file"
                id="apiSecret"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="vaultAccountId"
                className="block text-sm font-medium text-gray-500"
              >
                Vault Account ID
              </label>
              <select
                id="vaultAccountId"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`Vault ID ${i + 1}`}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full flex justify-end mt-6">
              <Button type="submit">Connect</Button>
            </div>
          </form>
        </div>
      }
    />
  );
};
