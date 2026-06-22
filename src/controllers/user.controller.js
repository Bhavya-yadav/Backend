import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

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
    console.log(req.body)
    console.log("Received registration data: ", { fullName, email, username });

    // Step 2
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    
    // Step 5
    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)

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
        new ApiResponse(200, newUser, "User registered successfully")
    )


})

export { registerUser }