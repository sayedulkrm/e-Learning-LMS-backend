import express from "express";
import {
    activateUser,
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const userRoute = express.Router();

// Register user
userRoute.route("/register").post(registerUser);

// Login User
userRoute.route("/login").post(loginUser);

// Logout User
userRoute
    .route("/logout")
    .get(isAuthenticated, authorizeRoles("admin"), logoutUser);

// Activate user
userRoute.route("/activate-user").post(activateUser);

export default userRoute;
