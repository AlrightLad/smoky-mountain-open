/* ═══════════════════════════════════════════════════════════════════════════
   PB.weather — live weather data layer (v8.10.0 → v8.11.3)

   Public API:
     PB.weather.getDisplay({format, includeWind})
       User-location weather. Resolves coords via three-tier chain
       (profile.location → homeCourse → York fallback).
       Returns Promise<{ temp, condition, windSpeed, windDir, windDeg,
                         humidity, locationName, displayString,
                         cachedAt, isFresh }>

     PB.weather.getCourseDisplay(coords, {format, includeWind})  (v8.11.3)
       Per-course weather. Caller passes resolved coords {lat, lng, name?}
       from a course doc. Independent cache namespace
       (pb_weather_cache_course_<key>). Returns same shape as getDisplay.
       Null-returns on missing coords or lat===0 && lng===0 sentinel.

     PB.weather.refresh()
       Force-fetch user-path, bypass cache. Reserved for future manual UX.

     PB.weather.geocodeCity / reverseGeocode  (v8.11.0)
     PB.weather.getResolutionStatus  (v8.11.0)
     PB.weather.checkStaleness  (v8.11.1 — silent background refresh)

   Cache: sessionStorage. User path 'pb_weather_cache'; per-course path
   'pb_weather_cache_course_<latkey>_<lngkey>'. 30-min TTL on both.
   Failures log to pbWarn and resolve gracefully (caller hides UI).
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var CACHE_KEY = "pb_weather_cache";
  var CACHE_TTL_MS = 30 * 60 * 1000;        // 30 minutes
  var WIND_THRESHOLD_MPH = 5;                // append wind segment at this speed and above
  var FALLBACK_COORDS = { lat: 39.96, lng: -76.73, name: "York, PA" };
  var API_BASE = "https://api.open-meteo.com/v1/forecast";

  // WMO weather code → display string. Per design bot ruling Q3.
  // Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
  function _wmoToCondition(code) {
    if (code === 0) return "CLEAR";
    if (code === 1) return "MAINLY CLEAR";
    if (code === 2) return "PARTLY CLOUDY";
    if (code === 3) return "OVERCAST";
    if (code === 45 || code === 48) return "FOG";
    if (code >= 51 && code <= 55) return "DRIZZLE";
    if (code === 56 || code === 57) return "FREEZING DRIZZLE";
    if (code >= 61 && code <= 65) return "RAIN";
    if (code === 66 || code === 67) return "FREEZING RAIN";
    if (code >= 71 && code <= 75) return "SNOW";
    if (code === 77) return "SNOW GRAINS";
    if (code >= 80 && code <= 82) return "RAIN SHOWERS";
    if (code === 85 || code === 86) return "SNOW SHOWERS";
    if (code === 95) return "THUNDERSTORM";
    if (code === 96 || code === 99) return "THUNDERSTORM W/ HAIL";
    return "UNKNOWN";
  }

  // 8-point compass conversion per design bot ruling Q3.
  function _degToCompass(deg) {
    if (deg == null || !Number.isFinite(deg)) return "";
    var dirs = ["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  }

  // Resolve user location. Three-tier resolution (v8.11.0):
  //   1. profile.location (user-set, source of truth)
  //   2. profile.homeCourse → course flat c.lat/c.lng (v8.10.1 path)
  //   3. York fallback (founding league home base)
  //
  // Course shape stores coords as flat c.lat / c.lng (per data.js:278-279).
  // The c.location.latitude/longitude shape is the GolfCourseAPI response
  // shape — flattened during PB.addCourse() before storage. (v8.10.1 fix)
  function _coords() {
    try {
      // Priority 1: profile.location (v8.11.0)
      if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.location
          && typeof currentProfile.location.lat === "number"
          && typeof currentProfile.location.lng === "number") {
        return {
          lat: currentProfile.location.lat,
          lng: currentProfile.location.lng,
          // "Your location" only surfaces if save path landed coords without
          // a name field — should never happen in v8.11.0 (settings.js always
          // populates name from forward/reverse geocoding). If you see this
          // string in production, treat as a signal to investigate the save
          // path — likely a partial-write bug or schema-drift regression.
          name: currentProfile.location.name || "Your location"
        };
      }
      // Priority 2: homeCourse with valid coords
      if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.homeCourse
          && typeof PB !== "undefined" && PB.getCourseByName) {
        var c = PB.getCourseByName(currentProfile.homeCourse);
        if (c && typeof c.lat === "number" && typeof c.lng === "number") {
          return {
            lat: c.lat,
            lng: c.lng,
            name: c.loc || c.name || currentProfile.homeCourse
          };
        }
      }
    } catch (e) { /* fall through to York */ }
    // Priority 3: York fallback
    return FALLBACK_COORDS;
  }

  function _coordsKey(coords) {
    return coords.lat.toFixed(2) + "_" + coords.lng.toFixed(2);
  }

  // Cache primitives (v8.11.3 — refactored to take explicit storageKey).
  // User path uses CACHE_KEY directly; per-course path uses
  // CACHE_KEY + "_course_" + coordsKey for namespaced isolation.
  function _readCache(storageKey, coordsKey) {
    try {
      var raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.coordsKey !== coordsKey) return null;
      var age = Date.now() - (parsed.cachedAt || 0);
      if (age > CACHE_TTL_MS) return { stale: true, data: parsed.data, cachedAt: parsed.cachedAt };
      return { stale: false, data: parsed.data, cachedAt: parsed.cachedAt };
    } catch (e) {
      return null;
    }
  }

  function _writeCache(storageKey, coordsKey, data) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        coordsKey: coordsKey,
        cachedAt: Date.now(),
        data: data
      }));
    } catch (e) { /* quota / private mode — silent */ }
  }

  // Fetch from Open-Meteo. Returns parsed weather object or null on failure.
  // v8.11.3: relative_humidity_2m added to current= params; windDeg numeric +
  // humidity exposed in returned shape for spectator HUD consumption.
  function _fetch(coords) {
    var url = API_BASE
      + "?latitude=" + coords.lat
      + "&longitude=" + coords.lng
      + "&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,relative_humidity_2m"
      + "&temperature_unit=fahrenheit"
      + "&wind_speed_unit=mph";
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function(json) {
      if (!json || !json.current || json.current.temperature_2m == null) {
        if (typeof pbWarn === "function") pbWarn("[weather] Unexpected API response", json);
        return null;
      }
      var deg = json.current.wind_direction_10m;
      return {
        temp: Math.round(json.current.temperature_2m),
        condition: _wmoToCondition(json.current.weather_code),
        windSpeed: Math.round(json.current.wind_speed_10m || 0),
        windDir: _degToCompass(deg),
        windDeg: (typeof deg === "number" && Number.isFinite(deg)) ? Math.round(deg) : null,
        humidity: (json.current.relative_humidity_2m != null) ? Math.round(json.current.relative_humidity_2m) : null,
        locationName: coords.name
      };
    }).catch(function(e) {
      if (typeof pbWarn === "function") pbWarn("[weather] fetch failed:", e.message);
      return null;
    });
  }

  // Format a weather object per the requested display variant.
  function _formatDisplay(data, format, includeWind) {
    if (!data) return "";
    var temp = data.temp + "°";
    var hasWind = includeWind && data.windSpeed >= WIND_THRESHOLD_MPH && data.windDir;

    if (format === "eyebrow") {
      // Atmospheric: "YORK, PA · 58° AND CLEAR" — no wind
      return (data.locationName || "").toUpperCase() + " · " + temp + " AND " + data.condition;
    }
    if (format === "caption") {
      // Band A row-2: "58° CLEAR" — no wind, narrow space
      return temp + " " + data.condition;
    }
    // 'pill' default — Bands B/C/D: "58° · CLEAR" + conditional wind
    var s = temp + " · " + data.condition;
    if (hasWind) s += " · " + data.windSpeed + "MPH " + data.windDir;
    return s;
  }

  function getDisplay(opts) {
    opts = opts || {};
    var format = opts.format || "pill";
    var includeWind = opts.includeWind !== false;  // default true
    var coords = _coords();
    var key = _coordsKey(coords);
    var cached = _readCache(CACHE_KEY, key);

    function pack(data, cachedAt, isFresh) {
      if (!data) return null;
      return {
        temp: data.temp,
        condition: data.condition,
        windSpeed: data.windSpeed,
        windDir: data.windDir,
        windDeg: data.windDeg,
        humidity: data.humidity,
        locationName: data.locationName,
        cachedAt: cachedAt,
        isFresh: isFresh,
        displayString: _formatDisplay(data, format, includeWind)
      };
    }

    // Fresh cache — return immediately.
    if (cached && !cached.stale) {
      return Promise.resolve(pack(cached.data, cached.cachedAt, true));
    }

    // Stale or missing — fetch. On success, write cache. On failure, return
    // stale data if available, else null.
    return _fetch(coords).then(function(data) {
      if (data) {
        _writeCache(CACHE_KEY, key, data);
        return pack(data, Date.now(), true);
      }
      if (cached && cached.data) {
        // API failed but stale cache exists — return stale data silently
        return pack(cached.data, cached.cachedAt, false);
      }
      return null;
    });
  }

  function refresh() {
    var coords = _coords();
    return _fetch(coords).then(function(data) {
      if (data) _writeCache(CACHE_KEY, _coordsKey(coords), data);
      return data;
    });
  }

  // ─── Per-course weather (v8.11.3 — Ship 4a foundation) ─────────────────────
  // Coords-first API. Caller (Ship 4a spectator HUD, future round cards)
  // resolves round → course → coords from c.lat / c.lng, then invokes this.
  // Decoupled from course schema so future schema migration doesn't ripple
  // into the data layer.
  //
  // Cache key: pb_weather_cache_course_<latkey>_<lngkey>. Independent of user
  // weather cache. 30-min TTL matches user path; reconsider post-Ship 4a if
  // spectator UX feels stale.
  //
  // Defensive returns null on:
  //   - missing/invalid coords (no lat/lng or non-numeric)
  //   - lat===0 && lng===0 (sentinel for courses without API coords — see
  //     courses.js:237-239,379-380 `(c.location && c.location.latitude) || 0`
  //     fallback. Do not fetch weather for the Gulf of Guinea.)
  //   - fetch failure with no stale cache available
  //
  // Returned shape mirrors getDisplay (additive — same fields plus humidity
  // and windDeg numeric). Caller picks fields per its own UI needs.
  function getCourseDisplay(coords, opts) {
    opts = opts || {};
    var format = opts.format || "pill";
    var includeWind = opts.includeWind !== false;

    if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
      return Promise.resolve(null);
    }
    if (coords.lat === 0 && coords.lng === 0) return Promise.resolve(null);

    var fetchCoords = { lat: coords.lat, lng: coords.lng, name: coords.name || "Course" };
    var coordsKey = _coordsKey(fetchCoords);
    var storageKey = CACHE_KEY + "_course_" + coordsKey;
    var cached = _readCache(storageKey, coordsKey);

    function pack(data, cachedAt, isFresh) {
      if (!data) return null;
      return {
        temp: data.temp,
        condition: data.condition,
        windSpeed: data.windSpeed,
        windDir: data.windDir,
        windDeg: data.windDeg,
        humidity: data.humidity,
        locationName: data.locationName,
        cachedAt: cachedAt,
        isFresh: isFresh,
        displayString: _formatDisplay(data, format, includeWind)
      };
    }

    if (cached && !cached.stale) {
      return Promise.resolve(pack(cached.data, cached.cachedAt, true));
    }

    return _fetch(fetchCoords).then(function(data) {
      if (data) {
        _writeCache(storageKey, coordsKey, data);
        return pack(data, Date.now(), true);
      }
      if (cached && cached.data) return pack(cached.data, cached.cachedAt, false);
      return null;
    });
  }

  // ─── Geocoding helpers (v8.11.0 — Member Location ship) ────────────────────
  // Forward + reverse via Open-Meteo geocoding-api subdomain. Same provider
  // family as forecast (api.open-meteo.com). Free tier shared rate limit;
  // geocoding is one-shot per location-set action so per-user load is trivial.
  // Both helpers return null on any error — caller renders graceful caption.

  // Forward geocoding: city name (+ optional state) → coords + canonical name
  function geocodeCity(cityName, stateCode) {
    if (!cityName) return Promise.resolve(null);
    var params = "name=" + encodeURIComponent(cityName);
    if (stateCode) params += "&country=US&admin1=" + encodeURIComponent(stateCode);
    return fetch("https://geocoding-api.open-meteo.com/v1/search?" + params + "&count=1")
      .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(data) {
        if (!data || !data.results || !data.results.length) return null;
        var hit = data.results[0];
        if (typeof hit.latitude !== "number" || typeof hit.longitude !== "number") return null;
        return {
          lat: hit.latitude,
          lng: hit.longitude,
          name: hit.name + (hit.admin1 ? ", " + hit.admin1 : "")
        };
      })
      .catch(function(e) {
        if (typeof pbWarn === "function") pbWarn("[weather] geocodeCity failed:", e.message);
        return null;
      });
  }

  // Reverse geocoding: coords → display name (e.g., "Charlotte, NC")
  function reverseGeocode(lat, lng) {
    if (typeof lat !== "number" || typeof lng !== "number") return Promise.resolve(null);
    var url = "https://geocoding-api.open-meteo.com/v1/reverse?latitude=" + lat
      + "&longitude=" + lng + "&count=1";
    return fetch(url)
      .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(data) {
        if (!data || !data.results || !data.results.length) return null;
        var hit = data.results[0];
        if (!hit.name) return null;
        return hit.name + (hit.admin1 ? ", " + hit.admin1 : "");
      })
      .catch(function(e) {
        if (typeof pbWarn === "function") pbWarn("[weather] reverseGeocode failed:", e.message);
        return null;
      });
  }

  // Resolution status — synchronous query for the HQ Home banner trigger.
  // Returns whether _coords() resolved to a non-fallback source. NO fetch,
  // NO cache write. Per Call 2 / design bot Option B: banner hides when
  // EITHER profile.location is set OR homeCourse provides valid coords.
  function getResolutionStatus() {
    var c = _coords();
    var isFallback = c.lat === FALLBACK_COORDS.lat && c.lng === FALLBACK_COORDS.lng;
    var hasProfileLocation = typeof currentProfile !== "undefined" && currentProfile
      && currentProfile.location
      && typeof currentProfile.location.lat === "number";
    return {
      resolved: !isFallback,
      source: hasProfileLocation ? "profile" : (isFallback ? "fallback" : "homeCourse"),
      name: c.name
    };
  }

  // ─── Staleness refresh helpers (v8.11.1 · Background location refresh) ────
  //
  // PRIVACY POSTURE — three invariants enforced before any silent geolocation:
  //   1. 7-day staleness gate (only fires when location.setAt > 7 days old)
  //   2. Permission state must be "granted" — never auto-prompts users
  //   3. Once-per-session via sessionStorage flag (24hr TTL inside session)
  //
  // The user granted permission for "show me accurate weather", not "track my
  // movements". Silent re-detection happens only when (a) they previously
  // granted, (b) significant time has passed, (c) they haven't been checked
  // this session. Per design bot v8.11.2 — silent path avoids contradicting
  // the privacy copy ("we don't track your movements") which a visible refresh
  // prompt would.
  //
  // 10-mile delta gate filters commute/errands noise: only persist updates
  // when the user has actually relocated, not just left the house.
  // ──────────────────────────────────────────────────────────────────────────

  var STALENESS_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
  var STALENESS_DELTA_MILES = 10;                          // 10mi minimum to update
  var STALENESS_SESSION_KEY = "pb_location_staleness_checked";
  var STALENESS_SESSION_TTL_MS = 24 * 60 * 60 * 1000;     // 24hr in-session re-check
  var SILENT_GEO_TIMEOUT_MS = 5000;                        // silent path: 5s timeout
  var SILENT_GEOCODE_TIMEOUT_MS = 5000;                    // reverse geocode: 5s timeout

  // Defensive setAt parser. Returns ms-age. Infinity if missing/unparseable
  // (treated as ancient — triggers refresh on corrupt data, fail-forward).
  function _setAtAgeMs(setAt) {
    if (!setAt) return Infinity;
    if (setAt.toDate && typeof setAt.toDate === "function") {
      try { return Date.now() - setAt.toDate().getTime(); } catch (e) { return Infinity; }
    }
    if (typeof setAt === "string") {
      var ms = Date.parse(setAt);
      return isNaN(ms) ? Infinity : Date.now() - ms;
    }
    if (typeof setAt === "number") return Date.now() - setAt;
    return Infinity;
  }

  // Haversine distance in miles between two lat/lng points.
  // ±0.5% error at North America latitudes — well within 10mi tolerance.
  function _milesBetween(lat1, lng1, lat2, lng2) {
    var R = 3958.8; // Earth radius in miles
    var toRad = function(d) { return d * Math.PI / 180; };
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
          * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Once-per-session gate (24hr TTL inside session for long-lived tabs).
  function _shouldRunStaleness() {
    try {
      var raw = sessionStorage.getItem(STALENESS_SESSION_KEY);
      if (!raw) return true;
      var last = parseInt(raw, 10);
      if (isNaN(last)) return true;
      return (Date.now() - last) > STALENESS_SESSION_TTL_MS;
    } catch (e) { return true; }
  }

  function _markStalenessChecked() {
    try { sessionStorage.setItem(STALENESS_SESSION_KEY, String(Date.now())); }
    catch (e) { /* private mode quota — non-critical */ }
  }

  // Promise.race timeout wrapper. Resolves to null on timeout (silent failure).
  function _withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function(resolve) { setTimeout(function() { resolve(null); }, ms); })
    ]);
  }

  // Silent getCurrentPosition wrapper. Returns Promise<{lat, lng} | null>.
  // Never throws, never prompts (caller verified permission "granted" first).
  function _silentGeolocate() {
    return new Promise(function(resolve) {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        function(pos) { resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        function() { resolve(null); },  // any error → silent null
        { enableHighAccuracy: false, timeout: SILENT_GEO_TIMEOUT_MS, maximumAge: 60000 }
      );
    });
  }

  // Main staleness check. Silent throughout — never throws, never alerts user.
  // Logs to pbWarn for observability on Firestore failures only.
  function _checkLocationStaleness() {
    // Guard 1: must be on session-eligible window
    if (!_shouldRunStaleness()) return;

    // Guard 2: profile must exist with location set
    if (typeof currentProfile === "undefined" || !currentProfile) return;
    var loc = currentProfile.location;
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return;

    // Guard 3: setAt must be older than threshold
    var ageMs = _setAtAgeMs(loc.setAt);
    if (ageMs < STALENESS_THRESHOLD_MS) {
      _markStalenessChecked();   // mark so we don't re-check fresh data this session
      return;
    }

    // Guard 4: permissions API must report "granted" (no prompt, no denial)
    if (!navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: "geolocation" }).then(function(status) {
      if (status.state !== "granted") return;

      // Silent geolocate (already wrapped in 5s timeout via getCurrentPosition options)
      _silentGeolocate().then(function(coords) {
        if (!coords) return;

        // Guard 5: did user move significantly?
        var miles = _milesBetween(loc.lat, loc.lng, coords.lat, coords.lng);
        if (miles < STALENESS_DELTA_MILES) {
          _markStalenessChecked();   // we checked, didn't move enough — don't re-check this session
          return;
        }

        // Reverse geocode for new display name (5s Promise.race timeout).
        // On fail/timeout/missing geocoder: keep old name, update only coords.
        var geoPromise = (typeof PB !== "undefined" && PB.weather && PB.weather.reverseGeocode)
          ? _withTimeout(PB.weather.reverseGeocode(coords.lat, coords.lng), SILENT_GEOCODE_TIMEOUT_MS)
          : Promise.resolve(null);

        geoPromise.then(function(name) {
          var newLocation = {
            lat: coords.lat,
            lng: coords.lng,
            name: name || loc.name || "My Location",
            source: "geolocation",
            setAt: (typeof firebase !== "undefined" && firebase.firestore)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date().toISOString()
          };

          // Write to Firestore. Pattern matches settings.js (uses currentUser.uid + db global).
          if (typeof db !== "undefined" && db && typeof currentUser !== "undefined" && currentUser && currentUser.uid) {
            db.collection("members").doc(currentUser.uid).update({ location: newLocation })
              .then(function() {
                currentProfile.location = newLocation;  // mirror so this-session reads see it
                _markStalenessChecked();
              })
              .catch(function(e) {
                if (typeof pbWarn === "function") pbWarn("[weather] staleness write failed:", e.message);
              });
          }
        });
      });
    }).catch(function() { /* permissions.query rejected — silent */ });
  }

  // Attach to PB. PB exists from data.js (loaded earlier in CORE_FILES order).
  if (typeof PB !== "undefined") {
    PB.weather = {
      getDisplay: getDisplay,
      getCourseDisplay: getCourseDisplay,  // (v8.11.3)
      refresh: refresh,
      geocodeCity: geocodeCity,
      reverseGeocode: reverseGeocode,
      getResolutionStatus: getResolutionStatus,
      checkStaleness: _checkLocationStaleness  // (v8.11.1)
    };
  }
})();
