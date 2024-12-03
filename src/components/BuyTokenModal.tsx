import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import EthLogo from "../../public/eth.svg";
import { TokenType } from "./TokenTable";

export interface IModalsProps {
  isOpen: boolean;
  onClose: () => void;
  token?: TokenType;
  onSwapToken: (value: any) => void;
  loading: boolean
}

const BuyTokenModal = ({
  isOpen,
  onClose,
  token,
  onSwapToken,
  loading,
}: IModalsProps) => {
  const [ethAmount, setEthAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  function handleSubmit() {
    if (ethAmount && Number(ethAmount)) {
      onSwapToken({ amount: ethAmount, ...token })
    }
  }

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
          <div className="full bg-[#2D3542] border border-[#2D3542] flex flex-col justify-center items-center rounded-xl shadow-xl relative">
            <div
              className="absolute top-[-8px] right-[-8px] px-3 py-1 rounded-full bg-[#2D3542]"
              onClick={onClose}
            >
              <span className="text-white">x</span>
            </div>
            <div className="w-full p-6 bg-[#2D3542]  rounded-xl">
              <div className="bg-[#252B36] p-3 rounded-xl border border-[#252B36] hover:border-black hover:shadow-xl flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row items-center gap-4 bg-[#2D3542] rounded-md p-1 px-3 cursor-not-allowed">
                    <div className="flex flex-row items-center gap-2">
                      <img src={EthLogo} />

                      <p className="text-white">ETH</p>
                    </div>
                  </div>
                  <input
                    className="text-3xl text-right text-[#fff] outline-none bg-transparent w-1/2"
                    value={ethAmount}
                    placeholder="0.00"
                    onChange={(e) => setEthAmount(e?.target?.value)}
                  />
                </div>

                <div className="flex flex-row justify-between items-center">
                  <p className="text-[#717A8C] text-xs">
                    Balance: 2.8989 ETH (MAX)
                  </p>
                  <p className="text-[#717A8C] text-xs">≈$ 6726.2307</p>
                </div>
              </div>

              <div className="relative" title={`ETH to ${token?.symbol}`}>
                <div className="absolute left-0 right-0 bottom-[-24px]">
                  <div className="flex flex-row justify-center items-center">
                    <div className="p-2 bg-[#2D3542] rounded-full">
                      <div className="shadow-2xl p-2 rounded-full bg-[#252B36]">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.4498 6.71997L6.72974 3L3.00977 6.71997"
                            stroke="#717A8C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6.72949 21L6.72949 3"
                            stroke="#717A8C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13.5498 17.28L17.2698 21L20.9898 17.28"
                            stroke="#717A8C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17.2695 3V21"
                            stroke="#717A8C"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#252B36] p-3 rounded-xl border border-[#252B36] hover:border-black flex flex-col gap-4 mt-2">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row items-center gap-2 bg-[#2D3542] rounded-md p-1 px-3">
                    <div className="flex flex-row items-center gap-2">
                      <img
                        src={token?.logoURI}
                        alt={token?.name}
                        className="w-6 h-6 rounded-full"
                      />

                      <p className="text-white">{token?.symbol}</p>
                    </div>

                  </div>
                  <input
                    disabled
                    className="text-3xl text-right text-[#717A8C] outline-none bg-transparent w-1/2"
                    placeholder="0.00"
                  />
                </div>

                <p className="text-right text-[#717A8C] text-xs">
                  1 {token?.symbol} ≈$ {token?.priceUSD}
                </p>
              </div>

              <div className="flex flex-row justify-center mt-6">
                <button
                  className="bg-yellow-400 hover:opacity-80 p-3 rounded-xl px-5 w-full relative"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading && <div className="absolute left-4 top-0 bottom-0 flex flex-row items-center animate-spin" children={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.5108 3.504V7.50399M20.5108 7.50399L19.1536 5.94511C16.9593 3.53663 13.5293 2.40745 10.165 3.3089C5.36385 4.59538 2.51461 9.53041 3.80109 14.3316C5.08757 19.1328 10.0226 21.982 14.8238 20.6956C16.555 20.2317 18.0324 19.2935 19.1536 18.0582M20.5108 7.50399H16.5108" stroke="black" stroke-width="null" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>} />}

                  <p className="text-lg text-[#2D3542]">Borrow and Swap</p>
                </button>
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default BuyTokenModal;
