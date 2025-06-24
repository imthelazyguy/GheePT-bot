// utils/dbHelper.js

/**
 * Wraps a Firestore promise in a timeout.
 * @param {Promise} promise The Firestore promise (e.g., doc.get(), doc.set()).
 * @param {number} timeout The timeout in milliseconds.
 * @returns {Promise<any>}
 * @throws {Error} Throws an error if the operation times out.
 */
function firestoreWithTimeout(promise, timeout = 10000) { // 10-second timeout
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Firestore operation timed out after ${timeout / 1000} seconds.`));
        }, timeout);
    });

    return Promise.race([promise, timeoutPromise])
        .finally(() => clearTimeout(timeoutId));
}

module.exports = { firestoreWithTimeout };
