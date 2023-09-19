import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createOrder, getAllOrderAdmin } from "../controllers/order.controller";

const orderRoute = express.Router();

orderRoute.route("/create-order").post(isAuthenticated, createOrder);

// Admin routes
orderRoute
    .route("/get-all-orders")
    .get(isAuthenticated, authorizeRoles("admin"), getAllOrderAdmin);

export default orderRoute;
