require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/dbConnection");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        const connection = await pool.getConnection();
        console.log("MySQL Database Connected");
        connection.release();
    } catch (error) {
        console.log("Database Connection Error:", error);
    }
});
