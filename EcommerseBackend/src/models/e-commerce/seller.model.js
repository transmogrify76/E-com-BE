import mongoose , {Schema} from 'mongoose';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const sellerSchema = new Schema({ 
    email: {
        type:String,
        required : true
    },
    password:{
        type:String,
        required : true
    },
    companyname: {
        type: String,
        required : true,
    },
    contactperson : {
        type:String,
        required : true
    },
    phoneno : {
        type:String,
    },
    companyaddress : {
        type: String,
    },
    companydescription : {
        type : String,
    },
    role: {
        type : String
    },
    refreshToken: {
        type:String
    }
}, { timestamps: true });  // Corrected 'timestamp' to 'timestamps' to enable automatic timestamps

sellerSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})
sellerSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password, this.password)
}

sellerSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            companyname:this.companyname,
            contactperson:this.contactperson,
            companyaddress:this.companyaddress,
            companydescription: this.companydescription,
            phoneNo:this.phoneNo,
            role : this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
sellerSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            companyname:this.companyname,
            contactperson:this.contactperson,
            companyaddress:this.companyaddress,
            companydescription: this.companydescription,
            phoneNo:this.phoneNo,
            role : this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


const Seller = mongoose.model('Seller', sellerSchema);

export {Seller};
