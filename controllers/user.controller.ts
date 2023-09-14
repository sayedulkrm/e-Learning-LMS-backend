import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import UserModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/errorHandler";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { connectRedis } from "../config/redis";

//
//
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

            const activationToken = createActivationToken(user);

            const activationCode = activationToken.activationCode;

            const data = {
                user: {
                    name: user.name,
                },
                activationCode,
            };

            const html = await ejs.renderFile(
                path.join(__dirname, "../mails/activation-mail.ejs"),
                data
            );

            try {
                await sendMail({
                    email: user.email,
                    subject: "Account Activation",
                    templete: "activation-mail.ejs",
                    data,
                });

                res.status(200).json({
                    success: true,
                    message: `Email sent ${user.email} successfully. Please activate your account`,
                    activationToken: activationToken.token,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// interface IActivation
interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        { user, activationCode },
        process.env.JWT_SECRET as Secret,
        {
            expiresIn: "5m",
        }
    );

    return { token, activationCode };
};

// Activate User
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } =
                req.body as IActivationRequest;

            const newUser: { user: IUser; activationCode: string } = jwt.verify(
                activation_token,
                process.env.JWT_SECRET as string
            ) as { user: IUser; activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler("Invalid Activation Code", 400));
            }

            const { name, email, password } = newUser.user;

            const isEmailExist = await UserModel.findOne({ email });

            if (isEmailExist) {
                return next(new ErrorHandler("Email already exist", 400));
            }

            const user = await UserModel.create({
                name,
                email,
                password,
            });

            res.status(200).json({
                success: true,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Login User

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body as ILoginRequest;

            if (!email || !password) {
                return next(
                    new ErrorHandler("Please enter email and password", 400)
                );
            }

            const user = await UserModel.findOne({ email }).select("+password");

            if (!user) {
                return next(new ErrorHandler("Invalid Email or Password", 401));
            }

            const isPasswordMatched = await user.comparePassword(password);

            if (!isPasswordMatched) {
                return next(new ErrorHandler("Invalid Email or Password", 401));
            }

            sendToken(res, user, `Welcome Back ${user.name}`, 200);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Logout user

export const logoutUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });
            res.cookie("refresh_token", "", { maxAge: 1 });

            const userID = req.user?._id || "";

            connectRedis.del(userID);

            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
