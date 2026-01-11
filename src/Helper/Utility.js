'use strict';
class Utility{

    generateOTP(expiry_in_minutes = 10){
        //generate otp
        var minm = 100000;
        var maxm = 999999;
        var otp = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
        const expires_at = Math.round(Date.now() / 1000) + (60 * expiry_in_minutes);
        return {otp,expires_at};
    }

}
module.exports = Utility;