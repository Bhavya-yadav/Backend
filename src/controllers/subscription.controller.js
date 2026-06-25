import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    // search by channelId and userId
    // if not there then do a db entry and vice versa

    if( !isValidObjectId(channelId) ){
        throw new ApiError(400, "Invalid Channel Id")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if( existingSubscription ) {
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel unsubscribed"));
    
    }
    else {
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });

        return res
        .status(200)
        .json(new ApiResponse(200, subscription , "Channel subscribed"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscribers = await Subscription.find({
        channel: channelId
    });

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channels = await Subscription.find({
        subscriber: subscriberId
    });
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}