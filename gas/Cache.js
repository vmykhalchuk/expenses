class Cache {
  
  static get inst() {
    if (!this._inst) {
      this._inst = new this();
    }
    return this._inst;
  }
  
  static get i() {
    return this.inst;
  }
  
  constructor() {
    this._localCache = {};
  }
  
  getCacheKeysDescriptionAsString() {
    var res = "";
    for (var key in _c.caches) {
      this._validateKey(key);
      if (res !== "") {
        res += ", ";
      }
      res += key + "[" + (_c.caches[key].localOnly ? "L" : "G") + "]";
    }
    return res;
  }
  
  lookupValue(cacheConfig) {
    return this.lookupAndEvalValue(cacheConfig);
  }
  
  lookupAndEvalValue(cacheConfig, evalFunc, lockOnEvaluation) {
    this._validateCacheConfig(cacheConfig);
    var key = cacheConfig.name;
    
    // 1) check local cache - if exists - return it
    // 2) check global cache (only if keyConfig==G) - if exists store into local cache - return it
    // 3) [optional] wait for lock
    // 3b) perform steps 1 and 2 again
    // 4) evaluate function
    // 5) store into global cache (only if keyConfig==G)
    // 6) store into local cache and return result
    
    var result;
    
    result = this._localCache[key];
    if (result) return result;
    
    if (!cacheConfig.localOnly) result = this._gasCache().get(key);
    this._localCache[key] = result;
    if (result) return result;
    
    var lock;
    if (lockOnEvaluation) {
      lock = LockService.getScriptLock();
      lock.waitLock(5000);
    }
    try {
      if (lockOnEvaluation) {
        // double check caches (could be populated while we waited for lock)
        var result = this._localCache[key];
        if (result) return result;
        
        if (!cacheConfig.localOnly) result = this._gasCache().get(key);
        this._localCache[key] = result;
        if (result) return result;
      }
      
      if (!evalFunc) return null;
      result = evalFunc.call();
      
      if (!cacheConfig.localOnly) this._gasCache().put(key, "" + result, 21600 /*6h*/);
      
      this._localCache[key] = result;
      return result;
    } finally {
      if (lockOnEvaluation) lock.releaseLock();
    }
  }
  
  removeCacheEntry(cacheConfig) {
    this._validateCacheConfig(cacheConfig);
    var key = cacheConfig.name;
    this._localCache[key] = null;
    if (!cacheConfig.localOnly) this._gasCache().remove(key);
  }
  
  removeAllCacheEntries() {
    for (var k in _c.caches) {
      this.removeCacheEntry(_c.caches[k]);
    }
  }
  
  _gasCache() {
    return CacheService.getScriptCache();
  }
  
  _validateKey(key) {
    var cacheConfig = _c.caches[key];
    if (cacheConfig === undefined) throw new Error("Cache key is not defined in _c.caches: " + key);
    if (cacheConfig.name !== key) throw new Error("Cache configured wrongly, " + 
                                                "name doesn't match or is missing for key: " + key);
    return _c.caches[key];
  }
  
  _validateCacheConfig(cacheConfig) {
    if (!cacheConfig || !cacheConfig.name) throw new Error("cacheConfig must be one of _c.caches.*** values!");
    if (!_c.caches[cacheConfig.name]) throw new Error("cacheConfig.name is missing in _c.caches! name:" + cacheConfig.name);
    if (_c.caches[cacheConfig.name] !== cacheConfig) throw new Error("cacheConfig is faked!");
  }
}