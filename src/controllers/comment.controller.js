import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const video=await Video.findById(videoId)
  // if(!isValidObjectId(videoId)){
  //   throw new ApiError('Invalid video id', 400)
  // }
  
  const comments=await Comment.aggregate([
    {
      $match:{
        video: mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"ownerDetails"
      }
    },
    {
      $project:{
        comment:1
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(
    200,comments,"Comments fetched successfully"
  ))
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId, text } = req.body;
  if (!videoId || !text?.trim()) {
    throw new ApiError(400, "VideoId and comment are required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    return new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    text,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(400, "Failed to add comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { text } = req.body;
  const { commentId } = req.params;

  if (!text) {
    throw new ApiError(400, "Comment should not be empty");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update comment");
  }
  comment.comment = text;
  const updatedComment = await comment.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const{commentId}=req.params
  const comment=await Comment.findById(commentId)

  if(!comment){
    throw new ApiError(400,"Comment not found")
  }
  if(comment.owner.toString()!==req.user._id.toString()){
    throw new ApiError(403,"Not authorized to delete comment")
  }
  await comment.remove()
  return res
  .status(200)
  .json(
    new ApiResponse(
        200,{},"Comment deleted successfully"
    )
  )
});

export { getVideoComments, addComment, updateComment, deleteComment };
