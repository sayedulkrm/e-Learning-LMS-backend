import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import UserModel from "../models/user.model";
import ErrorHandler from "../utils/errorHandler";

// register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password } = req.body;

            const isEmailExist = await UserModel.findOne({ email });

            if (isEmailExist) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user: IRegistrationBody = {
                name,
                email,
                password,
            };
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
