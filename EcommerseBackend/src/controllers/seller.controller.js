import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Seller} from "../models/e-commerce/seller.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import mongoose from 'mongoose';
// import multer from 'multer';
// import {Product} from '../models/e-commerce/product.model.js';
// import path from 'path';

const registerSeller = asyncHandler (async (req,res) => {
    //get seller details from frotend
    const {email,password,companyname,contactperson,phoneno,companyaddress,companydescription,role} = req.body
    console.log("email: ",email);
      // VALIDATIONS - NOT EMPTY
    if(
        [email,password,companyname,contactperson,phoneno,companyaddress,companydescription,role].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
      // CHECKIF SELLER ALREADY EXIST: USERNAME , EMAIL
      const existedSeller = Seller.findOne({email})   
      // CREATE  SELLER OBJECT -  CREATE ENTRY IN DB
      const seller = await Seller.create({
        email,
        password,
        companyname,
        contactperson,
        phoneno,
        companyaddress,
        companydescription,
        role
     })
            // REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
            const createdSeller = await Seller.findById(seller._id).select(
                "-password -refreshToken"
             )
          // CHECK FOR Seller CREATION
             if (!createdSeller){
                throw new ApiError (500, 'something went wrong while registering user')
             }
          // RETURN RES
             return res.status(201).json(
                new ApiResponse(200 , createdSeller,"Seller registered successfully")
             )       
});

////////////////////////////////////////////////////////////////////////////////////////////////////
const generateAccessAndRefreshTokens = async(sellerId) => {
        try{
            console.log("ffffffnfe")
        const seller = await Seller.findById(sellerId)
        console.log(seller)
        const accessToken = seller.generateAccessToken()
        const refreshToken = seller.generateRefreshToken()
        seller.refreshToken = refreshToken
         await seller.save({ validateBeforeSave : false })

        return {accessToken,refreshToken}
        }catch(error){
                throw new ApiError(500,"something went wrong while generating token")
        }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////

const loginSeller = asyncHandler(async (req,res) => {
    const {email,password , role} = req.body
    if (!email || !password || !role){
        throw new ApiError(400,"email or password is required")
    }
    const seller = await Seller.findOne({
        email
    })
    if (!seller){
        throw new ApiError(404 , "seller does not exist")
    }
        //password check
    const isPasswordValid = await seller.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"invalid seller credentials")
    }
    if (seller.role !== role) {
        throw new ApiError(403, "Role does not match");
    }
    console.log(seller._)
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(seller._id)
    const loggesInSeller = await Seller.findById(seller._id).select("-password -refreshToken")

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
                seller: loggesInSeller, accessToken,
                refreshToken
            },
            "seller logged in Successfully"

        )
    )
})

///////////////////////////////////////////////////////////////////////////////////////////////////////

const logoutSeller = asyncHandler(async(req, res)=> {
    await Seller.findByIdAndUpdate(
        req.seller._id,
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
    .json(new ApiResponse(200,{}, "Seller logged out"))
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        const seller = await Seller.findById(decodedToken?._id)
        console.log(seller.refreshToken)
        if (!seller){
         throw new ApiError(401,"Invalid refresh token")
        }
     
        if (incomingRefreshToken !== seller?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
        }
     
        const options = {
         httpOnly : true,
         secure: true
        }
         const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(seller._id)
     
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
        pass: 'ylzs okas zwwf iepk'
    }
});

// Function to generate a random PIN
function generateRandomPIN() {
    const pinLength = 6;
    const pin = Math.random().toString().slice(-pinLength);
    return pin;

}
// Forgot Password - Generate token and send email
const forgotPasswordSeller = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const seller = await Seller.findOne({ email });

        if (!seller) {
            throw new ApiError(404, 'Seller not found');
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        seller.resetToken = token;
        seller.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await seller.save();
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
                console.log('hiiiiiiiiii');
                console.log(error);
                // throw new ApiError(500, 'Failed to send email');
            }
            // console.log('Email sent: ' + info.response);
            res.status(200).json(new ApiResponse(200, {}, 'Password reset email sent'));
        });
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Server error');
    }
});
// Verify OTP and reset password
const verifyOTPAndResetPasswordseller = asyncHandler(async (req, res) => {
    const varPin = req.varPin;
    console.log('=========================' , varPin , req.varPin);
    const { email, otp, newPassword } = req.body;

    try {
        const seller = await Seller.findOne({ email });

        if (!seller) {
            throw new ApiError(404, 'seller not found');
        }

        // Check if OTP and reset token are valid and not expired
        if (otp!== otp) {
            console.log('ghghghghg',otp , varPin );
            throw new ApiError(400, 'Invalid or expired OTssssP');
        }

        // Reset password
        seller.password = newPassword;
        seller.resetToken = undefined;
        seller.resetTokenExpiration = undefined;
        await seller.save();

        // Optionally, you may want to send a confirmation email to the seller here

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

////////////////////////////////////////////////////////////////////////////////////////////////////

const getSellerById = asyncHandler(async (req, res) => {
    const sellerId = req.params.sellerId;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({ message: 'Invalid seller ID' });
      }
  
      const seller = await Seller.findById(sellerId);
  
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }
  
      res.json(seller); // Send user data as JSON response
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  });


export {
    registerSeller,
    loginSeller,
    logoutSeller,
    refreshAccesToken,
    forgotPasswordSeller ,
    verifyOTPAndResetPasswordseller,
    getSellerById
    // uploadImage
}
