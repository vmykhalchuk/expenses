class _CacheTestUnderScope extends Cache {
  constructor(testGasCacheObj) {
    super();
    this.testGasCacheObj = testGasCacheObj;
  }
  _gasCache() {
    return this.testGasCacheObj;
  }
}

var __testSuiteCache = {
  
  test1: function() {
    var expectedGasCacheRes = null;
    
    var gasCacheObj = {
      getCallKey: null,
      getCallsCount: 0,
      get: function(key) {
        this.getCallKey = key;
        this.getCallsCount++;
        return expectedGasCacheRes;
      },
      
      putCallKey: null,
      putCallValue: null,
      putCallsCount: 0,
      put: function(key, value, time) {
        this.putCallKey = key;
        this.putCallValue = value;
        this.putCallsCount++;
      }
    };
    
    var _cacheUnderScope = new _CacheTestUnderScope(gasCacheObj);
    
    var expEvalRes = "res1";
    var evalFuncExecutedCounter = 0;
    var evalFunc = function() {
      evalFuncExecutedCounter++;
      return expEvalRes;
    };
    
    var reset = function() {
      evalFuncExecutedCounter = 0;
      gasCacheObj.getCallsCount = 0;
      gasCacheObj.putCallsCount = 0;
    };
    
    
    // first test
    reset();
    _c.caches["_testCacheEntryKey1"] = { name: "_testCacheEntryKey1", localOnly: false };
    var res = _cacheUnderScope.lookupAndEvalValue(_c.caches._testCacheEntryKey1, evalFunc);
    assertEquals(1, evalFuncExecutedCounter, "evalFunc should be called exactly once");
    assertEquals(expEvalRes, res, "Cached value res wrong");
    
    assertEquals(1, gasCacheObj.getCallsCount, "getToGlobalCache should be called once");
    assertEquals(1, gasCacheObj.putCallsCount);
    
    // first test > check again
    reset();
    var origExpEvalRes = expEvalRes;
    expEvalRes = "dummy";
    res = _cacheUnderScope.lookupAndEvalValue(_c.caches._testCacheEntryKey1, evalFunc);
    expEvalRes = origExpEvalRes;
    assertEquals(0, evalFuncExecutedCounter, "evalFunc should not be called");
    assertEquals(origExpEvalRes, res, "Cached value was reevaluated and is wrong");
    assertEquals(0, gasCacheObj.getCallsCount, "get from GlobalCache should not be called");
    assertEquals(0, gasCacheObj.putCallsCount, "put to GlobalCache should not be called");
    
    
    // second test (locking mechanism enabled)
    reset();
    _c.caches["_testCacheEntryKey2"] = { name: "_testCacheEntryKey2", localOnly: false };
    var res = _cacheUnderScope.lookupAndEvalValue(_c.caches._testCacheEntryKey2, evalFunc, true);
    assertEquals(1, evalFuncExecutedCounter, "evalFunc should be called only once");
    assertEquals(expEvalRes, res, "Cached value res wrong");
    
    assertEquals(2, gasCacheObj.getCallsCount, "getToGlobalCache should be called twice");
    assertEquals(1, gasCacheObj.putCallsCount);
    
    // third test (local cache only)
    reset();
    _c.caches["_testCacheEntryKey3"] = { name: "_testCacheEntryKey3", localOnly: true };
    var res = _cacheUnderScope.lookupAndEvalValue(_c.caches._testCacheEntryKey3, evalFunc);
    assertEquals(1, evalFuncExecutedCounter, "evalFunc should be called only once");
    assertEquals(expEvalRes, res, "Cached value res wrong");
    
    assertEquals(0, gasCacheObj.getCallsCount, "getToGlobalCache should not be called!");
    assertEquals(0, gasCacheObj.putCallsCount);
  }
}