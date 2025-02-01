import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user= await User.findById(userId)
        if(!user){
            throw new ApiError(404,"User not found")
        }
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return{accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating tokens ")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    // get user details
    // check if user already exists
    // validation
    // create user
    // check for user creation
    // return response
    const {fullname,username,email,password}=req.body;
    console.log(req.body)
    // console.log("email: ",email)
    // console.log("password: ",password)

    if(fullname==="" && email==="" && password==="" && username===""){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser=await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        username:username.toLowerCase(),
        password

    })
    const created= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!created){
        throw new ApiError(500,"User not registered")
    }

    return res.status(201).json(
        new ApiResponse(200,created,"User registered successfully")
    )
   

})

const loginUser=asyncHandler(async (req,res)=>{

    // req.body=>data
    // username or email
    // find user
    // check password
    // access refresh token
    // send cookie

    const{email,username,password}=req.body

    if(!username&&!email){
        throw new ApiError(400,"Username and email is required")
    }

    const user=await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPassValid=await user.isPasswordCorrect(password)

    if(!isPassValid){
        throw new ApiError(401,"Invalid password")
    }
    const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

 const logoutUser=asyncHandler (async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
        200,
        {},
        "User logged out successfully"
    ))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token expired")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const{accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token")
        
    }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}



