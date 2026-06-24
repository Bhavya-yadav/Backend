import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    // get all videos based on query, sort, pagination

    if( !(query?.trim && userId) ){
        throw new ApiError(400,"Query and UserId required")
    }

    const searchAndSort = await Video.aggregate([
        {
            $match : {
                isPublished : true,
                regex : query,
                $options : "i",
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {   
            $addFields : {
                owner : {
                    $first :"$owner" 
                }
            },
        },
        {
            $sort : {
                views : -1,
                createdAt : -1,
            }
        },
    ])

    const videos = await Video.aggregatePaginate(searchAndSort, { page , limit });

    // Discarded this as there could actually be no vid that has that query
    // if(!videos){
    //     throw new ApiError(404,"No videos found")
    // }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos , "Vidoes Fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // get video, upload to cloudinary, create video

    if (!title?.trim() || !description?.trim()) {
    throw new ApiError( 400 , "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if( !videoLocalPath || !thumbnailLocalPath ){
        throw new ApiError(400, "Video or Thumbnail file is missing")
    }

    const uploadVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!uploadVideo || !uploadThumbnail){
        throw new ApiError(500,"Failed to upload video or thumbnail on Cloudinary")
    } 

    const video = await Video.create(
        {
            videoFile : uploadVideo.secure_url,
            thumbnail : uploadThumbnail.secure_url,
            title,
            description,
            duration: uploadVideo.duration,
            owner: req.user._id
        }
    );

    return res
    .status(201)
    .json(
        new ApiResponse(200 , video , "Video Published Successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // get video by id

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project : {
                title : 1,
                description : 1,
                thumbnail : 1,
                duration : 1,
                views : 1,
                createdAt : 1,
                "owner.username" : 1,
                "owner.avatar" : 1,
                "owner.fullName" : 1
            }
        }
    ]);

    if (!video.length) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(200)
    .json( new ApiResponse(200 , video , "Video Found Successfully")) 
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title , description} = req.body
    // update video details like title, description, thumbnail

    const thumbnailLocalPath = req.file.path

    if(!thumbnailLocalPath){
        throw new ApiError(400 , "Thumbnail file does not exist")
    }

    const uploadThumbnail = uploadOnCloudinary(thumbnailLocalPath)

    const updateVideo = new Video.aggregate([
        {
            $match : "videoId"
        },
        {
            $set : {
                title,
                description,
                thumbnail : udloadThumbnail.secure_url,
            }
        },
        {
            returnDocument : "after"
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    );
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // delete video

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(200)
    .json( new ApiResponse( 200 ,{} ,"Video deleted successfully" ));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json( new ApiResponse( 200 , video , "Publish status toggled successfully" ))
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}