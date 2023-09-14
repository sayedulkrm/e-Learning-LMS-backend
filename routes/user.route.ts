import express from "express";
import {
    activateUser,
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/user.controller";

const userRoute = express.Router();

// Register user
userRoute.route("/register").post(registerUser);

// Login User
userRoute.route("/login").post(loginUser);

// Logout User
userRoute.route("/logout").get(logoutUser);

// Activate user
userRoute.route("/activate-user").post(activateUser);

export default userRoute;
