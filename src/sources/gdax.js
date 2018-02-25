import assert from "assert";
import num from "num";
import gdax from "gdax";

import { FIAT_CURRENCIES } from "../helpers";

function callAsync(client, method, ...args) {
  return new Promise((resolve, reject) => {
    client[method].call(client, ...args, (err, res, data) => {
      res.body = data || res.body;
      if (err) {
        reject(err);
      } else if (res.statusCode !== 200) {
        const httpErr = new Error(
          `${res.statusCode} ${res.statusMessage}\n${JSON.stringify(res.body)}`
        );
        reject(httpErr);
      } else {
        resolve(res);
      }
    });
  });
}

async function importOrders(client) {
  let processedOrders = [];
  let pagination = null;
  while (pagination === null || pagination.after) {
    const orders = await callAsync(client, "getOrders", {
      ...pagination,
      status: "done"
    });
    pagination = { after: orders.headers["cb-after"] };

    for (const order of orders.body) {
      if (order.done_reason !== "filled") continue;
      process.stdout.write(".");
      // console.log(
      //   order.id,
      //   order.product_id,
      //   order.side,
      //   order.price,
      //   order.size
      // );
      console.log(order);
      // console.log(order.id, order.product_id);

      const [baseCurrency, quoteCurrency] = order.product_id.split("-");

      // Fees
      const feeCurrency = quoteCurrency; // Fees are in quote currency
      const fee = num(order.fill_fees);

      let action;
      if (order.side === "buy") {
        action = "BUY";
      } else if (order.side === "sell") {
        action = "SELL";
      } else {
        throw new Error(`Unknown type: ${order.side}`);
      }

      // // transaction.source = account.source;
      // // transaction.sourceType = t.type;
      // // transaction.sourceAmount = t.amount;
      // // transaction.amount = t.amount;
      // // transaction.currency = account.currency;
      // // transaction.timestamp = t.created_at;

      // if (t.type === 'match') {
      //   transaction.type = t.amount > 0 ? 'buy' : 'sell';
      //   assert.ok(t.details.product_id);
      //   assert.ok(t.details.trade_id);
      //   transaction.exchangeReference = [
      //     t.details.product_id,
      //     t.details.trade_id,
      //   ].join(':');
      // } else if (t.type === 'transfer') {
      //   transaction.type = 'transfer';
      // } else if (t.type === 'fee') {
      //   assert.ok(num(t.amount).lt(0));
      //   // skip fees, we account for them by adjusting the
      //   // quote transaction amount in importFills()
      //   continue;
      // }

      // await Transaction.create({
      //   date: new Date(order.done_at),
      //   action,
      //   amount: Math.abs(tx.amount.amount),
      //   symbol: CURRENC,
      //   volume,
      //   currency,
      //   exchange: "GDAX",
      //   exchangeId: order.id,
      //   fee,
      //   feeCurrency,
      //   memo
      // });
    }
  }
}

async function importFills(client) {
  console.log("\nImporting GDAX fills");

  // In-memory storage
  let processedFills = [];

  // import fills and match with ledger entries
  let pagination = null;
  while (pagination === null || pagination.after) {
    const fills = await callAsync(client, "getFills", pagination);
    pagination = { after: fills.headers["cb-after"] };

    for (const f of fills.body) {
      process.stdout.write(".");
      const order = f.order_id;

      // if we buy BTC, BTC will be positive, and vice versa
      const baseTotal = f.side === "buy" ? num(f.size) : num(f.size).neg();

      // if we buy BTC, USD will be negative, and vice versa
      const quoteTotalExFee = baseTotal.mul(f.price).neg();

      // if we buy BTC, fee will increase total USD spent
      // if we sell BTC, fee will decrease total USD received
      const quoteTotalIncFee = quoteTotalExFee.sub(f.fee);

      const [baseCurrency, quoteCurrency] = f.product_id.split("-");

      // if quote currency is non-fiat (i.e. BTC) then we also need to update
      // the quote transaction
      let amount;
      let exchangeValue;
      let exchangeCurrency;
      if (!FIAT_CURRENCIES.includes(quoteCurrency)) {
        // update amount to account for fee (since we don't import them separately)
        amount = quoteTotalIncFee.toString();

        // exchangeValue is equal to size in base currency
        exchangeValue = baseTotal.toString();
        exchangeCurrency = baseCurrency;
      }

      processedFills.push({
        order,
        baseTotal,
        quoteTotalExFee,
        quoteTotalIncFee,
        baseCurrency,
        quoteCurrency,
        amount,
        exchangeValue,
        exchangeCurrency
      });
    }
  }

  return processedFills;
}

export const fetchGDAX = async config => {
  const client = new gdax.AuthenticatedClient(
    config.apiKey,
    config.apiSecret,
    config.apiPassphrase
  );

  console.log("\nImporting GDAX");

  await importOrders(client);
};
