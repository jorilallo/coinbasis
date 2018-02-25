import fetch from "isomorphic-fetch";
import num from "num";
import { FIAT_CURRENCIES } from "../helpers";
import { Transaction } from "../models";

// We'll only include completed transactions
const VALID_STATUSES = ["completed"];

class CoinbaseClient {
  constructor() {
    this.token = process.env.COINBASE_TOKEN;
    this.host = "https://api.coinbase.com";
  }

  async fetch(path) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: `JWT ${this.token}`,
      "CB-VERSION": "2016-02-18"
    };

    const res = await fetch(this.host + path, {
      headers: headers
    });
    const json = res.json();
    return json;
  }
}

const client = new CoinbaseClient();

const fetchTransactions = async (account, next_uri) => {
  let path;
  if (!next_uri)
    path = `/v2/accounts/${account.id}/transactions?limit=100&expand=all`;
  else path = next_uri;

  let shoudPaginate = true;
  const res = await client.fetch(path);
  await Promise.all(
    res.data.map(async tx => {
      if (VALID_STATUSES.includes(tx.status)) {
        const other = tx.from || tx.to || {};

        let sourceAddress = other.resource;
        if (other.resource && other.resource.indexOf("address") >= 0) {
          sourceAddress = `${sourceAddress}(${other.address})`;
        } else if (other.resource === "user") {
          sourceAddress = `${sourceAddress}(${other.resource.name ||
            other.resource.id})`;
        } else if (other.id) {
          sourceAddress = `${sourceAddress}(${other.id})`;
        }

        let action;
        if (tx.type === "send" || !tx.type) {
          action = tx.amount.amount < 0 ? "SPEND" : "GIFTIN";
          if (other.resource === "account")
            console.error("FUCK GOT A TRANSFER SEND");
        } else if (tx.type === "order") {
          action = tx.amount.amount < 0 ? "SPEND" : "INCOME";
        } else if (
          [
            "transfer",
            "vault_withdrawal",
            "exchange_deposit",
            "exchange_withdrawal"
          ].includes(tx.type)
        ) {
          action = "TRANSFER";
        } else if (tx.type === "buy") {
          action = "BUY";
        } else if (tx.type === "sell") {
          action = "SELL";
        } else {
          throw new Error(`Unknown type: ${tx.type}`);
        }

        let memo = `${tx.details.title} ${
          tx.details.subtitle
        }\n\n${JSON.stringify(tx, null, 2)}`;
        if (tx.description) memo = `${memo} - ${tx.description}`;

        let volume;
        let currency;
        let total;
        let price;
        let fee;
        let feeCurrency;
        const transfer = tx.buy || tx.sell;
        if (transfer) {
          volume = num(transfer.amount.amount)
            .abs()
            .toString();
          currency = transfer.total.currency;
          total = num(transfer.subtotal.amount)
            .abs()
            .toString();
          price = num(transfer.subtotal.amount)
            .div(transfer.amount.amount)
            .toString();
          fee = num(transfer.total.amount)
            .sub(transfer.subtotal.amount)
            .abs()
            .toString();
          feeCurrency = transfer.total.currency;
        } else {
          volume = num(tx.amount.amount)
            .abs()
            .toString();
          total = num(tx.native_amount.amount)
            .abs()
            .toString();
          price = num(tx.native_amount.amount)
            .div(tx.amount.amount)
            .toString();
          currency = tx.native_amount.currency;
          // Add tx fees for 2017 txs
          if (tx.network && tx.network.transaction_fee) {
            fee = tx.network.transaction_fee.amount;
            feeCurrency = tx.network.transaction_fee.currency;
          }
        }

        await Transaction.create({
          date: new Date(tx.created_at),
          action,
          symbol: tx.amount.currency,
          volume,
          price,
          total,
          currency,
          exchange: "Coinbase",
          exchangeId: tx.id,
          fee,
          feeCurrency,
          memo
        });
      }
    })
  );

  if (res.pagination.next_uri) {
    await fetchTransactions(account, res.pagination.next_uri);
  }
};

export const importCoinbase = async () => {
  if (!process.env.COINBASE_TOKEN)
    return console.error("COINBASE_TOKEN not set");

  const res = await client.fetch("/v2/accounts");
  await Promise.all(
    res.data.map(async account => {
      if (!FIAT_CURRENCIES.includes(account.currency)) {
        await fetchTransactions(account);
      }
    })
  );
};
