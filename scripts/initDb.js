require('dotenv').config();
require('@std/esm')(module);

const Transaction = require('../src/models/transaction');
Transaction.sync({ force: true }).then(() =>
  console.log('Transaction table created')
);
