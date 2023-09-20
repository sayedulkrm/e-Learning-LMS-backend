import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
    coursesDataAnalyticsAdmin,
    ordersDataAnalyticsAdmin,
    usersDataAnalyticsAdmin,
} from "../controllers/analytics.controller";
const analyticsRoute = express.Router();

// Users
analyticsRoute
    .route("/analytics/users")
    .get(isAuthenticated, authorizeRoles("admin"), usersDataAnalyticsAdmin);

// Courses

analyticsRoute
    .route("/analytics/courses")
    .get(isAuthenticated, authorizeRoles("admin"), coursesDataAnalyticsAdmin);

// Orders

analyticsRoute
    .route("/analytics/orders")
    .get(isAuthenticated, authorizeRoles("admin"), ordersDataAnalyticsAdmin);

export default analyticsRoute;
