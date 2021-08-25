/* Here I collect all recipies for quick access

// --- ? How to include external library ---
// see https://cdnjs.com/libraries/moment.js  for more recent versions
eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js').getContentText());
var date = moment().format("MMM Do YY");

// --- Esprima ---
// JS lib to tokenize/parse JS code
https://esprima.org/

// --- unicode emoji ---
http://xahlee.info/comp/unicode_flags.html
https://emojipedia.org/hammer-and-wrench/
https://unicode-table.com/en/sets/symbols-for-steam/
- 🛠️,🚧,💡,💳,💴,💰,🛸,⚠️,⛔️,🤖,☣️️,✔️,⚙️,▶⏸,📊,
- 🙊,🙈,⛅

// --- Sycnhronization Locks ---
LockService.getScriptLock()
- waitLock - to acquire lock
- releaseLock - release lock

// https://developers.google.com/apps-script/reference/properties/properties-service
PropertiesService.getScriptProperties()
- getProperty("key")
- setProperty("key", "value")

//https://developers.google.com/apps-script/reference/cache/cache
var cache = CacheService.getScriptCache();
- cache.get("key")
- cache.put("key", "value", timeSeconds)


SpreadsheetApp.getActive();//.openById("1sbE2aPq8cySn7WxuU_ESgwx4qKsj_VSBQr-hfu6p06s");//.getActive();

// UI
SpreadsheetApp.getUi().alert("Test!!!")
SpreadsheetApp.getActiveSpreadsheet().toast('Task started', 'Status', -1);


*/