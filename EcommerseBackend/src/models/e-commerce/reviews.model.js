import mongoose from 'mongoose';


const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    review: {
        type: String,
        required : true,
    },
}, { timestamps: true });

const review = mongoose.model('User', userSchema);

export default review;
