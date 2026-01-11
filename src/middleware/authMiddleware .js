const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler ( async (req, res, next) => {
    console.log("Inside validateToken");
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    
    if(authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
        if(!token) {
            res.status(401);
            throw new Error("User is not authorized or token is missing.");
        } else {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
                if(err) {
                    res.status(401);
                    throw new Error("User is not authorized.");
                }
                console.log("Token decoded successfully:", decode);
                console.log("Setting req.user to:", decode.user);
                req.user = decode.user;
                req.guestToken = token;
                next();
            });
        }
    } else {
        res.status(401);
        throw new Error("User is not authorized or access token is missing.");
    }
});

module.exports = validateToken;