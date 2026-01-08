import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/APiResponse.js"
import { ApiError } from "../utils/APiError.js"
import { deleteFromCloudinary, uploadOnCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js"
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

const getVideoById = asyncHandler(async(req, res) => {
    const{ videoId } = req.params


    if(!videoId?.trim() === ""){
        throw new ApiError(400, "video id is missing")
    }

    const video = await Video.findById(videoId)
    //await lagana mat bhulna
    
    if(!video){
        throw new ApiError(500, "something went wrong while getting video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, video, "video fetched successfully")
    )
})

const addVideo = asyncHandler(async(req, res) => {
    // get video details -> videoFile, thumbnail, title, description, duration, views
    const {title, description, duration, views} = req.body;
    console.log(req.body)
    const Duration = Number(duration)
    const view = Number(views)

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description should not be empty");
    }

    if (typeof Duration !== "number" || duration <= 0) {
        throw new ApiError(400, "Duration is not Valid")
    }

    if (typeof view !== "number" || views < 0) {
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
        videoFile: videoUrl.url,
        thumbnail: thumbnail?.url || "",
        title,
        description,
        duration: Duration,
        views: view,
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

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    
    if(!videoId?.trim() === ""){
        throw new ApiError(400, "video id is missing")
    }

    const { title, description } = req.body

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description should not be empty");
    }
    //console.log(req.file)
    const thumbnailLocalFilePath = req.file?.path
    if(!thumbnailLocalFilePath){
        throw new ApiError(400, "thumbnail is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath)
    //console.log(thumbnail)
    if(!thumbnail){
        throw new ApiError(500, "Error while uploading thumbnal to cloudinary")
    }

    const video = await Video.findById(videoId)
    //console.log(video)
    const oldThumb = video.thumbnail
    //console.log(oldThumb)
    const deletedOldThumbnail = await deleteFromCloudinary(oldThumb)

    if(!deletedOldThumbnail){
        throw new ApiError(400, "thumbnail not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail: thumbnail.url,
                title: title,
                description: description
            }
        },
        {new: true}
    )

    return res
    .status(201)
    .json(
        new ApiResponse(200, updatedVideo, "video details updated succesfully")
    )

})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    
    if(!videoId?.trim() === ""){
        throw new ApiError(400, "VideoId is missing")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Invalid Video Id")
    }
    console.log(video)
    const {videoFile, thumbnail} = video;

    const deletedVideoFile = await deleteVideoFromCloudinary(videoFile)
    if(!deletedVideoFile){
        throw new ApiError(400, "Something went wrong while deleting from cloudinary ot invalid videoFile")
    }

    const deletedThumbnail = await deleteFromCloudinary(thumbnail)
    if(!deletedThumbnail){
        throw new ApiError(400, "Something went wrong while deleting from cloudinary ot invalid thumbnail file")
    }

    console.log(videoFile)
    console.log(thumbnail)


    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(400, "Video not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, "Video Deleted Successfully")
    )
})


const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    let isPublished = true

    const publishStatus = await Video.findById(videoId).select("isPublished")

    if(publishStatus.isPublished){
        isPublished = false
    }else{
        isPublished = true
    }

    const videoPublished = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: isPublished
            }
        },
        {new: true}
    ).select("isPublished")

    return res
    .status(201)
    .json(
        new ApiResponse(200, videoPublished, "Publish Status Changed Successfully")
    )
})






export {
    getAllVideos,
    getVideoById,
    addVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}