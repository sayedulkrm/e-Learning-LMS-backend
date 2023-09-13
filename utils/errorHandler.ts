class ErrorHandler extends Error {
    statusCode: number; // Define the property here

    constructor(message: any, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export default ErrorHandler;
