import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    _id: {  // Define userId as the primary key
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',  // Assuming there's a User model defined
        required : true
    },
    adminid : {
        type: mongoose.Schema.Types.ObjectId,
        required : true
    }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
