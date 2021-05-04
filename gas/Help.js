/* Here I collect all recipies for quick access

unicode emoji:
http://xahlee.info/comp/unicode_flags.html
https://emojipedia.org/hammer-and-wrench/
https://unicode-table.com/en/sets/symbols-for-steam/
- 🛠️,🚧,💡,💳,💴,💰,🛸,⚠️,⛔️,🤖,☣️️,✔️
- 🙊,🙈,

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