import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createCourse } from "../services/course.service";
import {
    addAnswer,
    addQuestions,
    addReplyToReview,
    addReview,
    editCourse,
    getAllCourses,
    getAllCoursesAdmin,
    getCourseByValidUser,
    getSingleCourse,
} from "../controllers/course.controller";
const courseRoute = express.Router();

courseRoute
    .route("/createcourse")
    .post(isAuthenticated, authorizeRoles("admin"), createCourse);

courseRoute
    .route("/course/:id")
    .get(getSingleCourse) // get single course without purchase
    .put(isAuthenticated, authorizeRoles("admin"), editCourse);

// Get All courses
courseRoute.route("/courses").get(getAllCourses);

// Get Single Course Content  --> Paid User can View this course
courseRoute
    .route("/course-content/:id")
    .get(isAuthenticated, getCourseByValidUser);

// Add questions
courseRoute.route("/add-questions").put(isAuthenticated, addQuestions);

// Add Answer Question + Send To mailbox
courseRoute.route("/add-answer").put(isAuthenticated, addAnswer);

// Add Review on course
courseRoute.route("/add-review-to-course/:id").post(isAuthenticated, addReview);

// Add Answer to Review
courseRoute
    .route("/add-reply-to-review-to-course")
    .post(isAuthenticated, authorizeRoles("admin"), addReplyToReview);

//
courseRoute
    .route("/get-all-courses")
    .get(isAuthenticated, authorizeRoles("admin"), getAllCoursesAdmin);

//
//
//
//
//
//
//
//
//
//
export default courseRoute;
