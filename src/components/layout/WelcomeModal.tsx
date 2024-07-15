import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "../ui/button";

export const WelcomeModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { setShowroom, setWalletMenuOpen } = useWallet();

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const handleShowroomMode = (isShowroom: boolean) => {
    setIsModalOpen(false);
    setShowroom(isShowroom);
    setWalletMenuOpen(!isShowroom);
  };

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
    <Modal
      open={isModalOpen}
      displayCloseButton={false}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          {currentStep === 1 && (
            <>
              <h1 className="text-2xl font-semibold text-center">
                Welcome to the Adamik App!
              </h1>
              <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
                <p>
                  Adamik is an open source multichain application powered by the{" "}
                  <a
                    href="https://docs.adamik.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Adamik API
                  </a>
                </p>
                <img
                  src="/intro.svg"
                  alt="Adamik Introduction"
                  className="w-[80%] h-auto mx-auto"
                />
              </div>
              <div className="w-full flex justify-end mt-6 pr-4">
                <Button onClick={handleNextStep}>Next</Button>
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div className="w-full flex justify-start pl-4">
                <button
                  className="text-sm text-gray-400 hover:text-gray-600"
                  onClick={handlePreviousStep}
                >
                  <span className="mr-1">{"<"}</span>Go Back
                </button>
              </div>
              <h1 className="text-2xl font-semibold text-center">
                Select your experience
              </h1>
              <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
                <p>Switch between modes using the toggle</p>
                <video
                  className="w-full h-auto mt-4 rounded-lg" // Added rounded-lg for border radius
                  src="/toggle.mp4" // Replace with the video file path
                  autoPlay
                  loop
                  muted
                />
              </div>
              <div className="flex justify-center gap-4 w-full mt-6">
                <Button
                  className="w-48"
                  onClick={() => handleShowroomMode(true)}
                >
                  Enter Demo
                </Button>
                <Button
                  className="w-48"
                  onClick={() => handleShowroomMode(false)}
                >
                  Add Wallet
                </Button>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
