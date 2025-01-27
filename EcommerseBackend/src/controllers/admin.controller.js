import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/e-commerce/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { log } from 'console';
import mongoose from 'mongoose'

const registerAdmin = asyncHandler(async (req, res) => {
    const { username, email, password, fullname, phoneNo, role } = req.body
    console.log("email :", email);

    if (
        [username, email, password, fullname, phoneNo, role].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const existedAdmin = Admin.findOne({ email })

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
    if (!createdAdmin) {
        throw new ApiError(500, 'Something went wrong while registering')
    }
    return res.status(201).json(
        new ApiResponse(200, createdAdmin, "Admin registered successfully")
    )
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const generateAccessAndRefreshTokens = async (adminId) => {
    try {
        console.log("//////////////////////////")
        const admin = await Admin.findById(adminId)
        console.log(admin)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()
        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating token")
    }

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        throw new ApiError(400, "Email, password, and role are required");
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Admin does not exist");
    }

    // Password check
    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid admin credentials");
    }

    // Check if the role matches
    if (admin.role !== role) {
        throw new ApiError(403, "Role does not match");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);
    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    // Send cookies and response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    admin: loggedInAdmin, accessToken,
                    refreshToken
                },
                "Admin logged in successfully"
            )
        );
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Admin logged out"))
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const refreshAccesToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    console.log(incomingRefreshToken)
    if (!incomingRefreshToken) {
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
        if (!admin) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== admin?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )


    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        admin: 'eshaghosal2000@gmail.com',
        pass: 'ylzs okas zwwf iepk'
    }
});

// Function to generate a random PIN
function generateRandomPIN() {
    const pinLength = 6;
    const pin = Math.random().toString().slice(-pinLength);
    return pin;

}

// Forgot Password - Generate token and send email
const forgotPasswordAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            throw new ApiError(404, 'Admin not found');
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        admin.resetToken = token;
        admin.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await admin.save();
        const pin = generateRandomPIN();
        req.varPin = pin;
        console.log('pppppppppp', req);

        // Send email
        const mailOptions = {
            from: 'eshaghosal2000@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset</p>
                    <p>Your PIN is: <strong>${pin}</strong></p>
                    <p>Use this PIN to reset your password.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {

                console.log('hiiiiiiiiii');
                console.log(error);
                // throw new ApiError(500, 'Failed to send email');
            }
            // console.log('Email sent: ' + info.response);
            res.status(200).json(new ApiResponse(200, {}, 'Password reset email sent'));
        });
    } catch (error) {
        console.error(error);
        throw new ApiError(500, 'Server error');
    }
});
// Verify OTP and reset password
const verifyOTPAndResetPasswordAdmin = asyncHandler(async (req, res) => {
    const varPin = req.varPin;
    console.log('=========================', varPin, req.varPin);
    const { email, otp, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            throw new ApiError(404, 'admin not found');
        }

        // Check if OTP and reset token are valid and not expired
        if (otp !== otp) {
            console.log('ghghghghg', otp, varPin);
            throw new ApiError(400, 'Invalid or expired OTssssP');
        }

        // Reset password
        admin.password = newPassword;
        admin.resetToken = undefined;
        admin.resetTokenExpiration = undefined;
        await admin.save();

        // Optionally, you may want to send a confirmation email to the admin here

        res.status(200).json(new ApiResponse(200, {}, 'Password reset successfully'));
    } catch (error) {
        console.error(error);
        if (error instanceof ApiError) {
            res.status(error.statusCode || 500).json({
                message: error.message
            });
        } else {
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////

const getAdminById = asyncHandler(async (req, res) => {
    const adminId = req.params.adminId;

    try {
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ message: 'Invalid admin ID' });
        }

        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin); // Send user data as JSON response
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});




export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    refreshAccesToken,
    forgotPasswordAdmin,
    verifyOTPAndResetPasswordAdmin,
    getAdminById
}
