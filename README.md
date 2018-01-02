# Coinbasis - Cryptocurrency tax calculator

Supported sources:

* Coinbase
* GDAX

## Instructions

<keys>

Import all transactions

Validate transactions. Pay special care to `SPEND` types and switch them to
`GIFT`, `TIP` or `DONATION` if they are moving funds to 3rd parties. If you're
moving funds between your own accounts, mark them as `TRANSFER`s to keep track
of them. Transfers won't be taken into account with tax calculation.

## Resources

* Bitcoin Taxes API https://bitcoin.tax/api
