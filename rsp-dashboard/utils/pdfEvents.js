// Simple event bus for server-side notifications (e.g., background PDF generation done)
const EventEmitter = require('events');
const pdfEvents = new EventEmitter();
pdfEvents.setMaxListeners(50);
module.exports = pdfEvents;
