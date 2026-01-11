import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/APiResponse.js";

const getChannelStats = asyncHandler(async(req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.query
    
    const channel = channelId || req.user._id
    console.log(channel)

    if(!mongoose.isValidObjectId(channel)){
        throw new ApiError(400, "Inavlid channelId")
    }
    // give a response if no stats for channel, like, comment etc found!
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
    console.log(videoStats)

    const subscriberStats = await Subscription.aggregate([
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

    console.log(subscriberStats)

    const videoIds = await Video.find(
        {owner:channel},
        {_id:1}
    )
    console.log(videoIds)

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
    console.log(totalLikesOnVideos)

    const commentIds = await Comment.find(
        {owner:channel},
        {_id: 1}
    )
    console.log(commentIds)

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
    console.log(totalLikesOnComments)

    const tweetIds = await Comment.find(
        {owner:channel},
        {_id: 1}
    )
    console.log(tweetIds)

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
    console.log(totalLikesOnTweets)
    const totalLikes = totalLikesOnVideos[0].totalVideoLikes + totalLikesOnComments[0].totalCommentLikes + totalLikesOnTweets[0].totalTweetLikes

    return res
    .status(200)
    .json(
        new ApiResponse(200, {totalLikes:totalLikes, videoStats, subscriberStats},"Total Likes fetched Successfully")
    )

})

const getChannelVideos = asyncHandler(async(req, res) => {
    const {channelId} = req.query
    
    const channel = channelId || req.user._id
    console.log(channel)

    if(!mongoose.isValidObjectId(channel)){
        throw new ApiError(400, "Inavlid channelId")
    }

    const channelVideos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channel)
            }
        } 
    ])
    //give a resposnse if no video found
    console.log(channelVideos)
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