import fetch from "isomorphic-fetch";
import { Transaction } from "./models";

const API_URL = "https://api.bitcoin.tax/v1/transactions";

export const uploadTransactions = async () => {
  const transactions = await Transaction.findAll();

  const data = await transactions.map(async tx => {
    return {
      date: tx.date,
      action: tx.action,
      exchange: tx.exchange,
      exchangeid: tx.exchangeId,
      symbol: tx.symbol,
      currency: tx.currency,
      volume: tx.volume,
      total: tx.total,
      memo: tx.notes,
      price: tx.price,
      fee: tx.fee,
      feecurrency: tx.feeCurrency
    };
  });

  await fetch(API_URL, {
    method: "post",
    body: JSON.stringify(data),
    headers: {
      "user-agent": "coinbasis",
      "content-type": "application/json",
      "X-APIKEY": process.env.BITCOIN_TAXES_KEY,
      "X-APISECRET": process.env.BITCOIN_TAXES_SECRET
    }
  });
};
