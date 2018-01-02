import { fetchCoinbase } from './sources/coinbase';
import { fetchGDAX } from './sources/gdax';

import { Transaction } from './models/transaction';

if (process.env.COINBASE_TOKEN) {
  fetchCoinbase();
}

if (process.env.GDAX_API_KEY) {
  fetchGDAX({
    apiKey: process.env.GDAX_API_KEY,
    apiSecret: process.env.GDAX_API_SECRET,
    apiPassphrase: process.env.GDAX_API_PASSPHRASE,
  });
}
