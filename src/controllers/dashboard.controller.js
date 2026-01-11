import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/APiResponse.js";

const getChannelStats = asyncHandler(async(req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.query
    
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Inavlid channelId")
    }

    const channel = channelId || req.user._id

    const videoStats = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channel)
            }
        },
        {
            $group:{
                _id:null,
                totalVideos:{$sum:1},
                totalViews:{$sum:"$views"}
            }
        }
    ])

    const susbcriberStats = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channel)
            }
        },
        {
            $group:{
                _id:null,
                totalSubscribers:{ $sum:1 }
            }
        }
    ])

    const videoIds = await Video.find(
        {owner:channel},
        {_id:1}
    )

    const totalLikesOnVideos = await Like.aggregate([
        {
            $match:{
                video:{$in:videoIds.map(v => v._id)}
            }
        },
        {
            $count: "totalVideoLikes"
        }
    ])

    const commentIds = await Comment.find(
        {owner:channel},
        {_id: 1}
    )

    const totalLikesOnComments = await Like.aggregate([
        {
            $match:{
                comment:{$in:commentIds.map(c => c._id)}
            }
        },
        {
            $count: "totalCommentLikes"
        }
    ])

    const tweetIds = await Comment.find(
        {owner:channel},
        {_id: 1}
    )

    const totalLikesOnTweets = await Like.aggregate([
        {
            $match:{
                tweet:{$in:tweetIds.map(t => t._id)}
            }
        },
        {
            $count: "totalTweetLikes"
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, totalLikesOnVideos, "Total Likes fetched Successfully")
    )

})

const getChannelVideos = asyncHandler(async(req, res) => {
    const {channelId} = req.query
    
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Inavlid channelId")
    }

    const channel = channelId || req.user._id

    const channelVideos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channel)
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelVideos,
            "Channel videos fetched Succesfully"
        )
    )

})

export{
    getChannelStats,
    getChannelVideos
}