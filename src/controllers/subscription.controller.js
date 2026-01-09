import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/APiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/APiResponse.js";


const toggleSubscription = asyncHandler(async(req, res) => {
    const {channelId} = req.params
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid ChannelId")
    }


    // to check if channel id is in subscription schema ka subscription field
    // 1 we need subcription model
    const existingSubscriber = await Subscription.findOne(
        {channel: channelId, subscriber: req.user._id} 
    )
    //console.log(existingSubscriber)

    if(!existingSubscriber){
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if(!subscription){
            throw new ApiError(500, "Something went wrong while creating subscriber")
        }

      //console.log(subscription)

        return res
        .status(201)
        .json(
            new ApiResponse(200, subscription, "You Subscribed!!!")
        )
    } else{
        const deletedSubscriber = await Subscription.findOneAndDelete(
            {channel: channelId, subscriber: req.user._id}
        )

        //console.log(deletedSubscriber)
        if(!deletedSubscriber){
            throw new ApiError(500, "Something went wrong while removing subscriber")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "You Unsubscribed")
        )
    }
})

const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    const { channelId } = req.params
    console.log(channelId)
    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid ChannelId")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                            {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                            }
                         ]
            }
        },

        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
         /*
        {
            $unwind:"$subscribers"
        },
        
        {
            $project: {
                _id: 0,
                subscribers:{
                    _id: 1,
                    username,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
            */
    ])

    console.log(subscribers)

    if(!subscribers?.length){
        throw new ApiError(400, "Subscribers do not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribers fetched Succesfully")
    )
})


const getSubscribedChannels = asyncHandler(async(req, res) => {
    const { channelId } = req.params
    console.log(channelId)

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Subscriber Id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        
        {
            $lookup:{
                from:"users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
       
        {
            $unwind:"$subscribedChannels"
        },
        {
            $project:{
                _id: 0,
                subscribedChannels:{
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])

    console.log(subscribedChannels)

    if(!subscribedChannels?.length){
        throw new ApiError(400, "No Subscribed Channels!!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "Subscribed Channels fetched succesfully")
    )
})







export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}