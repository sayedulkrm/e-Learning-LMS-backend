import express, { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import ErrorMiddleware from "./middlewares/ErrorMiddleware";

config({
    path: "./config/config.env",
});

const app = express();

// Importing Middlewars

// body parser
app.use(express.json({ limit: "50mb" }));
app.use(
    express.urlencoded({
        extended: true,
    })
);

// Cookie parser
app.use(cookieParser());

//
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
);

// importing Routes
import userRouter from "./routes/user.route";
import courseRoute from "./routes/course.route";
import orderRoute from "./routes/order.route";
import notificationRoute from "./routes/notification.route";

app.use("/api/v1", userRouter);
app.use("/api/v1", courseRoute);
app.use("/api/v1", orderRoute);
app.use("/api/v1", notificationRoute);

app.get("/", (req: Request, res: Response) => {
    res.send(
        `<h1>Server is Running. Click <a href="${process.env.FRONTEND_URL}">here</a> to go to Frontend </h1>`
    );
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Routes ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

export default app;

app.use(ErrorMiddleware);
