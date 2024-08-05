const RATE_LIMIT = 10; // Maximum requests per minute
const TIMEOUT = 10 * 1000; // 10 seconds in milliseconds

// Stores request timestamps and block status for each IP address
const requestLog = {};

// Helper function to check and update request limits
function isRateLimited(ip) {
  const now = Date.now();
  const log = requestLog[ip] || { timestamps: [], waitUntil: 0 };
  // If currently blocked, check if block period has expired
  if (now < log.waitUntil) {
    return true; // Rate limit exceeded
  }

  // Remove timestamps older than 1 minute
  const recentRequests = log.timestamps.filter(
    (timestamp) => now - timestamp < 60 * 1000
  );

  if (recentRequests.length >= RATE_LIMIT) {
    // Block the IP address for TIMEOUT period
    requestLog[ip] = {
      timestamps: recentRequests,
      waitUntil: now + TIMEOUT,
    };

    return true; // Rate limit exceeded
  }

  // Update request log
  requestLog[ip] = {
    timestamps: [...recentRequests, now],
    waitUntil: log.waitUntil,
  };
  return false;
}
module.exports = isRateLimited;
