import express, { json } from "express";
import bodyParser from "body-parser";
import { webhook } from "./webhook";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/webhook", webhook);

app.use("/", (req, res) => {
  return res.send("hello");
});

// errors & edge cases
app.use((err, req, res, _) => {
  res.status(err.status || 500);
  res.json({
    err: {
      message: err.message,
    },
  });
});

app.use((req, res, next) => {
  const error = new Error("Route Not Found");
  error.message = "404";
  next(error);
  return res.status(404).send({
    message: "Route Not Found",
  });
});

export default app;
