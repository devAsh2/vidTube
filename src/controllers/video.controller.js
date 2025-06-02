import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { APIResponse } from "../utils/APIResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const aggregate = [];
//filter by query
  if (query) {
    aggregate.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },  // i regex is used to match case insensitively
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }
const userid = await User.findById(userId);
if(!userid){
    throw new APIError("User not found", 404, true);
}

//add another stage to filter only videos owned by the user
  if (userid && isValidObjectId(userid)) {
    aggregate.push({
      $match: {
        owner: mongoose.Types.ObjectId(userid),
      },
    });
  }

  // Add the sorting stage
  if (sortBy && sortType) {
    const sortDirection = sortType === "asc" ? 1 : -1;
    aggregate.push({
      $sort: { [sortBy]: sortDirection },
    });
  }

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
  };

  const getVideos = await Video.aggregatePaginate(aggregate, options);

  res
    .status(200)
    .json(new APIResponse(200, getVideos, "Videos retrieved successfully"));
});

const publishAtVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoPath = req.file?.video;
  if (!videoPath) {
    return next(new APIError("Video file is required", 400));
  }

  const uploadedVideo = await uploadOnCloudinary(videoPath);

  const video = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url,
  });

  res
    .status(200)
    .json(new APIResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);

  res
    .status(200)
    .json(new APIResponse(200, video, "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        thumbnail: req.body.thumbnail,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new APIResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new APIResponse(200, deletedVideo, "Video updated successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: toggle publish status
  const videoStatus = await Video.findById(videoId);
  if (videoStatus.isPublished) {
    await Video.findByIdAndUpdate(videoId, { $set: { isPublished: false } });
  } else {
    await Video.findByIdAndUpdate(videoId, { $set: { isPublished: true } });
  }

  res
    .status(200)
    .json(
      new APIResponse(200, videoStatus, "Publish status toggled successfully")
    );
});

export {
  getAllVideos,
  publishAtVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
