import fetch from 'isomorphic-fetch';
import { FIAT_CURRENCIES } from '../helpers';
import { Transaction } from '../models/transaction';

// We'll only include completed transactions
const VALID_STATUSES = ['completed'];

class CoinbaseClient {
  constructor() {
    this.token = process.env.COINBASE_TOKEN;
    this.host = 'https://api.coinbase.com';
  }

  async fetch(path) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: `JWT ${this.token}`,
      'CB-VERSION': '2016-02-18',
    };

    const res = await fetch(this.host + path, {
      headers: headers,
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
  try {
    res.data.forEach(async tx => {
      if (VALID_STATUSES.includes(tx.status)) {
        const other = tx.from || tx.to || {};

        let sourceAddress = other.resource;
        if (other.resource && other.resource.indexOf('address') >= 0) {
          sourceAddress = `${sourceAddress}(${other.address})`;
        } else if (other.resource === 'user') {
          sourceAddress = `${sourceAddress}(${other.resource.name ||
            other.resource.id})`;
        } else if (other.id) {
          sourceAddress = `${sourceAddress}(${other.id})`;
        }

        let action;
        if (tx.type === 'send' || !tx.type) {
          action = tx.amount.amount < 0 ? 'SPEND' : 'GIFTIN';
          if (other.resource === 'account')
            console.error('FUCK GOT A TRANSFER SEND');
        } else if (tx.type === 'order') {
          action = tx.amount.amount < 0 ? 'SPEND' : 'INCOME';
        } else if (
          [
            'transfer',
            'vault_withdrawal',
            'exchange_deposit',
            'exchange_withdrawal',
          ].includes(tx.type)
        ) {
          action = 'TRANSFER';
        } else if (tx.type === 'buy') {
          action = 'BUY';
        } else if (tx.type === 'sell') {
          action = 'SELL';
        } else {
          throw new Error(`Unknown type: ${tx.type}`);
        }

        let memo = `${tx.details.title} ${tx.details.subtitle}`;
        if (tx.description) memo = `${memo} - ${tx.description}`;

        let volume;
        let currency;
        let fee;
        let feeCurrency;
        const transfer = tx.buy || tx.sell;
        if (transfer) {
          volume = transfer.total.amount;
          currency = transfer.total.currency;
          fee =
            Math.abs(transfer.total.amount) -
            Math.abs(transfer.subtotal.amount);
          feeCurrency = transfer.total.currency;
        } else {
          volume = Math.abs(tx.native_amount.amount);
          currency = tx.native_amount.currency;
          // Add tx fees for 2017 txs
        }

        await Transaction.create({
          date: new Date(tx.created_at),
          action,
          amount: Math.abs(tx.amount.amount),
          symbol: tx.amount.currency,
          volume,
          currency,
          exchange: 'Coinbase',
          exchangeId: tx.id,
          fee,
          feeCurrency,
          memo,
        });
      }
    });

    if (res.pagination.next_uri) {
      fetchTransactions(account, res.pagination.next_uri);
    }
  } catch (e) {
    console.log(path, res);
  }
};

export const fetchCoinbase = async () => {
  const res = await client.fetch('/v2/accounts');
  res.data.forEach(account => {
    if (!FIAT_CURRENCIES.includes(account.currency)) {
      fetchTransactions(account);
    }
  });
};
