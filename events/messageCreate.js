// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const { firestoreWithTimeout } = require('../utils/dbHelper'); // <-- NEW
const config = require('../config');

// handleCasualResponse and handleXp functions will now use the helper
// Example inside handleXp:
// const userDoc = await firestoreWithTimeout(transaction.get(userDocRef));

// ... (Your full messageCreate.js code, but every database call like .get() or .set() needs to be wrapped)
// e.g., await firestoreWithTimeout(transaction.set(userDocRef, updateData, { merge: true }));

module.exports = { /* ... */ };
