import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/APiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/APiResponse.js";

const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const existingLike = await Like.findOne(
        { video:videoId, likedBy:req.user._id }
    )

    if(!existingLike){
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        const createdLike = await Like.findById(like._id)
        if(!createdLike){
            throw new ApiError(500, "Something went wrong while creating like")
        }

        return res
        .status(201)
        .json(
            new ApiResponse(201, createdLike, "Like added Successfully")
        )
    }else{
        const deletedLike = await Like.findByIdAndDelete(
            { video:videoId, likedBy:req.user._id }
        )

        if(!deletedLike){
            throw new ApiError(500, "Something went wrong while deleting like")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, "Like Removed Successfully")
        )

    }

})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    const existingLike = await Like.findOne(
        {comment: commentId, likedBy: req.user._id}
    )

    if(!existingLike){
        const like = await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })

        const createdLike = await Like.findById(like._id)
        if(!createdLike){
            throw new ApiError(500, "Something went wrong while creating like for comment")
        }

        return res
        .status(201)
        .json(
            new ApiResponse(201, createdLike, "Comment Liked!!!")
        )
    }else{
        const deletedLike = await Like.findOneAndDelete(
            {comment: commentId, likedBy: req.user._id}
        )

        if(!deletedLike){
            throw new ApiError(500, "Something went wrong while removing like from comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, "Comment Unliked!!!")
        )
    }

})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweeet Id")
    }

    const existingLike = await Like.findOne(
        {tweet:tweetId, owner:req.user._id }
    )

    if(!existingLike){
        const like = await Like.create({
            tweet:tweetId,
            owner:req.user._id 
        })

        const createdLike = await Like.findById(like._id)
        if(!createdLike){
            throw new ApiError(500, "Something went wrong while creating like for tweet")
        }

        return res
        .status(201)
        json(
            new ApiResponse(201, createdLike, "Tweet liked!!")
        )
    }else{
        const deletedLike = await Like.findOneAndDelete(
            {tweet:tweetId, owner:req.user._id}
        )

        if(!deletedLike){
            throw new ApiError(500, "Something went wrong while removing like from tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, "Tweet DisLiked!!!")
        )

    }
})

const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $ne: null }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video_details"
            }
        },
        {
            $addFields:{
                video_details: {
                    $first:"$video_details"
                }
            }
        },
        {
            $project:{
                video: 1,
                likedBy: 1,
                video_details:1
            }
        }

    ])

    if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No Liked Videos found"))
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Liked Vidoes fetched successfully")
    )

})


export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}