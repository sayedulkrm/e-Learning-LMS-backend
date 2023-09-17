import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createCourse } from "../services/course.service";
import { editCourse } from "../controllers/course.controller";
const courseRoute = express.Router();

courseRoute
    .route("/createcourse")
    .post(isAuthenticated, authorizeRoles("admin"), createCourse);

courseRoute
    .route("/course/:id")
    .put(isAuthenticated, authorizeRoles("admin"), editCourse);

export default courseRoute;
