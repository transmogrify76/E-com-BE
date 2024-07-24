import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    productImage: {
        data: Buffer, // Store binary data (image) as Buffer
        contentType: String // Mime type of the file
    },
    price: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export {Product};
