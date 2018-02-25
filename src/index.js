import program from "commander";
import { resetDb, initDb } from "./models";
import { importCoinbase } from "./sources/coinbase";
import { uploadTransactions } from "./upload";

program.arguments("<cmd> [value]").action(async (cmd, value) => {
  switch (cmd) {
    case "resetDb":
      await resetDb();
      break;
    case "initDb":
      await initDb();
      break;
    case "uploadTransactions":
      await uploadTransactions();
      break;
    case "import":
      if (value === "coinbase") await importCoinbase();
      break;
    default:
      console.log("Unknown command");
  }

  process.exit();
});

program.parse(process.argv);
