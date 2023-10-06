import express from "express";
import {
    activateUser,
    deleteUserAdmin,
    getAllUsersAdmin,
    getUserInformation,
    loginUser,
    logoutUser,
    registerUser,
    socialAuth,
    updateAccessToken,
    updateUserInfo,
    updateUserPassword,
    updateUserProfilePicture,
    updateUserRole,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const userRoute = express.Router();

// Register user
userRoute.route("/register").post(registerUser);

// Login User
userRoute.route("/login").post(loginUser);

// Logout User
userRoute.route("/logout").get(updateAccessToken, isAuthenticated, logoutUser);

// Activate user
userRoute.route("/activate-user").post(activateUser);

// Refresh Token
userRoute.route("/refresh").get(updateAccessToken);

// Get user information And Update user information
userRoute
    .route("/me")
    .get(updateAccessToken, isAuthenticated, getUserInformation);

//  Update User Password
userRoute
    .route("/me/updatepassword")
    .put(updateAccessToken, isAuthenticated, updateUserPassword);

// Update Profile Picture
userRoute
    .route("/me/updateprofilepicture")
    .put(updateAccessToken, isAuthenticated, updateUserProfilePicture);

// Social Authentication
userRoute.route("/social-auth").post(socialAuth);

// Admin Routes
userRoute
    .route("/get-all-users")
    .get(
        updateAccessToken,
        isAuthenticated,
        authorizeRoles("admin"),
        getAllUsersAdmin
    );

userRoute
    .route("/update-user-role")
    .put(
        updateAccessToken,
        isAuthenticated,
        authorizeRoles("admin"),
        updateUserRole
    );

userRoute
    .route("/delete-user/:id")
    .delete(
        updateAccessToken,
        isAuthenticated,
        authorizeRoles("admin"),
        deleteUserAdmin
    );

export default userRoute;
