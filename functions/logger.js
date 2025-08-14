// logger.js
module.exports = function log(event, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📍 ${event}:`, data || "");
};
