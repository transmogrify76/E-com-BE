import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Seller} from "../models/e-commerce/seller.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
        throw new ApiError(401,"invalid user credentials")
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


export {
    registerSeller,
    loginSeller
}