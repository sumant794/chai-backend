import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/APiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body
    console.log(content)

    if(!content.trim()){
        throw new ApiError(400, "Empty tweets not allowed")
    }

    const tweet = await Tweet.create({
        content:content,
        owner:req.user._id
    })
    console.log(tweet)

    const createdTweet = await Tweet.findById(tweet._id)
    if(!createdTweet){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }
    console.log(createdTweet)

    return res
    .status(201)
    .json(
        new ApiResponse(201, createdTweet, "Tweeted Successfully")
    )

})

const getUserTweets = asyncHandler(async(req, res) => {
    const { userId } = req.params
    console.log(userId)
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Object id")
    }

   // if(req.user._id.toString() !== userId){
   //     throw new ApiError(403, "You are not allowed to access this data")
   // }

   const userTweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                ownerDetails:{$first: "$ownerDetails"}
            }
        }
        //add sort later
   ])

  // if (userTweets.length === 0) {
  //  return res
   //      .status(200)
  //       .json(new ApiResponse(200, [], "No tweets found"))
   // }
   console.log(userTweets)
   if(!userTweets?.length){
        throw new ApiError(404, "tweets do not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "User tweets fetched successfuly")
    )
})

const updateTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params
    console.log(tweetId)

    const { content } = req.body
    console.log(content)

    if(!content.trim()){
        throw new ApiError(400, "Empty comments not allowed")
    }

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "Inavlid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    console.log(tweet)

    if(!tweet){
        throw new ApiError(500, "Tweet does not exist")
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(403, "User not authorized")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:content
            }
        },
        {new: true}
    )
    console.log(updatedTweet)
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet Updated Successfully")
    )

})

const deleteTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params
    console.log(tweetId)

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "Inavlid tweet id")
    }
     
    const deletedTweet = await Tweet.findOneAndDelete(
        { _id: tweetId, owner: req.user._id }
    )
    console.log(deletedTweet)
    
    if(!deletedTweet){
        throw new ApiError(400, "Tweet not found or unvalid tweet id or user mismatch")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet deleted Successfullly")
    )
})

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}