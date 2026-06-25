import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    // get description
    const { description } = req.body

    // Validate input
    if (!description?.trim()) {
        throw new ApiError(400, "Tweet description is required");
    }

    // Create tweet
    const tweet = await Tweet.create({
        description,
        owner: req.user._id, 
    });

    if(!tweet){
        throw new ApiError(500,"Failed to create tweet")
    }

    return res
    .status(201)
    .json( new ApiResponse(200 , tweet , "Tweet was created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}