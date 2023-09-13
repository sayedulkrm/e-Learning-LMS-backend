import { NextFunction, Request, Response } from "express";

export const catchAsyncError =
    (passedFunction: any) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(passedFunction(req, res, next)).catch(next);
    };
