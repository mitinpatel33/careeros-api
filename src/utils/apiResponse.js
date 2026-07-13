export const successResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
        }
    })
}

export const errorResponse = (res, message = "Something went wrong", statusCode = 500, errors = []) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
        errors,
        meta: {
            timestamp: new Date().toISOString(),
        },
    })
} 