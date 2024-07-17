import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Seller} from "../models/e-commerce/seller.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const registerSeller = asyncHandler (async (req,res) => {
    //get seller details from frotend
    const {email,password,companyname,contactperson,phoneno,companyaddress,companydescription} = req.body
    console.log("email: ",email);
      // VALIDATIONS - NOT EMPTY
    if(
        [email,password,companyname,contactperson,phoneno,companyaddress,companydescription].some((field)=>field?.trim() === "")
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
        companydescription
     })
            // REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
            const createdSeller = await Seller.findById(seller._id).select(
                "-password -refreshToken"
             )
          // CHECK FOR Seller CREATION
             if (!createdSeller){
                throw new ApiError (500, 'something went wrong while registering seller')
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
const loginSeller = asyncHandler(async (req,res) => {
    const {email,password} = req.body
    if (!email || !password){
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
 

export {
    registerSeller,
    loginSeller,
    logoutSeller,
    refreshAccesToken
}
