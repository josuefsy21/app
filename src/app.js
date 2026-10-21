import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "node:path";
import cookieParser from "cookie-parser";
import appRouter from "./routes/app.routes.js";
import { stripeWebhook, createCheckout } from "./controllers/stripe.controller.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.APP_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));

app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")))
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views");
app.set("trust proxy", 1);

app.post('/checkout', createCheckout);
app.use(appRouter);

export default app;
