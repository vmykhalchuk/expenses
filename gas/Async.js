// 
// THIS IS A TEST VERSION!!!
//
// This is ment to be modified wildly!!!

/*
* Async.gs
*
* Manages asyncronous execution via time-based triggers.
*
* Note that execution normally takes 30-60s due to scheduling of the trigger.
*
* @see https://developers.google.com/apps-script/reference/script/clock-trigger-builder.html
*
*/

/*
// USAGE EXAMPLES

// Define async function
function runSlowTask(user_id, is_active) {
  console.log('runSlowTask()', { user_id: user_id, is_active: is_active });
  Utilities.sleep(5000);
  console.log('runSlowTask() - FINISHED!')
}

// Run function asynchronously
Async.call('runSlowTask');

// Run function asynchronously with one argument
Async.call('runSlowTask', 51291);

// Run function asynchronously with multiple argument
Async.call('runSlowTask', 51291, true);

// Run function asynchronously with an array of arguments
Async.apply('runSlowTask', [51291, true]);

// Run function in library asynchronously with one argument
Async.call('MyLibrary.runSlowTask', 51291);

// Run function in library asynchronously with an array of arguments
Async.apply('MyLibrary.runSlowTask', [51291, true]);
*/


var Async = Async || {};

// Triggers asynchronous execution of a function (with arguments as extra parameters)
Async.call = function(handlerName) {
  return Async.apply(handlerName, Array.prototype.slice.call(arguments, 1));
};

// Triggers asynchronous execution of a function (with arguments as an array)
Async.apply = function(handlerName, args) {
  var trigger = ScriptApp
  .newTrigger('Async_handler')
  .timeBased()
  .after(1)
  .create();
  CacheService.getScriptCache().put(String(trigger.getUniqueId()), JSON.stringify({ handlerName: handlerName, args: args }));
  return { 
    triggerUid: trigger.getUniqueId(),
    source: String(trigger.getTriggerSource()), 
    eventType: String(trigger.getEventType()), 
    handlerName: handlerName,
    args: args
  };
};

// GENERIC HANDLING BELOW
// 
function Async_handler(e) {
  var GLOBAL = this;
  var triggerUid = e && e.triggerUid;
  var cache = CacheService.getScriptCache().get(triggerUid);
  if (cache) {
    try {
      var event = JSON.parse(cache);
      var handlerName = event && event.handlerName;
      var args = event && event.args;
      if (handlerName) {
        var context, fn = handlerName.split('.').reduce(function(parent, prop) {
          context = parent;
          return parent && parent[prop];
        }, GLOBAL);
        if (!fn || !fn.apply) throw "Handler `" + handlerName + "` does not exist! Exiting..";
        // Execute with arguments
        fn.apply(context, args || []);
      }
    } catch (e) {
      console.error(e);
    }
  }
  // Delete the trigger, it only needs to be executed once
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getUniqueId() === triggerUid) {
      ScriptApp.deleteTrigger(t);
    }
  });
};