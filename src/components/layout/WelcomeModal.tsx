import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "../ui/button";

export const WelcomeModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setShowroom } = useWallet();

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const handleShowroomMode = (isShowroom: boolean) => {
    setIsModalOpen(false);
    setShowroom(isShowroom);
  };

  const WELCOME_MESSAGE = "Welcome to the Adamik App!";
  const DESCRIPTION_LINES = [
    "This application showcases the multi-chain capabilities of the Adamik API.",
    "You can explore Adamik in 'demo' mode or with your real accounts.",
    "To try the demo, select 'Enter Adamik Demo'.",
    "To fully leverage Adamik's power, select 'Add Wallet'.",
  ];

  return (
    <Modal
      open={isModalOpen}
      displayCloseButton={false}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            {WELCOME_MESSAGE}
          </h1>
          <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
            {DESCRIPTION_LINES.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="flex justify-center gap-4 w-full mt-6">
            <Button
              className="w-48" // Fixed width
              onClick={() => handleShowroomMode(true)}
            >
              Enter Adamik Demo
            </Button>
            <Button
              className="w-48" // Fixed width
              onClick={() => handleShowroomMode(false)}
            >
              Add Wallet
            </Button>
          </div>
        </div>
      }
    />
  );
};
