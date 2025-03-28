// utils/security.js

/**
 * Redacts sensitive data from an object.
 * @param {Object} data - The data to redact.
 * @param {Array} keysToRedact - List of keys to redact from the data.
 * @returns {Object} The data with sensitive fields redacted.
 */
const redactSensitiveData = (data, keysToRedact = []) => {
    const redactedData = { ...data };
  
    keysToRedact.forEach((key) => {
      if (redactedData[key]) {
        redactedData[key] = '[REDACTED]'; // Redacting the sensitive data
      }
    });
  
    return redactedData;
  };
  
  module.exports = { redactSensitiveData };
  