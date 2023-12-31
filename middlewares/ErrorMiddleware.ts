import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandler";

const ErrorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    // console.error(err);

    err.message = err.message || "Internal Server Error (ErrorMiddleware file)";

    // wrong mongodb id error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Duplicate key erro
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    // wrong jwt error
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, Try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT Expire error
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is Expired, Try again`;
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};

export default ErrorMiddleware;
