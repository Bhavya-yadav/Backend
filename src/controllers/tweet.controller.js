import { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createTweet = asyncHandler(async (req, res) => {
    // get content
    const { content } = req.body;

    // Validate input
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
        throw new ApiError(400, 'Content is required');
    }

    // Create tweet
    const tweet = await Tweet.create({
        content: trimmedContent,
        owner: req.user._id,
    });

    if (!tweet) {
        throw new ApiError(500, 'Failed to create tweet');
    }

    return res.status(201).json(new ApiResponse(201, tweet, 'Tweet was created successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // Get user tweets
    // If length is 0 throw error else return tweets
    const { username } = req.params;

    const user = await User.findOne({
        username: username.toLowerCase(),
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const tweets = await Tweet.find({
        owner: user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tweets, 'Tweets fetched Successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
    // get tweetId and description
    // match user and owner
    // update if all is success

    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid Tweet ID');
    }

    const trimmedContent = content?.trim();

    if (!trimmedContent) {
        throw new ApiError(400, 'Content is required');
    }

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id,
        },
        {
            $set: {
                content: trimmedContent,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    if (!tweet) {
        throw new ApiError(404, 'Tweet not found or Unauthorized Access');
    }

    return res.status(200).json(new ApiResponse(200, tweet, 'Tweet was Updated Successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
    // get tweetId and description
    // match user and owner
    // update if all is success

    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid Tweet ID');
    }

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id,
    });

    if (!tweet) {
        throw new ApiError(404, 'Tweet not found or unauthorized');
    }

    return res.status(200).json(new ApiResponse(200, {}, 'Tweet was Deleted Successfully'));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
