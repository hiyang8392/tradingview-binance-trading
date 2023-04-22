import Binance from "binance-api-node";

const client = Binance.default({
  apiKey: process.env.BINANCE_KEY,
  apiSecret: process.env.BINANCE_SECRET,
});

const pricePrecision = {
  BTCUSDT: 1,
  BNBUSDT: 2,
  ETHUSDT: 2,
  XRPUSDT: 4,
  LINKUSDT: 3,
  GMTUSDT: 4,
  DARUSDT: 3,
  REEFUSDT: 6,
  DUSKUSDT: 5,
  APEUSDT: 3,
  MKRUSDT: 1,
};

const contractPrecision = {
  BTCUSDT: 3,
  BNBUSDT: 2,
  ETHUSDT: 3,
  XRPUSDT: 1,
  LINKUSDT: 2,
  DARUSDT: 1,
  REEFUSDT: 0,
  DUSKUSDT: 0,
  APEUSDT: 0,
  GMTUSDT: 0,
  MKRUSDT: 3,
};

export const webhook = async (req, res) => {
  const alert = req.body;
  console.log("----RECEVING order----");
  console.log("alert", alert);

  if (!alert?.symbol) {
    return res.json({ message: "alert req no symbol!" });
  }

  try {
    if (
      alert.strategy.order_id.includes("TP") ||
      alert.strategy.order_id.includes("SL")
    ) {
      console.log("---TP/SL order ignore---");
      return res.json({ message: "---TP/SL order ignore---" });
    }

    let quantity = Number(
      Number(alert.strategy.order_contracts).toFixed(
        contractPrecision[alert?.symbol]
      )
    );

    const take_profit_price = Number(
      Number(alert.strategy.meta_data?.tp_price || 0).toFixed(
        pricePrecision[alert?.symbol]
      )
    );

    const stop_loss_price = Number(
      Number(alert.strategy.meta_data?.sl_price || 0).toFixed(
        pricePrecision[alert?.symbol]
      )
    );

    const side = alert.strategy.order_action.toUpperCase();

    if (alert.strategy.strategy_action === "entry") {
      let options = {
        symbol: alert?.symbol,
        side: side,
        type: "MARKET",
        quantity: quantity,
      };
      console.log("---ENTRY Order Starting---");
      console.log("options", options);
      let result = await client.futuresOrder(options);

      console.log("---ENTRY Order successful---");
      console.log("---ENTRY Order Result---", result);


      if (take_profit_price) {
        const tp_side = side === "BUY" ? "SELL" : "BUY";
        let tp_options = {};

        if (alert?.strategy?.use_limit_tp_sl === "true") {
          tp_options = {
            symbol: alert.symbol,
            side: tp_side,
            stopPrice: take_profit_price,
            type: "TAKE_PROFIT",
            quantity: quantity,
            reduceOnly: true,
            price: take_profit_price,
            timeInForce: "GTE_GTC",
          };
        } else {
          tp_options = {
            symbol: alert.symbol,
            side: tp_side,
            stopPrice: take_profit_price,
            type: "TAKE_PROFIT_MARKET",
            closePosition: true,
            timeInForce: "GTE_GTC",
          };
        }

        console.log("---TP Order Starting---");
        console.log("options", tp_options);
        let tp_result = await client.futuresOrder(tp_options);
        console.log("---TP Order successful---");
        console.log("---TP Order Result---", tp_result);
      }

      if (stop_loss_price) {
        const sl_side = side === "BUY" ? "SELL" : "BUY";
        let sl_options = {};

        if (alert?.strategy?.use_limit_tp_sl === "true") {
          sl_options = {
            symbol: alert.symbol,
            side: sl_side,
            stopPrice: stop_loss_price,
            type: "STOP",
            quantity: quantity,
            reduceOnly: true,
            price: stop_loss_price,
            priceProtect: true,
            timeInForce: "GTE_GTC",
          };
        } else {
          sl_options = {
            symbol: alert.symbol,
            side: sl_side,
            stopPrice: stop_loss_price,
            type: "STOP_MARKET",
            closePosition: true,
            priceProtect: true,
            timeInForce: "GTE_GTC",
          };
        }

        console.log("---SL Order starting---");
        console.log("options", sl_options);

        let sl_result = await client.futuresOrder(sl_options);

        console.log("---SL Order successful---");
        console.log("---SL Order result---", sl_result);
      }
    }

    if (alert.strategy.strategy_action === "full_close") {
      let options = {
        symbol: alert?.symbol,
        side: side,
        type: "MARKET",
        quantity: quantity,
      };
      console.log("---CLOSE Order starting---");
      console.log("options", options);

      let result = await client.futuresOrder(options);
      console.log("---CLOSE Order successful---");
      console.log("---CLOSE Order result---", result);
    }

    //Handle reduce the position
    if (alert.strategy.strategy_action === "reduce") {
      let options = {
        symbol: alert?.symbol,
        side: side,
        type: "MARKET",
        quantity: quantity,
      };
      console.log("---REDUCE Order starting---");
      console.log("options", options);

      let result = await client.futuresOrder(options);
      console.log("---REDUCE Order successful---");
      console.log("---REDUCE Order---", result);
    }
  } catch (error) {
    console.log("---Order error---");
    console.log(error);
  }

  return res.json({ message: "end" });
};
