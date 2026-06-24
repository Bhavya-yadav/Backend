import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from  "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new ApiError(500, "Token generation failed", [], error?.stack || "");
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // Get user details from the frontend : Extracting input data like full name etc the request body.
    // Validation : Checking if any of the mandatory fields are empty.
    // Check if user already exists: Verifying if a user with the same email or username is already present in the database.
    // Handle file uploads: Checking for the presence of files & ensuring the mandatory avatar is provided.
    // Upload to Cloudinary: Uploading the files to the Cloudinary service and obtaining their URLs.
    // Create user object: Constructing the final user object with all necessary information.
    // Database Entry
    // Clean up response: Removing sensitive fields like the password and refresh token from the final response object.
    // Check for user creation and return response

    // Step 1
    const { fullName, email, username, password } = req.body;
    // console.log("\n req.body :", req.body);
    // console.log("\n req.files :", req.files);
    // console.log("\n Extracted - fullName:", fullName, "email:", email, "username:", username, "password:", password);
 
    // Step 2
    if ([fullName, email, username, password].some((field) => !field || field?.trim() === "")) {
        console.log("Validation failed - Fields:", { fullName, email, username, password });
        throw new ApiError(400, "All fields are required");
    }

    // Step 3
    const exitingUser = await User.findOne({ 
        $or : [{ email }, { username }]
    })

    if(exitingUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    // Step 4
    console.log("Files received:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && req.files.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    
    // Step 5
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // Checking is avatar is created or not as it is required field
    if(avatar === null){
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    // Step 6 & 7
    const user = await User.create({
        fullName,
        avatar : avatar.secure_url,
        coverImage : coverImage.secure_url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // Step 8
    const newUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!newUser){
        throw new ApiError(500, "User registration failed");
    }

    // Step 9
    return res.status(201).json(
        new ApiResponse(200, newUser, "User Registered Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {

    //  Get login credentials & Validate input
    //  Find user by email
    //  Check if password is correct
    //  Generate access token and refresh token
    //  Save refresh token in database 
    //  Set refresh token in httpOnly cookie


    // Step 1
    const { email, password, username } = req.body;

    if(!email && !password){
        throw new ApiError(400, "Email and password are required");
    }

    // Step 2
    const user = await User.findOne({
        $or : [{ email }, { username }]
    })

    if(!user){
        throw new ApiError(404, "User not Registered");
    }

    // Step 3
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }

    // Step 4
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Step 5 & 6
    user.refreshToken = refreshToken;

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
                user,
                accessToken,
                refreshToken,
            },
            "User Logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1 // marks this field for removal
            }
        },
        {
            returnDocument: "after"
        }
    )
``
    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json( new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler( async (req, res) =>{
    const incomingRefreshToken = req.cookies.refresh || req.body.refreshToken;

    if( !incomingRefreshToken ){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const { _id } = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET );
            
        const user = await User.findById(_id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken : newRefreshToken,
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler( async (req,res) => {
    const { oldPassword , newPassword , confPassword} = req.body

    if( !(newPassword === confPassword) ){
        throw new ApiError(400,"New and Confirm Password are not same")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordcorrect = await user.isPasswordCorrect( oldPassword )

    if( !isPasswordcorrect ){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save( {
        validateBeforeSave : false,
    })

    return res
    .status(200)
    .json( new ApiResponse(200 , {}, "Password Changed Successfullly"))

})

const getCurrentUser = asyncHandler( async (res,req) => {
    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "Current sUser fetched Successfully"))
})


const updateAccDetails = asyncHandler( async (res,req)=> {
    const { fullName , email } = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All field are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName,
                email,
            }
        },
        {
            returnDocument : "after"
        }
    ).select("-password")

    return res
    .status(200) 
    .json( new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async (res,req) => {
    const avatarLocalPath = req.file?.path

    if( !avatarLocalPath ){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.secure_url){
        throw new ApiError(400, "Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar : avatar.secure_url,
            }
        },
        {
            returnDocument : "after"
        }
    ).select(" -password ")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Avatar updated successfully"))
})


const updateUserCoverImage = asyncHandler( async (res,req) => {
    const coverImageLocalPath = req.file?.path

    if( !coverImageLocalPath ){
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.secure_url){
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage : coverImage.secure_url,
            }
        },
        {
            returnDocument : "after"
        }
    ).select(" -password ")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler( async (req,res) => {
    const { username } = req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username does not exist")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },            
                isSubscribed : {
                    $cond :{
                        if : {$in : [req.user?._id , "$subscribers.subscriber"]},
                        then : true,
                        else : false,
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                suscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler( async(req,res) => {
    
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline :  [
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
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

export {  
    registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}