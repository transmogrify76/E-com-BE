import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Admin} from "../models/e-commerce/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const registerAdmin = asyncHandler (async (req,res) => {
    const {username,email,password,fullname,phoneNo,role} = req.body
    console.log("email :",email);
    
    if(
        [username,email,password,fullname,phoneNo,role].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    const existedAdmin = Admin.findOne({email})

    const admin = await Admin.create({
        username,
        email,
        password,
        fullname,
        phoneNo,
        role
    })
      
        const createdAdmin = await Admin.findById(admin._id).select(
            '-password -refreshToken'
        )
        if (!createdAdmin){
            throw new ApiError (500, 'Something went wrong while registering')
        }
        return res.status(201).json(
            new ApiResponse(200 , createdAdmin , "Admin registered successfully")
        )
})

const generateAccessAndRefreshTokens = async(adminId) =>{
    try{
        console.log("//////////////////////////")
        const admin = await  Admin.findById(adminId)
        console.log(admin)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()
        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave : false })

        return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500, "something went wrong while generating token")
    }

    }
    const loginAdmin = asyncHandler(async (req,res) => {
        const {email,password} = req.body
        if (!email || !password){
            throw new ApiError(400,"email or password is required")
        }
        const admin = await Admin.findOne({
            email
        })
        if (!admin){
            throw new ApiError(404 , "Admin does not exist")
        }
            //password check
        const isPasswordValid = await admin.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401,"invalid admin credentials")
        }
        console.log(admin._)
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(admin._id)
        const loggesInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")
    
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
                    admin: loggesInAdmin, accessToken,
                    refreshToken
                },
                "Admin logged in Successfully"
    
            )
        )
    })
    
    const logoutAdmin = asyncHandler(async(req, res)=> {
        await Admin.findByIdAndUpdate(
            req.admin._id,
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
        .json(new ApiResponse(200,{}, "Admin logged out"))
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
            const admin = await Admin.findById(decodedToken?._id)
            console.log(admin.refreshToken)
            if (!admin){
             throw new ApiError(401,"Invalid refresh token")
            }
         
            if (incomingRefreshToken !== admin?.refreshToken){
             throw new ApiError(401,"Refresh token is expired or used")
            }
         
            const options = {
             httpOnly : true,
             secure: true
            }
             const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(admin._id)
         
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
        registerAdmin,
        loginAdmin,
        logoutAdmin,
        refreshAccesToken
    }
