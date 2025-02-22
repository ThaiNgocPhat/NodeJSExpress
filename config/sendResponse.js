import { httpMessage, httpStatus } from "./httpStatus.js";

export const sendResponseSuccess = (res, data) => {
    return res.status(httpStatus.Success).json({
        message: httpMessage.Success,
        data: data
    })
}

export const sendResponseError = (res, error) => {
    return res.status(httpStatus.Error).json({
        message: httpMessage.ErrorServer,
        error: error
    })
}