# google-calendar-multisync
Automated multi-account Google Calendar synchronization with deduplication and transparency filters. Figured I'd spend a few hours rather than using an online tool

🚀 Overview
A high-performance Google Apps Script that creates a real-time "Availability Mesh" across multiple Google accounts. It ensures that if you are busy on one calendar, you are marked as "Busy" on all others—without the clutter of duplicate event details or manual syncing.

"Figured I'd spend a few hours rather than using an online tool." — The developer's mantra.

✨ Features
Intersection-Aware Sync: Smart logic that handles overlapping meetings. It ensures full coverage even if meetings start or end at different times.

MD5 State Hashing: The script generates a digital fingerprint of your schedule. If nothing has changed, it exits in milliseconds to save your Google API quota.

Smart Transparency Filter: Automatically respects "Free" vs "Busy" settings and ignores "Declined" invitations.

Privacy First: Only syncs the word "Busy (Synced)" to other calendars. No meeting titles, descriptions, or guest lists are leaked across accounts.

Lavender UI: Hard-coded to Google Color ID 1 (Lavender) for a clean, non-intrusive look.

🛠 Setup & Installation
Create the Script: Go to  and create a new project.

Add Code: Copy the contents of Code.gs from this repo into the editor.

Configure IDs: Update the CAL_IDS array with your actual email addresses.

Authorize: Run the syncAll function manually once to grant permissions.

Set Trigger: * Click the Triggers (alarm clock) icon on the left.

Add a trigger for syncAll.

Select Time-driven -> Minutes timer -> Every minute.

🧪 Technical Utilities
The script includes built-in functions for maintenance:

clearAllSyncedEvents(): The "Nuke" option. Wipes all sync blocks across all accounts for a fresh start.

updateExistingColors(): The "Paintbrush." Quickly updates the color of all existing blocks without a full re-sync.

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
