import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import { createOrder } from "../controllers/order.controller";

const orderRoute = express.Router();

orderRoute.route("/create-order").post(isAuthenticated, createOrder);

export default orderRoute;
