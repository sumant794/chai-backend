import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/APiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body

    if(!content.trim()){
        throw new ApiError(400, "Empty tweets not allowed")
    }

    const tweet = await Tweet.create({
        content:content,
        owner:req.user._id
    })

    const createdTweet = await Tweet.findById(tweet._id)
    if(!createdTweet){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, createdTweet, "Tweeted Successfully")
    )

})