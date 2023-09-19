import { NextFunction, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import OrderModel from "../models/order.model";

// create new order
export const newOrder = catchAsyncError(
    async (data: any, res: Response, next: NextFunction) => {
        const order = await OrderModel.create(data);

        res.status(200).json({
            success: true,
            message: "Order placed successfully",
            order,
        });
    }
);
