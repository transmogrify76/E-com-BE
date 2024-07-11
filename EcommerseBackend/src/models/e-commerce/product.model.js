import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    productImage: {
        type: String
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",  // Assuming there's a Category model defined
        required: true
    },
    ownership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"  // Assuming there's a User model defined
    },
    quantity: {
        type: Number
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
