export const appError = () => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
