import { ApiResponse } from "../utils/APiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
//import {ApiError} from "../utils/ApiError.js"
//import {ApiResponse} from "../utils/ApiResponse.js"

const healthcheck = asyncHandler(async (req, res) => {
    console.log("helathcheck")
    return res.status(200).json(
        new ApiResponse(200, {Status:"ok"}, "Serever is running")
    )
})

export{healthcheck}
