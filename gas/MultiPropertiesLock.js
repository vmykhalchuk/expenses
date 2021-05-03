// 
// THIS IS A TEST VERSION!!!
//
// This is ment to be modified wildly!!!

/**
Usage is simple:
- multiPropertiesLock.waitLock("<lock_name>", <waitTimeMs>, <maxLockAgeMs>)
- here maxLockAgeMs is used to automatically discard lock which has been locked in the system for time longer then stated here

- multiPropertiesLock.releaseLock("<lock_name>")
*/

var multiPropertiesLock = {
  __internalLockWaitTimeout: 2000, // usually its around 200-600ms to acquire and then release lock from system
  
  _validateLock: function(lockProp, maxLockAgeMs) {
    var tmstmp = new Date().getTime();
    var oldTmstmp = Date.parse("01 Jan 2000 00:00:00 GMT");
    var lockPropInt = parseInt(lockProp);
    if (isNaN(lockPropInt) || lockPropInt >= tmstmp || lockPropInt < oldTmstmp) {
      return "wrong";
    } else if ((tmstmp - lockPropInt) > maxLockAgeMs) {
      return "outdated";
    } else {
      return "valid";
    }
  },
  
  __acquiredLocksMap: {},
  
  waitLock: function(lockName, waitTimeMs, maxLockAgeMs) {
    var startTime = new Date().getTime();
    var scriptPropLockName = "Lock-" + lockName;
    if (this.__acquiredLocksMap[scriptPropLockName]) {
      console.warn("Lock already acquired by me: " + scriptPropLockName);
      return true; // already acquired
    }
    
    do {
      var lock = LockService.getScriptLock();
      var acquired = false;
      try {
        lock.waitLock(Math.min(this.__internalLockWaitTimeout, waitTimeMs));
        acquired = true;
      } catch (e) {
        var msg = "multiPropertiesLock: Couldn't acquire system lock!";
        console.error(msg + "\n" + e);
        throw msg;
      }
      if (acquired) {
        try {
          var lockProp = PropertiesService.getScriptProperties().getProperty(scriptPropLockName);
          if (lockProp == null || this._validateLock(lockProp, maxLockAgeMs) === "outdated") {
            if (lockProp != null) {
              console.error("Removing outdated lock: " + scriptPropLockName + " (" + lockProp + ")");
            }
            // set lock and exit
            PropertiesService.getScriptProperties().setProperty(scriptPropLockName, "" + new Date().getTime());
            this.__acquiredLocksMap[scriptPropLockName] = true;
            return true;// successfully acquired lock
          } else if (this._validateLock(lockProp) === "wrong") {
            throw "Bad lock property - cannot proceed.\n" + scriptPropLockName + ": " + lockProp;
          }
        } finally {
          lock.releaseLock();
        }
      }
    } while ((new Date().getTime() - startTime) <= waitTimeMs);
    
    return false;
  },
  
  releaseLock: function(lockName) {
    var lock = LockService.getScriptLock();
    var acquired = false;
    try {
      lock.waitLock(this.__internalLockWaitTimeout);
      acquired = true;
    } catch (e) {
      var msg = "multiPropertiesLock: Couldn't acquire system lock!";
      console.error(msg + "\n" + e);
      throw msg;
    }
    if (acquired) {
      try {
        var scriptPropLockName = "Lock-" + lockName;
        if (!this.__acquiredLocksMap[scriptPropLockName]) {
          throw "Lock not acquired by me yet!!!\nLock: " + scriptPropLockName;
        }
        PropertiesService.getScriptProperties().deleteProperty(scriptPropLockName);
        this.__acquiredLocksMap[scriptPropLockName] = false;
      } finally {
        lock.releaseLock();
      }
    }
  }
};

var __testsSuitMultiPropertiesLock = {
  _validateLock: function() {
    var ttt = new Date().getTime();
    assertEquals("wrong", multiPropertiesLock._validateLock("" + (ttt+1000), 2000));
    Utilities.sleep(5);
    assertEquals("valid", multiPropertiesLock._validateLock("" + ttt, 2000));
    assertEquals("wrong", multiPropertiesLock._validateLock("sdfsdfsdf", 2000));
    assertEquals("outdated", multiPropertiesLock._validateLock("" + (ttt-1000), 100));
    assertEquals("valid", multiPropertiesLock._validateLock("" + (ttt-1000), 2000));
  }
};

var __testsIntraSuitMultiPropertiesLock = {
  acquireTestLockSuccessfully: function() {
  }
};