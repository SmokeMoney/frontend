import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

import EthLogo from "../../public/eth.svg";
import { TokenType } from "./TokenTable";
import { isError } from "ethers";

export interface IModalsProps {
  token?: TokenType;
  onSwapToken: (value: any) => void;
  onClose: () => void;
  loading: { success: boolean; error: any; loading: boolean }[];
  isOpen: boolean;
  clearModel: any;
  error: any;
  chain: any;
}

const ETH_USD_PRICE = 3600;

const BuyTokenModal = ({
  isOpen,
  onClose,
  token,
  onSwapToken,
  loading,
  clearModel,
  chain,
  error,
}: IModalsProps) => {
  const steps = [
    {
      title: "Checking NFT",
      content: "",
    },
    {
      title: "Create Quote data",
      content: "",
    },
    {
      title: "Borrowing Etherium",
      content: "",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  function handleReTry() {
    clearModel();
    onSwapToken(token);
  }

  const handleClose = () => {
    if (error) {
      onClose();
      clearModel();
    }
  };

  return (
    <Transition show={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-10 backdrop-blur-sm">
        <Transition.Child
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 transform scale-95"
          enterTo="opacity-100 transform scale-100"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100 transform scale-100"
          leaveTo="opacity-0 transform scale-95"
        >
          <div className="bg-[#fff] border border-[#171821] flex flex-col justify-center items-center rounded-xl shadow-xl relative">
            <div
              className="absolute top-[-8px] right-[-8px] px-3 py-1 rounded-full bg-[#fff] shadow-xl cursor-pointer"
              onClick={handleClose}
            >
              <span className="text-[#171821]">x</span>
            </div>

            <div className="p-6 w-96 bg-[#fff] rounded-xl">
              <div className="">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      !loading?.[index].loading &&
                      !loading?.[index].success &&
                      !loading?.[index].error &&
                      "opacity-40"
                    } gap-2`}
                  >
                    <div className="flex flex-row items-center gap-2">
                      <div className="w-8 h-8 bg-[#171821] text-[#fff] rounded-full flex flex-row items-center justify-center">
                        {loading?.[index]?.loading ? (
                          <span
                            className={`${
                              loading?.[index]?.loading ? "animate-spin" : ""
                            }`}
                          >
                            -
                          </span>
                        ) : (
                          <>
                            {loading?.[index].error ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-red-500"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 002 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </>
                            ) : (
                              <>
                                {loading?.[index].success ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <span className="">{index + 1}</span>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-[#171821]">{step.title}</span>
                    </div>
                    <span className="text-[#171821]">{step.content}</span>
                  </div>
                ))}
                {error && (
                  <div className="w-full flex justify-end">
                    <button
                      className="bg-blue-500 p-2 rounded-xl"
                      onClick={handleReTry}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default BuyTokenModal;
