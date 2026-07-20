exports.appError = () => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
