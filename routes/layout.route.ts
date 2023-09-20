import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
    createLayout,
    editLayout,
    getLayoutByType,
} from "../controllers/layout.controller";

const layoutRoute = express.Router();

layoutRoute
    .route("/create-layout")
    .post(isAuthenticated, authorizeRoles("admin"), createLayout);

layoutRoute
    .route("/edit-layout")
    .put(isAuthenticated, authorizeRoles("admin"), editLayout);

layoutRoute.route("/get-layout").get(getLayoutByType);

export default layoutRoute;
