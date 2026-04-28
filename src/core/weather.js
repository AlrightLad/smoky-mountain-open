/* ═══════════════════════════════════════════════════════════════════════════
   PB.weather — live weather data layer (v8.10.0 · Ship 8)

   Public API:
     PB.weather.getDisplay({format, includeWind})
       format:      'pill' | 'caption' | 'eyebrow'
       includeWind: bool — whether to append wind segment when threshold met
       Returns Promise<{
         temp, condition, windSpeed, windDir,
         displayString, locationName, cachedAt, isFresh
       }>

     PB.weather.refresh()
       Force-fetch, bypass cache. Reserved for future manual-refresh UX.

   Phase 1 location strategy (v8.10.0):
     1. currentProfile.homeCourse → PB.getCourseByName().location → coords
     2. fallback: York, PA (39.96, -76.73) — founding league home base

   Cache: sessionStorage 'pb_weather_cache', 30-min TTL, invalidates on coord
   change. Failures log to pbWarn but resolve gracefully (caller hides UI).

   Out of scope (queued):
     - Phase 2: profile location field via settings (future ship)
     - Phase 3: opt-in browser geolocation (future ship)
     - Per-course weather data layer (v8.10.1 → Ship 4a spectator HUD)
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

  function _readCache(coordsKey) {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
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

  function _writeCache(coordsKey, data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        coordsKey: coordsKey,
        cachedAt: Date.now(),
        data: data
      }));
    } catch (e) { /* quota / private mode — silent */ }
  }

  // Fetch from Open-Meteo. Returns parsed weather object or null on failure.
  function _fetch(coords) {
    var url = API_BASE
      + "?latitude=" + coords.lat
      + "&longitude=" + coords.lng
      + "&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code"
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
      return {
        temp: Math.round(json.current.temperature_2m),
        condition: _wmoToCondition(json.current.weather_code),
        windSpeed: Math.round(json.current.wind_speed_10m || 0),
        windDir: _degToCompass(json.current.wind_direction_10m),
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
    var cached = _readCache(key);

    function pack(data, cachedAt, isFresh) {
      if (!data) return null;
      return {
        temp: data.temp,
        condition: data.condition,
        windSpeed: data.windSpeed,
        windDir: data.windDir,
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
        _writeCache(key, data);
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
      if (data) _writeCache(_coordsKey(coords), data);
      return data;
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

  // Attach to PB. PB exists from data.js (loaded earlier in CORE_FILES order).
  if (typeof PB !== "undefined") {
    PB.weather = {
      getDisplay: getDisplay,
      refresh: refresh,
      geocodeCity: geocodeCity,
      reverseGeocode: reverseGeocode,
      getResolutionStatus: getResolutionStatus
    };
  }
})();
