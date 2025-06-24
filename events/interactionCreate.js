// events/interactionCreate.js
// ... (all your requires)
const { firestoreWithTimeout } = require('../utils/dbHelper'); // <-- NEW

// All handler functions will now use the helper for database calls
// Example inside a handler:
// const userDoc = await firestoreWithTimeout(db.collection('users').doc('...').get());

module.exports = { /* ... */ };
