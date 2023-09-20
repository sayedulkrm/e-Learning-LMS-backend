import { Document, Model } from "mongoose";

interface IMonthData {
    month: string;
    count: number;
}

// 7:42:00 ===>

export async function generateLast12MonthData<T extends Document>(
    model: Model<T>
): Promise<{ last12Months: IMonthData[] }> {
    const last12Months: IMonthData[] = [];

    const currentData = new Date();

    currentData.setDate(currentData.getDate() + 1);

    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(
            currentData.getFullYear(),
            currentData.getMonth(),
            currentData.getDate() - i * 28
        );

        const startDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate() - 28
        );

        const monthYear = endDate.toLocaleString("default", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        //

        last12Months.push({ month: monthYear, count });

        //
        //
    }

    return { last12Months };
}
