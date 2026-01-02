import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/APiResponse.js"
import { ApiError } from "../utils/APiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
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

const addVideo = asyncHandler(async(req, res) => {
    // get video details -> videoFile, thumbnail, title, description, duration, views
    const {title, description, duration, views} = req.body;

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description should not be empty");
    }

    if (typeof duration !== "number" || duration <= 0) {
        throw new ApiError(400, "Duration is not Valid")
    }

    if (typeof views !== "number" || views < 0) {
        throw new ApiError(400, "Views is not Valid")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    if(!videoFileLocalPath){
        throw new ApiError(400, "Video File is required")
    }

    const videoUrl = await uploadOnCloudinary(videoFileLocalPath)
    if(!videoUrl){
        throw new ApiError(400, "Something went wrong while uploading")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        fileName: videoUrl.url,
        thumbnail: thumbnail?.url || "",
        title,
        description,
        duration,
        views,
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, createdVideo, "Video Uploaded Successfully")
    )

})


// delete video 

//add video to playlist




export {
    getAllVideos,
    addVideo
}