import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    const liked=Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })
    if(liked){
        await Like.deleteOne(liked?._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,{},"Like removed successfully"
            )
        )
    }
    else{
        await Like.create({
            video:videoId,
            likedBy:req.user?._id
        })
        return res
        .status(200)
        .json(new ApiResponse(
            200,{},"Like added successfully"
        ))
    }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid comment Id")
    }
    const liked=await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })
    if(liked){
        await Like.deleteOne(liked?._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,{},"Like removed successfully"
            )
        )
    }
    else{
        await Like.create({
            comment:commentId,
            likedBy:req.user?._id
        })
        return res
        .status(200)
        .json(new ApiResponse(
            200,{},"Like added successfully"
        ))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const liked=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    if(liked){
        await Like.deleteOne(liked?._id)

        return res
        .status(200)
        .json(new ApiResponse(
            200,{},"Like removed successfully"
        ))
    }
    else{
        await Like.create(
            {
                tweet:tweetId,
                likedBy:req.user?._id
            }
        )
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,{},"Like added successfully"
            )
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}