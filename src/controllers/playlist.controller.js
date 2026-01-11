import mongoose, {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/APiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body
    console.log(name)
    console.log(description)

    if(!name && !description){
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id
    })
    console.log(playlist)
    const createdPlaylist = await Playlist.findById(playlist._id)
    console.log(createdPlaylist)
    if(!createdPlaylist){
        throw new ApiError(500, "Something went wrong while creating a playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, createdPlaylist, `${createdPlaylist.name} playlist created successfully`)
    )

})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const {userId} = req.params
    console.log(userId)
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid UserId")
    }

    /*if(!userId.equals(req.user._id)){
        throw new ApiError(403, "User not authorized")
    }*/

    //const userPlaylist = await Playlist.findOne({owner:userId})

    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner_details",
                            pipeline: [
                                {
                                    $project:{
                                        fullName:1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                videoDetails:{$first:"$videoDetaills"}
            }
        }
    ])
    console.log(userPlaylist)
    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylist, "User Playlist fetched successfully")
    )

})

const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    console.log(playlistId)

    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const existingPlaylist = await Playlist.findById(playlistId)
    console.log(existingPlaylist)
    if(!existingPlaylist){
        return res
        .status(200)
        .json(
            new ApiResponse(200, "Playlist does not exist")
        )
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            ownerDetails:{$first:"$ownerDetails"}
                        }
                    }
                ]
            }
        }
        
    ])
    console.log(playlist)
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched succesfully")
    )
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {videoId, playlistId} = req.params
    console.log(videoId)
    console.log(playlistId)

    if(!(mongoose.isValidObjectId(videoId) && mongoose.isValidObjectId(playlistId))){
        throw new ApiError(400, "Invalid playlist id or video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist not found for this playlist id")
    }
    console.log(playlist)

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "User not authorized to access playlist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found")
    }
    console.log(video)

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId }

        },
        {new:true}
    )
    console.log(updatedPlaylist)

    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while adding video to playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video Added to Playlist Succesfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {videoId, playlistId} = req.params
    console.log(videoId)
    console.log(playlistId)

    if(!(mongoose.isValidObjectId(videoId) && mongoose.isValidObjectId(playlistId))){
        throw new ApiError(400, "Invalid playlist id or video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist not found for this playlist id")
    }
    console.log(playlist)

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "User not authorized to access playlist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found")
    }
    console.log(video)
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }

        },
        {new:true}
    )
    console.log(updatedPlaylist)
    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while removing video from playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video removed from Playlist Succesfully")
    )
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Play list not found or playlist id is mismatched")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "User anauthorized to delete playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(500, "Something went wrong while deleting playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "playlist deleted succesfully")
    )

})

const updatePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    const{name, description} = req.body
    console.log(playlistId)
    console.log(name)
    console.log(description)

    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    if(!name && !description){
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist not found for this playlist id")
    }
    console.log(playlist)

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "User not authorized to access playlist")
    }


    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:name,
                description:description
            }

        },
        {new:true}
    )
    console.log(updatedPlaylist)
    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while updating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated Succesfully")
    )
})


export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}


