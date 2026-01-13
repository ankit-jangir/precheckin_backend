const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: [
        "https://guest.thestaymaster.com",
        "http://localhost:5173",
    ],
    credentials: true,
}));
app.use(express.json());

// Routes
const userRoutes = require("./routes/userroutes");
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);

    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
    });
});

module.exports = app;
