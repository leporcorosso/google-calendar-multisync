/**
 * GOOGLE CALENDAR MULTI-SYNC MASTER (v13.7)
 * ---------------------------------------------------------------------------------
 * DESCRIPTION:
 * A high-performance availability mesh that synchronizes "Busy" states across 
 * multiple Google accounts. Uses MD5 state-hashing to minimize API overhead.
 *
 * FEATURES:
 * - Intersection-Aware: Handles overlapping meetings across different personas.
 * - Smart Filter: Ignores "Free" transparency and "Declined" events.
 * - High-Res: Event-based precision (no 15-min rounding).
 * - UI: Uses Lavender (Color ID 1) for non-intrusive sync blocks.
 *
 * AUTHOR: Tim Erickson
 * LICENSE: MIT
 * ---------------------------------------------------------------------------------
 */

// 1. CONFIGURATION: Replace with your actual email addresses
const CAL_IDS = [
  'your-work-email@company.com',
  'your-personal-email@gmail.com',
  'your-side-hustle@domain.com',
  'another-account@example.com'
];

const SYNC_DAYS = 30; 
const TARGET_COLOR = "1"; // Lavender
const SYNC_TITLE = "Busy (Synced)";

/**
 * MAIN ENTRY POINT
 * Set this to run on a 1-minute time-based trigger.
 */
function syncAll() {
  const now = new Date();
  const later = new Date(now.getTime() + (SYNC_DAYS * 24 * 60 * 60 * 1000)); 

  let rawFingerprint = "";
  const allEventsByCal = {};
  const masterSchedule = []; 

  // PHASE 1: MAPPING & FILTERING
  CAL_IDS.forEach(id => {
    const cal = CalendarApp.getCalendarById(id);
    if (!cal) {
      console.warn(`Could not access calendar: ${id}`);
      return;
    }
    const events = cal.getEvents(now, later);
    allEventsByCal[id] = events;
    
    events.forEach(e => {
      const title = e.getTitle();
      const start = e.getStartTime().getTime();
      const end = e.getEndTime().getTime();

      // Skip existing sync blocks and all-day placeholders
      if (title.toLowerCase().includes(SYNC_TITLE.toLowerCase()) || e.isAllDayEvent()) return;

      // Logic: Ignore "Free" reminders or "Declined" invitations
      let isFree = false;
      try {
        const trans = e.getTransparency();
        if (trans && trans.toString().toLowerCase() === "transparent") isFree = true;
      } catch(err) { isFree = false; }

      const status = e.getMyStatus();
      const isDeclined = (status && status.toString().toLowerCase() === "no");

      if (!isFree && !isDeclined) {
        masterSchedule.push({s: start, e: end});
        rawFingerprint += e.getId() + e.getLastUpdated().getTime() + start;
      }
    });
  });

  // PHASE 2: STATE HASHING (MD5)
  // This prevents the script from running expensive write operations if nothing changed.
  const currentHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, rawFingerprint)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');

  if (currentHash === PropertiesService.getScriptProperties().getProperty('LAST_HASH')) {
    return; // Exit early
  }
  
  console.log(`State change detected. Reconciling ${masterSchedule.length} busy slots...`);

  // PHASE 3: RECONCILIATION
  CAL_IDS.forEach(targetId => {
    const targetCal = CalendarApp.getCalendarById(targetId);
    const targetEvents = allEventsByCal[targetId] || [];
    const existingSyncs = new Map();

    targetEvents.forEach(te => {
      if (te.getTitle().toLowerCase().includes(SYNC_TITLE.toLowerCase())) {
        existingSyncs.set(`${te.getStartTime().getTime()}_${te.getEndTime().getTime()}`, te);
      }
    });

    masterSchedule.forEach(block => {
      const key = `${block.s}_${block.e}`;
      
      const alreadyHasThisSync = existingSyncs.has(key);
      const isSourceOfThisBlock = (allEventsByCal[targetId] || []).some(e => 
        e.getStartTime().getTime() === block.s && 
        e.getEndTime().getTime() === block.e && 
        !e.getTitle().toLowerCase().includes(SYNC_TITLE.toLowerCase())
      );

      if (!alreadyHasThisSync && !isSourceOfThisBlock) {
        try {
          const newEvent = targetCal.createEvent(SYNC_TITLE, new Date(block.s), new Date(block.e));
          newEvent.setColor(TARGET_COLOR);
        } catch(err) {
          console.error(`Failed to create event on ${targetId}: ${err}`);
        }
      }
    });

    // Remove "Orphan" sync blocks (events that were moved or deleted)
    existingSyncs.forEach((eventObj, key) => {
      const [s, e] = key.split('_').map(Number);
      const stillNeeded = masterSchedule.some(m => m.s === s && m.e === e);
      if (!stillNeeded) {
        try { 
          eventObj.deleteEvent(); 
        } catch(f) {
          try { eventObj.getEventSeries().deleteSeries(); } catch(g) {}
        }
      }
    });
  });

  PropertiesService.getScriptProperties().setProperty('LAST_HASH', currentHash);
  console.log("Mesh Synchronized.");
}

/**
 * UTILITY: Global Wipe
 * Removes all sync blocks from all configured calendars.
 */
function clearAllSyncedEvents() {
  const start = new Date(new Date().getTime() - (5 * 24 * 60 * 60 * 1000));
  const end = new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000));
  CAL_IDS.forEach(id => {
    const cal = CalendarApp.getCalendarById(id);
    if (!cal) return;
    cal.getEvents(start, end).forEach(e => {
      if (e.getTitle().toLowerCase().includes(SYNC_TITLE.toLowerCase())) {
        try { e.deleteEvent(); } catch (err) {}
      }
    });
  });
  PropertiesService.getScriptProperties().deleteProperty('LAST_HASH');
  console.log("Wipe Complete.");
}

/**
 * UTILITY: Color Patch
 * Quickly updates the color of all existing sync blocks.
 */
function updateExistingColors() {
  const start = new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000));
  const end = new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
  CAL_IDS.forEach(id => {
    const cal = CalendarApp.getCalendarById(id);
    if (!cal) return;
    cal.getEvents(start, end).forEach(e => {
      if (e.getTitle().toLowerCase().includes(SYNC_TITLE.toLowerCase())) {
        try { e.setColor(TARGET_COLOR); } catch (err) {}
      }
    });
  });
}
