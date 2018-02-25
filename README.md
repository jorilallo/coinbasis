# Coinbasis - Cryptocurrency tax calculator

_Warning: This code was written for my personal use and requires technical understanding to use. I'm not a tax professional and this software or guide is not to be taken as tax advice._

Compiling crypto transactions for taxes is hard. This software is written to make it easier to fetch, modify and audit Coinbase transactions for [Bitcoin.tax](https://bitcoin.tax) service. I wrote it because thier automatic importer didn't seem to get my transaction correct and it was easier for me to modify then in SQL to get my cost basis correct.

Workflow:

1. Import Coinbase transactions with coinbasis with API
1. Modify and audit them manually in SQL
1. Upload transactions into Bitcoin.tax through API

Right now only Coinbase is supported but adding more sources would not be hard.

## Installation and usage

Clone this repo and set following environment variable:

* `DATABASE_URL` - Postgres database URL
* `COINBASE_TOKEN` - Coinbase JWT token (TODO: change to API key)
* `BITCOIN_TAXES_KEY` && `BITCOIN_TAXES_SECRET` - Bitcoin.tax API credentials

The script works with following commands:

`yarn start iniDb` - Initialize DB
`yarn start import coinbase` - Fetch Coinbase transaction into database
`yarn start uploadTransactions` - Upload transactions into Bitcoin.tax

Additional commands:

`yarn start iniDb` - Reset DB data

## Instructions

Validate transactions. Pay special care to `SPEND` types and switch them to
`GIFT`, `TIP` or `DONATION` if they are moving funds to 3rd parties. If you're
moving funds between your own accounts, mark them as `TRANSFER`s to keep track
of them. Transfers won't be taken into account with tax calculation.

## Resources

* Bitcoin Taxes API https://bitcoin.tax/api
