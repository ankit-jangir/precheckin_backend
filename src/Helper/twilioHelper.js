const dotenv = require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

class TwilioHelper {
    async sendSMS(body, from, to) {
        try {
            const msg = await client.messages.create({
                body,
                from,
                to
            });
            console.log("SMS SENT:", msg.sid);
            return msg;
        } catch (error) {
            console.error("TWILIO ERROR:", error);
            throw error; 
        }
    }
}

module.exports = TwilioHelper;
