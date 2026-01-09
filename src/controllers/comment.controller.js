import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APiError.js"
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/APiResponse.js";



//get all comments from database
const getVideoComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    console.log(videoId)

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const { page = 1, limit = 10 } = req.query
    console.log(req.query)

    const Page = Number(page)
    const Limit = Number(limit)
    const skip = Number((Page - 1) * Limit)

    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"comment_owner"
            }
        },
        {
            $unwind:"$comment_owner"
        },
        {
            $project:{
                content:1,
                video: 1,
                owner: 1,
                _id:1,
                comment_owner:{
                    id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                }
            }
        },
        {
            $skip:skip
        },
        {
            $limit:Limit
        }
    ])

    console.log(comments)

    if(comments.length === 0){
        new ApiResponse(200, [], "No Comments found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "comments fetched successfully")
    )

})


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const {videoId} = req.params
    console.log(content)
    console.log(videoId)

    if(!content.trim()){
        throw new  ApiError(400, "Empty comments not allowed")
    }

    if ( !isValidObjectId( videoId ) ){
        throw new ApiError( 400, {}, "Invalid video id" ) 
    }

    const comment =  await Comment.create({
        content: content,
        video: videoId,
        owner: new mongoose.Types.ObjectId( req.user?._id )
    })

    console.log(comment)

    const createdComment = await Comment.findById(comment._id)
    console.log(createdComment)

    if(!createdComment){
        throw new ApiError(500, "something went wrong while creating comment")
    }

    return res
    .status(201).json(
        new ApiResponse(200, createdComment, "Comment Added Succesfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    console.log(content)

    const { commentId } = req.params
    console.log(commentId)

    if(!content.trim()){
        throw new ApiError(400, "Empty comments not allowed")
    }

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const oldComment = await Comment.findById(commentId)
    console.log(oldComment)

    if(!oldComment){
        throw new ApiError(500, "Comment not found")
    }

    if(!oldComment.owner.equals(req.user._id)){
        throw new ApiError(403, "User not authorized")
    }


    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },
        {new: true}
    )
    console.log(updatedComment)

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "comment updated succesfully" )
    )

})

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    console.log(commentId)

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId)
    console.log(comment)

    if(!comment){
        throw new ApiError(500, "Comment not found")
    }

    if(!comment.owner.equals(req.user._id)){
        throw new ApiError(403, "User not authorized")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment deleted successfully")
    )

})



export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
