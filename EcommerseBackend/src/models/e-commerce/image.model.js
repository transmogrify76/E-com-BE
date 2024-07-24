import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema(
    {
    image:String
    },
    {
        collection:"ImageDetails",
    }
);

const Image = mongoose.model("ImageDetails",imageSchema);

export {Image}