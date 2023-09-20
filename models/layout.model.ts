import mongoose, { Document, Model, Schema } from "mongoose";

interface IFAQItem extends Document {
    question: string;
    answer: string;
}

interface ICategory extends Document {
    title: string;
}

interface IBannerImage extends Document {
    public_id: string;
    url: string;
}

interface Layout extends Document {
    type: string;
    category: ICategory[];
    faq: IFAQItem[];
    banner: {
        image: IBannerImage;
        title: string;
        subtitle: string;
    };
}

const faqSchema = new Schema<IFAQItem>({
    question: {
        type: String,
    },

    answer: {
        type: String,
    },
});

const categorySchema = new Schema<ICategory>({
    title: { type: String },
});

const bannerImageSchema = new Schema<IBannerImage>({
    public_id: { type: String },
    url: { type: String },
});

const layoutSchema = new Schema<Layout>({
    type: { type: String },
    faq: [faqSchema],
    category: [categorySchema],

    banner: {
        image: bannerImageSchema,
        title: { type: String },
        subtitle: { type: String },
    },
});

const LayoutModel: Model<Layout> = mongoose.model("Layout", layoutSchema);

export default LayoutModel;
