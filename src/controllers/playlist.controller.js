import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "./video.controller.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(400, "Failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        owner: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError("Failed to get playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError("Invalid playlist id");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }
  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup:{
        from:"videos",
        localField:"videos",
        foreignField:"_id",
        as:"videoDetails"
      },
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
      $addFields: {
        totalVideos: {
          $size: "$videoDetails",
        },
        totalViews: {
          $sum: "$videoDetails.views",
        },
      },
    },
    {
      $project:{
        name:1,
        description:1,
        totalVideos:1,
        totalViews:1,
        ownerDetails:{
          fullname:1,
          email:1
        },
        videoDetails:{
          _id:1,
          title:1,
          thumbnail:1,
          description:1,
          views:1,
          isPublished:1,
          duration:1

        }
      }
    },
  ]);
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,userPlaylist[0],"Playlist fetched successfully"
    )
  )
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  if (
    playlist.owner.toString() !== req.user._id.toString() ||
    video.owner.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(400, "Only the owner can add a video to their playlist");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Failed to add video in playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video Id");
  }
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (
    playlist.owner.toString() !== req.user._id.toString() ||
    video.owner._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Only owner can remove video from their playlist");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(400, "Failed to remove video from playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from Playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to edit playlist");
  }
  await playlist.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id ");
  }
  if (!name || !description) {
    throw new ApiError(400, "Name and Description is required ");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to edit playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
