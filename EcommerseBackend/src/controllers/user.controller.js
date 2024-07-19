import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/e-commerce/user.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { log } from 'console';





const registerUser = asyncHandler(async (req, res) => {
  // GET USER DETAILS FROM FRONTEND
    const {username,email,password,fullname,address,phoneNo,role } = req.body
    console.log("email: ",email);
      // VALIDATIONS - NOT EMPTY
    if(
        [username,email,password,fullname,address,phoneNo,role].some((field)=>field?.trim() === "")
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
        role,
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

////////////////////////////////////////////////////////////////////////////////////////////////////////

    // req body --> data
const loginUser = asyncHandler(async (req,res)=> {

//username or email
    const {username,password,role} = req.body
    if (!username || !password ||!role){
        throw new ApiError(400,"username or password or role is required")
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
    if (user.role !== role) {
        throw new ApiError(403, "Role does not match");
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logoutUser = asyncHandler(async(req, res)=> {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{}, "User logged out"))
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////

const refreshAccesToken = asyncHandler(async (req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
     console.log(incomingRefreshToken)
    if (!incomingRefreshToken){
     throw new ApiError(401, "unauthorized request")
    }
 
    try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
        )
        console.log(decodedToken)
        const user = await User.findById(decodedToken?._id)
        console.log(user.refreshToken)
        if (!user){
         throw new ApiError(401,"Invalid refresh token")
        }
     
        if (incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
        }
     
        const options = {
         httpOnly : true,
         secure: true
        }
         const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
     
        return res
        .status(200)
        .cookie("accessToken", accessToken , options)
        .cookie("refreshToken", newRefreshToken , options)
        .json(
             new ApiResponse(
                 200,
                 {accessToken, refreshToken: newRefreshToken },
                 "Access token refreshed"
             )
        )
     
     
    } catch (error) {
         throw new ApiError(401, error?.message || "invalid refresh token")
    }
 })

////////////////////////////////////////////////////////////////////////////////////////////////////////////

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'eshaghosal2000@gmail.com',
        pass: 'ylzs okas zwwf iepk' // Replace with your actual password or use environment variables
    }
});

// Function to generate a random PIN
function generateRandomPIN() {
    const pinLength = 6;
    const pin = Math.random().toString().slice(-pinLength);
    return pin;

}

// Forgot Password - Generate token and send email
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        // user.resetToken = generateRandomPIN();
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        // Generate PIN
        const pin = generateRandomPIN();
        req.varPin = pin;
        console.log('pppppppppp' ,req);
        // Send email
        const mailOptions = {
            from: 'eshaghosal2000@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset</p>
                   <p>Your PIN is: <strong>${pin}</strong></p>
                   <p>Use this PIN to reset your password.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                throw new ApiError(500, 'Failed to send email');
            }
            res.status(200).json(new ApiResponse(200, {}, 'Password reset email sent'));
        });
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Server error');
    }
});

// Verify OTP and reset password
const verifyOTPAndResetPassword = asyncHandler(async (req, res) => {
    const varPin = req.varPin;
    console.log('=========================' , varPin , req.varPin);
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Check if OTP and reset token are valid and not expired
        if (otp!== otp) {
            console.log('ghghghghg',otp , varPin );
            throw new ApiError(400, 'Invalid or expired OTssssP');
        }

        // Reset password
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        await user.save();

        // Optionally, you may want to send a confirmation email to the user here

        res.status(200).json(new ApiResponse(200, {}, 'Password reset successfully'));
    } catch (error) {
        console.error(error);
        if (error instanceof ApiError) {
            res.status(error.statusCode || 500).json({
                message: error.message
            });
        } else {
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
});


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesToken,
    forgotPassword,
    verifyOTPAndResetPassword
 };
