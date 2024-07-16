import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true
    },
    email: {
        type: String,
        required: true, 
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
    },
    phoneNo : {
        type: String,
    },
    role : {
        type:String,
        required: true
    },
    refreshToken: {
        type:String
    }
},{timestamps: true });

adminSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

adminSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

adminSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            password:this.password,
            email:this.email,
            fullname:this.fullname,
            phoneNo:this.phoneNo,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
adminSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            password:this.password,
            email:this.email,
            fullname:this.fullname,
            phoneNo:this.phoneNo,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const Admin = mongoose.model('Admin', adminSchema);

export  {Admin};
