import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/e-commerce/user.js"
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  // GET USER DETAILS FROM FRONTEND
    const {username,email,password,fullname,address,phoneNo } = req.body
    console.log("email: ",email);
      // VALIDATIONS - NOT EMPTY
    if(
        [username,email,password,fullname,address,phoneNo].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
  // CHECKIF USER ALREADY EXIST: USERNAME , EMAIL
     const existedUser = User.findOne({email})   
  // CREATE  USER OBJECT -  CREATE ENTRY IN DB
     const user = await User.create({
        username,
        email,
        password,
        fullname,
        address,
        phoneNo,
     })
       // REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )
  // CHECK FOR USER CREATION
     if (!createdUser){
        throw new ApiError (500, 'something went wrong while registering user')
     }
  // RETURN RES
     return res.status(201).json(
        new ApiResponse(200 , createdUser,"User registered successfully")
     )
});


///////////////////////////////////////////////////////////////////////////////////////////
    //access and refresh token
const generateAccessAndRefreshTokens = async(userId) => {
    try{

        console.log("ffffffnfe")
        const user = await User.findById(userId)
        console.log(user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
         user.refreshToken = refreshToken
         await user.save({ validateBeforeSave : false })

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating token")
    }
}
    // req body --> data
const loginUser = asyncHandler(async (req,res)=> {

//username or email
    const {username,password} = req.body
    if (!username || !password){
        throw new ApiError(400,"username or password is required")
    }
    
    //find the user
    const user = await User.findOne({
        username
    })
    

    if (!user){
        throw new ApiError(404 , "user does not exist")
    }
        //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"invalid user credentials")
    }
    console.log(user._)
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggesInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }
        //send cookies
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggesInUser, accessToken,
                refreshToken
            },
            "user logged in Successfully"

        )
    )
})

export { 
    registerUser,
    loginUser
 };
