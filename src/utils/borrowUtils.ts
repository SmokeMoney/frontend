import { backendUrl } from '@/CrossChainLendingApp';
import axios from 'axios';

export const getBorrowSignature = async (
  address: string,
  nftId: string,
  withdrawAmount: any,
  chainId: any,
  recipientAddress: string,
  failedBorrow: string
) => {
  try {
    const response = await axios.post(`${backendUrl}/api/borrow`, {
      walletAddress: address,
      nftId: nftId,
      amount: withdrawAmount,
      chainId: chainId,
      recipient: recipientAddress,
      failedBorrow: failedBorrow,
    });
    return {
      timestamp: response.data.timestamp,
      nonce: response.data.nonce,
      signature: response.data.signature as `0x${string}`,
      status: response.data.status,
    };
  } catch (error) {
    console.error("Error fetching borrow signature:", error);
    return null;
  }
};


export const requestGaslessBorrow = async (
  address: string,
  nftId: string,
  withdrawAmount: any,
  timestamp: string,
  chainId: string,
  recipientAddress: string,
  userSignature: string,
  weth: boolean,
  integrator: number,
  failedBorrow: string
) => {

  try {
    const response = await axios.post(`${backendUrl}/api/borrow-gasless`, {
      signer: address,
      nftId: nftId,
      amount: withdrawAmount,
      timestamp: timestamp,
      chainId: chainId,
      recipient: recipientAddress,
      userSignature: userSignature,
      weth: weth,
      integrator: integrator,
      failedBorrow: failedBorrow,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching borrow signature:", error);
    return null;
  }
};


export const requestGaslessMinting = async (
  address: string,
  nftId: string,
  withdrawAmount: any,
  timestamp: string,
  chainId: string,
  recipientAddress: string,
  userSignature: string,
  weth: boolean,
  integrator: number,
  nftAddress: string,
) => {

  try {
    const response = await axios.post(`${backendUrl}/api/gasless-minting`, {
      signer: address,
      nftId: nftId,
      amount: withdrawAmount,
      timestamp: timestamp,
      chainId: chainId,
      recipient: recipientAddress,
      userSignature: userSignature,
      weth: weth,
      integrator: integrator,
      nftAddress: nftAddress,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching borrow signature:", error);
    return null;
  }
};