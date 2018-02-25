import Sequelize from "sequelize";
import sequelize from "./sequelize";

const ACTION_TYPES = [
  "SELL", // Selling crypto-currency to fiat or BTC
  "BUY", // Buy crypto-currency for fiat or BTC
  "INCOME", // General income
  "GIFTIN", // Income received as a gift or tip
  "MINING", // Income received from mining
  "SPEND", // General spending of crypto-currencies
  "GIFT", // Spending as a gift or tip
  "DONATION", // Spending to a registered charity
  "TRANSFER" // Transfer between accounts (excluded from taxes)
];

export const Transaction = sequelize.define("transaction", {
  date: Sequelize.DATE,
  action: Sequelize.ENUM(ACTION_TYPES),
  symbol: Sequelize.STRING,

  volume: Sequelize.DECIMAL,
  currency: Sequelize.STRING,

  exchange: Sequelize.STRING,
  exchangeId: Sequelize.STRING,

  price: {
    type: Sequelize.DECIMAL,
    allowNull: true
  },

  total: {
    type: Sequelize.DECIMAL,
    allowNull: true
  },

  fee: {
    type: Sequelize.DECIMAL,
    allowNull: true
  },

  feeCurrency: {
    type: Sequelize.STRING,
    allowNull: true
  },

  memo: {
    type: Sequelize.TEXT,
    allowNull: true
  },

  notes: {
    type: Sequelize.TEXT,
    allowNull: true
  }
});

export const initDb = async () => {
  await Transaction.sync({ force: true });
};

export const resetDb = async () => {
  await Transaction.destroy({ where: {} });
};
