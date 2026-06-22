import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

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
        avatar : avatar.url,
        coverImage : coverImage.url || "",
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
        new ApiResponse(200, newUser, "12356y")
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

    // Step 5
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
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearcookie("accessToken" , options)
    .clearcookie("refreshToken" , options)
    .json( new ApiResponse(200, {}, "User Logged Out Successfully"))

})

export { 
    registerUser,
    loginUser, 
    logoutUser,
}