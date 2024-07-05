import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "../ui/button";

export const WelcomeModal = () => {
  // Hydration to trick Server Rendering to be the same as Client Rendering on initial load
  const [delayOpen, setDelayOpen] = useState(false);
  const { setShowroom } = useWallet();

  useEffect(() => {
    setDelayOpen(true);
  }, []);

  const setShowroommode = (isShowroom: boolean) => {
    setDelayOpen(false);
    setShowroom(isShowroom);
  };

  return (
    <Modal
      open={delayOpen}
      displayCloseButton={false}
      modalContent={
        <div className="flex items-center flex-col gap-10">
          <h1 className="text-2xl font-semibold text-center">
            Welcome to the Adamik App!
          </h1>
          <div className="flex flex-col gap-2">
            <p className="text-gray-400">
              This application demonstrates the multi-chain capabilities of the
              Adamik API.
            </p>
            <p className="text-gray-400">
              You can experience Adamik with a “showroom” mode, or with your
              real accounts.
            </p>
            <p className="text-gray-400">
              To experience the showroom, select Enter Adamik Showroom.
            </p>
            <p className="text-gray-400">
              Ready to fully leverage Adamik power, select “Add Wallet”.
            </p>
            <p className="text-gray-400">
              If you want to interact with the Adamik app hands-on, select “Add
              Wallet.”
            </p>
          </div>
          <div className="flex items-center justify-between w-[60%]">
            <Button onClick={() => setShowroommode(true)}>
              Enter Adamik Showroom
            </Button>
            <Button onClick={() => setShowroommode(false)}>Add Wallet</Button>
          </div>
        </div>
      }
    />
  );
};
