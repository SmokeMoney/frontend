import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

import EthLogo from "../../public/eth.svg";
import { TokenType } from "./TokenTable";

export interface IModalsProps {
  token?: TokenType;
  onSwapToken: (value: any) => void;
  onClose: () => void;
  loading: { success: boolean, error: any, loading: boolean }[];
  isOpen: boolean;
  chain: any
}

const ETH_USD_PRICE = 3600;

const BuyTokenModal = ({
  isOpen,
  onClose,
  token,
  onSwapToken,
  loading,
  chain,
}: IModalsProps) => {
  const steps = [{
    title: "Step 1",
    content: "Select a token to buy"
  }, {
    title: "Step 2",
    content: "Select a token to buy"
  }, {
    title: "Step 3",
    content: "Select a token to buy"
  }, {
    title: "Step 4",
    content: "Select a token to buy"
  }]
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  function handleReTry() {
  }

  const closeabel = true


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
              onClick={() => !closeabel && onClose?.()}
            >
              <span className="text-[#171821]">x</span>
            </div>

            <div className="p-6 w-96 bg-[#fff] rounded-xl">
              <div className="">
                {steps.map((step, index) => (
                  <div key={index} className={`flex flex-col ${!loading?.[index].loading && !loading?.[index].success && 'opacity-40'}`}>
                    <div className="flex flex-row items-center gap-2">
                      <div className="w-8 h-8 bg-[#171821] text-[#fff] rounded-full flex flex-row items-center justify-center">
                        {
                          loading?.[index]?.loading ? (
                            <span className={`${loading?.[index]?.loading ? "animate-spin" : ""}`}>-</span>
                          ) : (
                            <span className="">{index + 1}</span>
                          )
                        }
                      </div>
                      <span className="text-[#171821]">{step.title}</span>
                    </div>
                    <span className="text-[#171821]">{step.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default BuyTokenModal;
