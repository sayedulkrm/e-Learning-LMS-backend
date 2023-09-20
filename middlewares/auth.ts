import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectRedis } from "../config/redis";

// Authenticated User

export const isAuthenticated = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { access_token } = req.cookies;

        // U make changes here. video 3:14:00 watch video
        if (!access_token) {
            return next(
                new ErrorHandler("Please login to access this resource", 401)
            );
        }

        const decoded = jwt.verify(
            access_token,
            process.env.ACCESS_TOKEN as string
        ) as JwtPayload;

        if (!decoded) {
            return next(new ErrorHandler("Access Token is not valid", 401));
        }

        const user = await connectRedis.get(decoded._id);

        if (!user) {
            return next(
                new ErrorHandler("User not found. Please Login To Access", 404)
            );
        }

        req.user = JSON.parse(user);

        next();
    }
);

// validate user roles

export const authorizeRoles =
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(
                new ErrorHandler(
                    `Role: ${req.user?.role} is not allowed to access this resource`,
                    403
                )
            );
        }
        next();
    };
