const TwilioHelper = require("../Helper/twilioHelper");
const twilio = new TwilioHelper();
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");


const constants = require("../config/constants");
const UtilityClass = require("../Helper/Utility");
const UserValidator = require("../validatiors/userValidator");
const Utility = new UtilityClass();

// Convert phone to +<country><number> format
const normalizePhone = (phone) => {
    phone = phone.toString().replace(/\s+/g, "");
    return phone.startsWith("+") ? phone : `+${phone}`;
};



const registerWithPhone = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!UserValidator.isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        const formattedPhone = normalizePhone(phone);

        const { otp, expires_at } = Utility.generateOTP(constants.GUEST_OTP_EXPIRY);

        await User.saveOTP(formattedPhone, otp, expires_at);

        await twilio.sendSMS(
            `Your Staymaster OTP is: ${otp}`,
            "+12163036560",
            formattedPhone
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("SEND OTP ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!UserValidator.isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format"
            });
        }

        if (!UserValidator.isValidOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP format"
            });
        }

        const formattedPhone = normalizePhone(phone);
        const otpRecord = await User.validatePhoneOTP(formattedPhone, otp);

        if (!otpRecord.length) {
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP"
            });
        }

        const record = otpRecord[0];
        const expiresAtMs = Number(record.expires_at) * 1000;

        if (Date.now() > expiresAtMs) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        let user = await User.getByPhone(formattedPhone);

        if (!user) {
            user = await User.createWithPhone(formattedPhone, constants.ROLE_GUEST);
        }

        const token = jwt.sign(
            {
                user: {
                    phone: user.phone,
                    id: user.id,
                    transExpiry: Math.round(Date.now() / 1000) + (60 * 60),
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const userData = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
        };

        return res.status(200).json({
            success: true,
            guestToken: token,
            user: userData
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
};

const UserLogout = async (req, res) => {
    try {
        return res.status(200).json({
            status: true,
            message: "Logout successful",
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};



module.exports = { registerWithPhone, verifyOTP, UserLogout };
