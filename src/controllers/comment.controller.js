import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APiError.js"
import { User } from "../models/user.model";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/APiResponse";



//get all comments from database


// get comment from frontend

const saveComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const {videoId} = req.params

    if(!content.trim()){
        throw new  ApiError(400, "Empty comments not allowed")
    }

    if ( !isValidObjectId( videoId ) ){
        throw new Apierror( 500, {}, "Invalid video" ) 
    }

    const comment =  await Comment.create({
        content: content,
        video: videoId,
        owner: new mongoose.Types.ObjectId( req.user?._id )
    })

    const createdComment = Comment.findById(comment._id)

    if(!createdComment){
        throw new ApiError(500, "something went wrong while creating comment")
    }

    return res
    .status(201).json(
        new ApiResponse(200, createdComment, "Comment Added Succesfully")
    )

})

// validate commment
//save comment to database

//delete comment

//update comment

//likes on comment
