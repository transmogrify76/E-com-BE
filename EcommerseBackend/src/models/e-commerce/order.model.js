import mongoose from 'mongoose';

// Define the Order Item schema
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
});

// Define the Order schema
const orderSchema = new mongoose.Schema({
    orderPrice: {
        type: Number,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Assuming there's a User model defined
        required: true
    },
    orderItems: [orderItemSchema],  // Embedding orderItemSchema as an array
    address: {
        type: String
    },
    status: {
        type: String,
        enum: ["Pending", "Canceled", "Delivered"],
        default: "Pending"
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
