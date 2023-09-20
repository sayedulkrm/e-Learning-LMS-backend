import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import LayoutModel from "../models/layout.model";
import cloudinary from "cloudinary";

// Create Layout

export const createLayout = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            if (!type) {
                return next(
                    new ErrorHandler("Please provide layout type", 400)
                );
            }

            const isTypeExist = await LayoutModel.findOne({ type });

            if (isTypeExist) {
                return next(
                    new ErrorHandler(`Layout ${type} already exist`, 400)
                );
            }

            if (type === "BANNER") {
                const { image, title, subtitle } = req.body;

                if (!title || !subtitle) {
                    return next(
                        new ErrorHandler(
                            "Please provide title and subtitle",
                            400
                        )
                    );
                }
                if (!image) {
                    return next(new ErrorHandler("Please provide image", 400));
                }

                const mycloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "layout",
                    // resource_type: "video",
                });

                const banner = {
                    type: "BANNER",
                    image: {
                        public_id: mycloud.public_id,
                        url: mycloud.secure_url,
                    },
                    title,
                    subtitle,
                };

                await LayoutModel.create(banner);
            }

            if (type === "FAQ") {
                const { faqData } = req.body;

                if (!faqData) {
                    return next(
                        new ErrorHandler("Please provide faq data", 400)
                    );
                }

                const faqItems = await Promise.all(
                    faqData.map(async (item: any) => {
                        return {
                            question: item.question,
                            answer: item.answer,
                        };
                    })
                );

                await LayoutModel.create({ type: "FAQ", faq: faqItems });
            }

            if (type === "CATEGORY") {
                const { categoryData } = req.body;

                if (!categoryData) {
                    return next(
                        new ErrorHandler("Please provide category data", 400)
                    );
                }

                const categoryItems = await Promise.all(
                    categoryData.map(async (item: any) => {
                        return {
                            title: item.title,
                        };
                    })
                );

                await LayoutModel.create({
                    type: "CATEGORY",
                    category: categoryItems,
                });
            }

            res.status(200).json({
                success: true,
                message: "Layout Created Successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Edit Layout
export const editLayout = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            if (!type) {
                return next(
                    new ErrorHandler("Please provide layout type", 400)
                );
            }

            const isTypeExist = await LayoutModel.findOne({ type });

            if (!isTypeExist) {
                return next(
                    new ErrorHandler(
                        `Layout ${type} not exist. Please create Layout ${type}`,
                        400
                    )
                );
            }

            if (type === "BANNER") {
                const bannerData: any = await LayoutModel.findOne({
                    type: "BANNER",
                });

                const { image, title, subtitle } = req.body;

                if (bannerData) {
                    await cloudinary.v2.uploader.destroy(
                        bannerData?.image.public_id
                    );
                }

                if (!title || !subtitle) {
                    return next(
                        new ErrorHandler(
                            "Please provide title and subtitle",
                            400
                        )
                    );
                }
                if (!image) {
                    return next(new ErrorHandler("Please provide image", 400));
                }

                const mycloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "layout",
                    // resource_type: "video",
                });

                const banner = {
                    image: {
                        public_id: mycloud.public_id,
                        url: mycloud.secure_url,
                    },
                    title,
                    subtitle,
                };
                // 8:28:10 ---- You add here _id. Check the video file

                await LayoutModel.findByIdAndUpdate(bannerData?._id, {
                    banner,
                });
            }

            if (type === "FAQ") {
                const { faqData } = req.body;
                // We are finding the Faq id here

                const FaqId = await LayoutModel.findOne({ type: "FAQ" });

                if (!FaqId) {
                    return next(new ErrorHandler("Faq Id not found", 400));
                }

                if (!faqData) {
                    return next(
                        new ErrorHandler("Please provide faq data", 400)
                    );
                }

                const faqItems = await Promise.all(
                    faqData.map(async (item: any) => {
                        return {
                            question: item.question,
                            answer: item.answer,
                        };
                    })
                );

                await LayoutModel.findByIdAndUpdate(FaqId?._id, {
                    type: "FAQ",
                    faq: faqItems,
                });
            }

            if (type === "CATEGORY") {
                const { categoryData } = req.body;

                const categoryId = await LayoutModel.findOne({
                    type: "CATEGORY",
                });

                if (!categoryId) {
                    return next(new ErrorHandler("Category Id not found", 400));
                }

                if (!categoryData) {
                    return next(
                        new ErrorHandler("Please provide category data", 400)
                    );
                }

                const categoryItems = await Promise.all(
                    categoryData.map(async (item: any) => {
                        return {
                            title: item.title,
                        };
                    })
                );

                await LayoutModel.findByIdAndUpdate(categoryId._id, {
                    type: "CATEGORY",
                    category: categoryItems,
                });
            }

            res.status(200).json({
                success: true,
                message: "Layout Updated Successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// Get Layout By Type
export const getLayoutByType = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            if (!type) {
                return next(
                    new ErrorHandler("Please provide layout type", 400)
                );
            }

            const layout = await LayoutModel.findOne({ type });

            if (!layout) {
                return next(new ErrorHandler("Layout Not Found", 500));
            }

            res.status(200).json({
                success: true,
                layout,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
