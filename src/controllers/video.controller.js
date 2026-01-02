import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/APiResponse.js"
//get all videos 



const getAllVideos = asyncHandler(async(req, res) => {
    const { page=1, limit=10, query, sortBy, sortType, userId } = req.query
    console.log(req.query)
    
    //TODO: get all videos based on query, sort, pagination

    // how to use query or how to get videos on the basis of query
    const Page = Number(page)
    const Limit = Number(limit)
    const skip = Number((Page - 1) * Limit)

    let sortOrder = sortType === "asc"? 1: -1;
    let sortStage = {
        [sortBy || "createdAt"]: sortOrder
    };

    let AllVideos
    if(query){
       AllVideos =  await Video.aggregate([
        {
            $match:{
                $or: [
                    {title: {$regex: query, $options:"i"}},
                    {description: {$regex: query, $options: "i"}}
                ],
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $addFields: {
                views: {$toInt: "$views"}
            }
        },
        {
            $sort: sortStage
        },
        {
            $skip: skip
        },
        {
            $limit: Limit
        }
       ])
        console.log(AllVideos)
    }else{
        AllVideos  = await Video.aggregate([
            {
                $sort: sortStage
            },
            {
                $skip: skip
            },
            {
                $limit: Limit
            }
        ])
        console.log(AllVideos)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            AllVideos,
            "All Videos fetched succesfully"
        )
    )

})

// delete video 

//add video to playlist




export {getAllVideos}