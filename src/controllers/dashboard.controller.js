import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    // Video statistics
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
            },
        },
    ]);

    // Subscriber count
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId,
    });

    // Get all video ids of this channel
    const videos = await Video.find({ owner: channelId }, { _id: 1 });

    const videoIds = videos.map((video) => video._id);

    // Total likes on all videos
    const totalLikes = await Like.countDocuments({
        video: {
            $in: videoIds,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos: videoStats[0]?.totalVideos || 0,
                totalViews: videoStats[0]?.totalViews || 0,
                totalSubscribers,
                totalLikes,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    // Get all videos uploaded by the logged-in user
    const videos = await Video.find({
        owner: channelId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
