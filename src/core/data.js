var PB = (function() {
  var state = null;

  /* ---------- DEFAULT DATA ---------- */
  var DEFAULT_PLAYERS = [
    {id:"zach",name:"Mr Parbaugh",username:"TheCommissioner",title:"The Original Four · Commissioner",range:"88-96",bio:"Founded the Parbaughs. Tracks stats like his life depends on it.",emoji:"",photo:"",homeCourse:"Briarwood East",favoriteCourse:"Royal Manchester Golf Links",bagPhoto:"",founding:true,referredBy:null,trips:1,wins:0,manualHandicap:null,equippedTitle:"The Original Four · Commissioner",
     clubs:{driver:"270",three_wood:"250",five_wood:"230",four_iron:"215",five_iron:"210",six_iron:"200",seven_iron:"190",eight_iron:"180",nine_iron:"165",pw:"140",gw:"120",sw:"110",lw:"95",putter:""},
     bag:{driver:"TaylorMade Qi4D Driver",irons:"Callaway Quantum Max OS 5-PW",wedges:"Cleveland RTX 6 ZipCore 52/56",putter:"",bag_brand:"",accessories:"",fav_ball:""},
     funnyFacts:["Bought custom-fit irons before breaking 85","Owns more golf trackers than golf shirts","Will quote his handicap unprompted"]},
    {id:"kayvan",name:"Kayvan",username:"Kayvan",title:"The Original Four",range:"102-115",bio:"",emoji:"",photo:"",homeCourse:"Pleasant Valley Golf Club",favoriteCourse:"Royal Manchester Golf Links",bagPhoto:"",founding:true,referredBy:null,trips:1,wins:0,manualHandicap:null,equippedTitle:"The Original Four",
     clubs:{driver:"210",five_wood:"180",four_hybrid:"170",five_iron:"150",six_iron:"140",seven_iron:"130",eight_iron:"120",nine_iron:"110",pw:"100",gw:"90",putter:""},
     bag:{},funnyFacts:[]},
    {id:"kiyan",name:"Kiyan",username:"Kiyan",title:"The Original Four",range:"91-104",bio:"",emoji:"",photo:"",homeCourse:"Pleasant Valley Golf Club",favoriteCourse:"Westminster National",bagPhoto:"",founding:true,referredBy:null,trips:1,wins:0,manualHandicap:null,equippedTitle:"The Original Four",
     clubs:{},bag:{},funnyFacts:[]},
    {id:"nick",name:"Nick",username:"Nick",title:"The Original Four",range:"115-120",bio:"",emoji:"",photo:"",homeCourse:"Honey Run Golf Club",favoriteCourse:"Honey Run Golf Club",bagPhoto:"",founding:true,referredBy:null,trips:1,wins:0,manualHandicap:null,equippedTitle:"The Original Four",
     clubs:{},bag:{},funnyFacts:[]}
  ];

  var DEFAULT_COURSES = [];

  /* Course search - fuzzy match against imported/added courses */
  function searchCourses(query) {
    if (!query || query.length < 2) return [];
    var q = query.toLowerCase();
    return state.courses.filter(function(c) {
      return c.name.toLowerCase().indexOf(q) !== -1 || (c.loc||"").toLowerCase().indexOf(q) !== -1 || (c.region||"").toLowerCase() === q;
    }).slice(0, 8);
  }

  var DEFAULT_TRIPS = [
    {id:"smo2026",name:"The Smoky Mountain Open",location:"Asheville, NC",dates:"Apr 8-12, 2026",startDate:"2026-04-08",endDate:"2026-04-12",status:"upcoming",champion:null,
     members:["zach","kayvan","kiyan","nick"],photos:[],
     courses:[
       {key:"scramble",courseId:"sequoyah",n:"Sequoyah National",d:"Thursday",t:"1:20 PM",p:[5,3,5,4,4,3,4,3,5,4,5,5,3,4,4,4,3,4],f:"Scramble",s:1,tee:"Silver",r:67.5,sl:130,y:5528},
       {key:"springdale",courseId:"springdale",n:"Springdale Resort",d:"Friday AM",t:"8:30 AM",p:[4,4,3,4,5,4,4,3,5,5,4,3,4,4,4,4,3,5],f:"Stableford (1x)",m:1,tee:"White",r:70.3,sl:126,y:6437},
       {key:"maggie",courseId:"maggie",n:"Maggie Valley",d:"Friday PM",t:"4:00 PM",p:[4,4,4,5,4,5,3,4,3,4,4,3,5,4,3,4,4,5],f:"Stableford (1x)",m:1,tee:"White",r:69.1,sl:129,y:5907},
       {key:"connestee",courseId:"connestee",n:"Connestee Falls",d:"Saturday",t:"TBD",p:[4,5,4,4,3,4,5,3,4,4,5,4,3,4,5,4,3,4],f:"Stableford (1.5x)",m:1.5,tee:"White",r:68.4,sl:121,y:5727}
     ],
     miniGames:[
       {i:"ctp1",l:"CTP #1",p:2},{i:"ctp2",l:"CTP #2",p:2},{i:"ctp3",l:"CTP #3",p:2},{i:"ctp4",l:"CTP #4",p:2},
       {i:"ld_f",l:"Long Drive (F9)",p:2},{i:"ld_b",l:"Long Drive (B9)",p:2},{i:"pred",l:"Score Predict",p:3}
     ],
     bonusAwards:[
       {i:"sandman",l:"Sandman",d:"Most pars-or-better from bunkers",p:5},
       {i:"shortgame",l:"Short Game King",d:"Most up-and-downs",p:5},
       {i:"coldblooded",l:"Cold Blooded",d:"Most one-putts",p:5},
       {i:"phoenix",l:"Phoenix",d:"Best single hole vs group",p:3}
     ]
    }
  ];

  function createDefault() {
    var scores = {};
    DEFAULT_TRIPS.forEach(function(tr) {
      scores[tr.id] = {};
      tr.courses.forEach(function(c) {
        scores[tr.id][c.key] = {};
        if (c.s) scores[tr.id][c.key].team = Array(18).fill("");
        else tr.members.forEach(function(pid) { scores[tr.id][c.key][pid] = Array(18).fill(""); });
      });
    });
    var mini = {}; DEFAULT_TRIPS[0].miniGames.forEach(function(g) { mini[g.i] = ""; });
    var bonus = {}; DEFAULT_TRIPS[0].bonusAwards.forEach(function(b) { bonus[b.i] = ""; });
    return {
      players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)),
      courses: JSON.parse(JSON.stringify(DEFAULT_COURSES)),
      trips: JSON.parse(JSON.stringify(DEFAULT_TRIPS)),
      scores: scores,
      miniWinners: mini,
      bonusWinners: bonus,
      rounds: [],
      scrambleTeams: [{id:"smo_scramble",name:"The Parbaughs",members:["zach","kayvan","kiyan","nick"],captain:"zach",size:4,matches:[]}],
      records: { longestDrive: null, holeInOnes: [] },
      version: 3
    };
  }

  /* ---------- PERSISTENCE ---------- */
  // All data is Firestore-authoritative. localStorage is not used for user data.
  // Firestore offline persistence (IndexedDB via enablePersistence) handles offline resilience.
  function load() {
    // Always start from clean in-memory defaults.
    // Firestore sync functions fill in real data after auth resolves.
    state = createDefault();
    return state;
  }

  function save() {
    // No-op — Firestore is the single source of truth.
    // All data writes go directly to Firestore via sync functions.
    // localStorage is not used for user data.
  }

  function exportBackup() {
    return btoa(JSON.stringify(state));
  }

  function importBackup(code) {
    try {
      var d = JSON.parse(atob(code));
      if (d.players && d.scores) { state = d; save(); return true; }
    } catch(e) {}
    return false;
  }

  function reset() {
    state = createDefault();
  }

  /* ---------- PLAYER OPS (Firestore-first) ---------- */
  function getPlayer(id) {
    if (!id) return null;
    // 1. Check Firestore cache first (authoritative)
    if (typeof fbMemberCache !== "undefined") {
      if (fbMemberCache[id]) return fbMemberCache[id];
      // Reverse lookup: id might be a seed ID that was claimed
      var keys = Object.keys(fbMemberCache);
      for (var ki = 0; ki < keys.length; ki++) {
        var m = fbMemberCache[keys[ki]];
        if (m.claimedFrom === id) return m;
      }
    }
    // 2. Fall back to local seed data (offline or pre-Firestore load)
    var local = state.players.find(function(p) { return p.id === id; });
    if (local) return local;
    // 3. Check currentProfile as last resort
    if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.id === id) return currentProfile;
    return null;
  }
  
  function getPlayers() {
    // Merge Firestore members (authoritative) with unclaimed local members
    if (typeof fbMemberCache === "undefined" || !Object.keys(fbMemberCache).length) return state.players;
    var merged = [];
    var seenIds = {};
    var claimedSeedIds = {};
    // First: add all Firestore members (deduplicated)
    Object.keys(fbMemberCache).forEach(function(key) {
      var m = fbMemberCache[key];
      if (!m || !m.id || isBannedRole(m)) return;
      if (m.claimedFrom) claimedSeedIds[m.claimedFrom] = true;
      // Only add once per unique ID (fbMemberCache stores both uid and claimedFrom keys)
      if (seenIds[m.id]) return;
      seenIds[m.id] = true;
      merged.push(m);
    });
    // Second: add local seed players that haven't been claimed
    state.players.forEach(function(p) {
      if (seenIds[p.id] || claimedSeedIds[p.id]) return;
      seenIds[p.id] = true;
      merged.push(p);
    });
    return merged;
  }

  // Get all known IDs for a player (Firebase UID, seed ID, claimedFrom chain)
  function getAllPlayerIds(pid) {
    var ids = [pid];
    var p = getPlayer(pid);
    if (p && p.claimedFrom && ids.indexOf(p.claimedFrom) === -1) ids.push(p.claimedFrom);
    if (p && p.id && ids.indexOf(p.id) === -1) ids.push(p.id);
    // Check reverse: is this pid someone else's claimedFrom?
    if (typeof fbMemberCache !== "undefined") {
      Object.keys(fbMemberCache).forEach(function(k) {
        var m = fbMemberCache[k];
        if (m.claimedFrom === pid && ids.indexOf(m.id) === -1) ids.push(m.id);
        if (m.claimedFrom === pid && ids.indexOf(k) === -1) ids.push(k);
        if (k === pid && m.claimedFrom && ids.indexOf(m.claimedFrom) === -1) ids.push(m.claimedFrom);
      });
    }
    return ids;
  }

  function addPlayer(name, referredBy) {
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (state.players.find(function(p) { return p.id === id; })) return null;
    var p = {
      id: id,
      name: name,
      username: name,
      title: "Member",
      equippedTitle: "Rookie",
      range: "",
      bio: "",
      photo: "",
      stockAvatar: "",
      homeCourse: "",
      favoriteCourse: "",
      bagPhoto: "",
      founding: false,
      referredBy: referredBy || null,
      joinDate: localDateStr(),
      trips: 0,
      wins: 0,
      manualHandicap: null,
      clubs: {},
      bag: {},
      funnyFacts: [],
      // Privacy
      settings: {
        roundVisibility: "public", // "public" or "private"
        profileVisible: true,
        scoreRangeVisible: true
      },
      // Notifications
      notifications: {
        achievementUnlocked: true,
        h2hChallenge: true,
        eventInvite: true,
        roundLogged: true
      },
      // Profile feed posts
      posts: []
    };
    state.players.push(p);
    if (!state.activity) state.activity = [];
    state.activity.push({type:"member_joined",name:name,referredBy:referredBy||"",date:localDateStr(),ts:Date.now()});
    save();
    return p;
  }

  function updatePlayer(id, updates) {
    var p = getPlayer(id);
    if (!p) return;
    Object.keys(updates).forEach(function(k) { p[k] = updates[k]; });
    save();
  }

  function removePlayer(id) {
    state.players = state.players.filter(function(p) { return p.id !== id; });
    save();
  }

  /* ---------- COURSE OPS ---------- */
  function getCourse(id) { return state.courses.find(function(c) { return c.id === id; }); }
  function getCourses() { return state.courses; }
  function getCourseByName(name) { 
    if (!name) return null;
    var exact = state.courses.find(function(c) { return c.name === name; });
    if (exact) return exact;
    // Fuzzy match: normalize by stripping common suffixes
    var norm = normCourseName(name);
    return state.courses.find(function(c) { return normCourseName(c.name) === norm; });
  }
  
  function normCourseName(n) {
    return (n || "").toLowerCase().replace(/\b(golf|club|course|resort|country|cc|gc|g\.c\.|c\.c\.)\b/gi, "").replace(/\s+/g, " ").trim();
  }

  function addCourse(data) {
    // Dedup: if course with same name exists, enrich it instead of duplicating
    var existingByName = state.courses.find(function(c) { return c.name.toLowerCase() === data.name.toLowerCase(); });
    if (existingByName) {
      // Enrich with richer data from API
      if (data.loc && !existingByName.loc) existingByName.loc = data.loc;
      if (data.region && !existingByName.region) existingByName.region = data.region;
      if (data.rating && data.rating !== 72) existingByName.rating = parseFloat(data.rating);
      if (data.slope && data.slope !== 113) existingByName.slope = parseInt(data.slope);
      if (data.par && data.par !== 72) existingByName.par = parseInt(data.par);
      if (data.phone) existingByName.phone = data.phone;
      if (data.website) existingByName.website = data.website;
      if (data.lat) existingByName.lat = data.lat;
      if (data.lng) existingByName.lng = data.lng;
      if (data.tee) existingByName.tee = data.tee;
      if (data.yards) existingByName.yards = data.yards;
      if (data.holes && data.holes.length) existingByName.holes = data.holes;
      if (data.allTees && data.allTees.length) existingByName.allTees = data.allTees;
      if (data.source) existingByName.source = data.source;
      // No save() — courses are Firestore-authoritative
      return existingByName;
    }
    var id = data.name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20);
    var existing = getCourse(id);
    if (existing) id = id + "_" + Date.now().toString(36);
    var c = {id:id,name:data.name,loc:data.loc||"",region:data.region||"",rating:parseFloat(data.rating)||72,slope:parseInt(data.slope)||113,par:parseInt(data.par)||72,photo:data.photo||"",reviews:[]};
    if (data.phone) c.phone = data.phone;
    if (data.website) c.website = data.website;
    if (data.lat) c.lat = data.lat;
    if (data.lng) c.lng = data.lng;
    if (data.tee) c.tee = data.tee;
    if (data.yards) c.yards = data.yards;
    if (data.holes && data.holes.length) c.holes = data.holes;
    if (data.allTees && data.allTees.length) c.allTees = data.allTees;
    if (data.source) c.source = data.source;
    state.courses.push(c);
    // No save() — courses are Firestore-authoritative
    return c;
  }

  function updateCourse(id, updates) {
    var c = getCourse(id);
    if (!c) return;
    Object.keys(updates).forEach(function(k) { c[k] = updates[k]; });
    // No save() — courses are Firestore-authoritative
  }

  function deleteCourse(id) {
    state.courses = state.courses.filter(function(c) { return c.id !== id; });
    // No save() — courses are Firestore-authoritative
  }

  function setCoursesFromFirestore(fsCourses) {
    state.courses = fsCourses && fsCourses.length ? fsCourses : [];
    // No save() — courses are Firestore-authoritative, never localStorage
  }

  function addCourseReview(courseId, review) {
    var c = getCourse(courseId);
    if (!c) return;
    if (!c.reviews) c.reviews = [];
    c.reviews.push(review);
    if (!state.activity) state.activity = [];
    state.activity.push({type:"review",course:c.name,by:review.by,rating:review.rating,date:review.date,ts:Date.now()});
    // No save() — activity is derived, not persisted
  }

  /* ---------- ROUND OPS ---------- */
  function getRounds() { return state.rounds; }
  function getPlayerRounds(pid) {
    var allIds = getAllPlayerIds(pid);
    return state.rounds.filter(function(r) { return allIds.indexOf(r.player) !== -1; });
  }
  function getCourseRounds(courseName) { 
    var norm = normCourseName(courseName);
    return state.rounds.filter(function(r) { return r.course === courseName || normCourseName(r.course) === norm; }); 
  }

  function addRound(data) {
    var p = getPlayer(data.player);
    var r = {
      // v8.13.0 — Accept passed-in id (from finishLiveRound carrying liveState.roundId
      // forward) for /round/:roundId lookup parity. Falls back to inline auto-gen
      // for callers that don't supply one (e.g., manual round entry, tests).
      id: data.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
      player: data.player,
      playerName: data.playerName || (p ? p.name : data.player),
      course: data.course,
      score: parseInt(data.score),
      date: data.date,
      rating: parseFloat(data.rating) || 72,
      slope: parseInt(data.slope) || 113,
      notes: data.notes || "",
      format: data.format || "stroke",
      highlights: data.highlights || [],
      blunders: data.blunders || [],
      scorecardPhoto: data.scorecardPhoto || "",
      timestamp: Date.now(),
      visibility: data.visibility || "public"
    };
    // Preserve Play Now / Log a Round fields when present
    if (data.holeScores) r.holeScores = data.holeScores;
    if (data.holePars) r.holePars = data.holePars;
    if (data.holesPlayed) r.holesPlayed = data.holesPlayed;
    if (data.holesMode) r.holesMode = data.holesMode;
    if (data.firData) r.firData = data.firData;
    if (data.girData) r.girData = data.girData;
    if (data.puttsData) r.puttsData = data.puttsData;
    if (data.bunkerData) r.bunkerData = data.bunkerData;
    if (data.sandData) r.sandData = data.sandData;
    if (data.upDownData) r.upDownData = data.upDownData;
    if (data.missData) r.missData = data.missData;
    if (data.penaltyData) r.penaltyData = data.penaltyData;
    if (data.tee) r.tee = data.tee;
    if (data.yards) r.yards = data.yards;
    state.rounds.push(r);
    // No save() — rounds are Firestore-authoritative, never localStorage
    return r;
  }

  function deleteRound(id) {
    state.rounds = state.rounds.filter(function(r) { return r.id !== id; });
    // No save() — rounds are Firestore-authoritative
  }

  function setRoundsFromFirestore(fsRounds) {
    // Firestore is the sole source of truth for rounds.
    // No localStorage merging — rounds never live in localStorage.
    state.rounds = fsRounds && fsRounds.length ? fsRounds : [];
    // Do NOT call save() — rounds are not persisted to localStorage
  }

  /* ---------- TRIP OPS ---------- */
  function getTrips() { return state.trips; }
  function getTrip(id) { return state.trips.find(function(t) { return t.id === id; }); }

  function addTrip(data) {
    var id = data.name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15) + Date.now().toString(36).slice(-4);
    var t = {
      id: id, name: data.name, location: data.location || "", dates: data.dates || "",
      startDate: data.startDate || "", endDate: data.endDate || "",
      status: "upcoming", champion: null,
      members: data.members || [], photos: [],
      courses: data.courses || [],
      miniGames: data.miniGames || [],
      bonusAwards: data.bonusAwards || []
    };
    state.trips.push(t);
    state.scores[t.id] = {};
    if (!state.activity) state.activity = [];
    state.activity.push({type:"trip_created",name:t.name,dates:t.dates,ts:Date.now(),date:localDateStr()});
    save();
    return t;
  }

  // Add a trip from Firestore data (no activity push, no save — caller handles save)
  function addTripFromFirestore(data) {
    if (!data || !data.id) return;
    if (state.trips.some(function(t) { return t.id === data.id; })) return; // Already exists
    state.trips.push(data);
    if (!state.scores[data.id]) state.scores[data.id] = {};
  }

  function updateTrip(id, updates) {
    var t = getTrip(id);
    if (!t) return;
    Object.keys(updates).forEach(function(k) { t[k] = updates[k]; });
    save();
  }

  function addTripPhoto(tripId, photoData) {
    var t = getTrip(tripId);
    if (!t) return;
    t.photos.push({ data: photoData, date: localDateStr(), id: Date.now().toString(36) });
    save();
  }

  /* ---------- SCORECARD OPS ---------- */
  function getScores(tripId, courseKey, playerId) {
    if (!state.scores[tripId] || !state.scores[tripId][courseKey]) return [];
    // Direct match first
    if (state.scores[tripId][courseKey][playerId]) return state.scores[tripId][courseKey][playerId];
    // Check all known aliases for this player
    var aliases = getAllPlayerIds(playerId);
    for (var ai = 0; ai < aliases.length; ai++) {
      if (state.scores[tripId][courseKey][aliases[ai]]) return state.scores[tripId][courseKey][aliases[ai]];
    }
    return [];
  }

  function setScore(tripId, courseKey, playerId, hole, val) {
    if (!state.scores[tripId]) state.scores[tripId] = {};
    if (!state.scores[tripId][courseKey]) state.scores[tripId][courseKey] = {};
    if (playerId === "team") {
      if (!state.scores[tripId][courseKey].team) state.scores[tripId][courseKey].team = Array(18).fill("");
      state.scores[tripId][courseKey].team[hole] = val;
    } else {
      if (!state.scores[tripId][courseKey][playerId]) state.scores[tripId][courseKey][playerId] = Array(18).fill("");
      state.scores[tripId][courseKey][playerId][hole] = val;
    }
    save();
    // Sync to Firestore for live viewing
    syncTripScore(tripId, courseKey, playerId, getScores(tripId, courseKey, playerId));
  }

  // Silent version — sets score locally without triggering Firestore sync (used by listener to avoid loops)
  function setScoreSilent(tripId, courseKey, playerId, hole, val) {
    if (!state.scores[tripId]) state.scores[tripId] = {};
    if (!state.scores[tripId][courseKey]) state.scores[tripId][courseKey] = {};
    if (playerId === "team") {
      if (!state.scores[tripId][courseKey].team) state.scores[tripId][courseKey].team = Array(18).fill("");
      state.scores[tripId][courseKey].team[hole] = val;
    } else {
      if (!state.scores[tripId][courseKey][playerId]) state.scores[tripId][courseKey][playerId] = Array(18).fill("");
      state.scores[tripId][courseKey][playerId][hole] = val;
    }
    save();
  }

  function getMiniWinner(id) { return state.miniWinners[id] || ""; }
  function setMiniWinner(id, pid) {
    state.miniWinners[id] = pid;
    save();
    // Sync to Firestore — miniWinners live on the trip doc
    if (db) {
      var trips = state.trips;
      trips.forEach(function(tr) {
        if (tr.miniGames && tr.miniGames.some(function(g) { return g.i === id; })) {
          db.collection("trips").doc(tr.id).update({ miniWinners: state.miniWinners }).catch(function(){});
        }
      });
    }
  }
  function getBonusWinner(id) { return state.bonusWinners[id] || ""; }
  function setBonusWinner(id, pid) {
    state.bonusWinners[id] = pid;
    save();
    if (db) {
      var trips = state.trips;
      trips.forEach(function(tr) {
        if (tr.bonusAwards && tr.bonusAwards.some(function(b) { return b.i === id; })) {
          db.collection("trips").doc(tr.id).update({ bonusWinners: state.bonusWinners }).catch(function(){});
        }
      });
    }
  }

  /* ---------- FIR/GIR TRACKING ---------- */
  function getFirGir(tripId, courseKey, playerId) {
    if (!state.firGir) state.firGir = {};
    var key = tripId + ":" + courseKey + ":" + playerId;
    if (state.firGir[key]) return state.firGir[key];
    // Check aliases
    var aliases = getAllPlayerIds(playerId);
    for (var ai = 0; ai < aliases.length; ai++) {
      var aKey = tripId + ":" + courseKey + ":" + aliases[ai];
      if (state.firGir[aKey]) return state.firGir[aKey];
    }
    return { fir: Array(18).fill(false), gir: Array(18).fill(false) };
  }

  function setFir(tripId, courseKey, playerId, hole, val) {
    if (!state.firGir) state.firGir = {};
    var key = tripId + ":" + courseKey + ":" + playerId;
    if (!state.firGir[key]) state.firGir[key] = { fir: Array(18).fill(false), gir: Array(18).fill(false) };
    state.firGir[key].fir[hole] = val;
    save();
    syncFirGir(tripId, courseKey, playerId);
  }

  function setGir(tripId, courseKey, playerId, hole, val) {
    if (!state.firGir) state.firGir = {};
    var key = tripId + ":" + courseKey + ":" + playerId;
    if (!state.firGir[key]) state.firGir[key] = { fir: Array(18).fill(false), gir: Array(18).fill(false) };
    state.firGir[key].gir[hole] = val;
    save();
    syncFirGir(tripId, courseKey, playerId);
  }

  function getFirGirTotals(tripId, courseKey, playerId) {
    var data = getFirGir(tripId, courseKey, playerId);
    return {
      fir: data.fir.filter(function(v) { return v; }).length,
      gir: data.gir.filter(function(v) { return v; }).length
    };
  }

  /* ---------- SCRAMBLE TEAM OPS ---------- */
  function getScrambleTeams() { return state.scrambleTeams || []; }

  function addScrambleTeam(data) {
    if (!state.scrambleTeams) state.scrambleTeams = [];
    var team = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      name: data.name,
      members: data.members,
      captain: data.captain || data.members[0],
      size: data.size || data.members.length,
      matches: []
    };
    state.scrambleTeams.push(team);
    // No save() — scramble teams are Firestore-authoritative
    return team;
  }

  function addScrambleTeamFromFirestore(data) {
    // Merges a team from Firestore without triggering a write-back
    if (!state.scrambleTeams) state.scrambleTeams = [];
    var exists = state.scrambleTeams.find(function(t) { return t.id === data.id; });
    if (!exists) { state.scrambleTeams.push(data); } // No save() — Firestore-authoritative
  }

  function addScrambleMatch(teamId, match) {
    var team = state.scrambleTeams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    team.matches.push(match);
    // No save() — scramble teams are Firestore-authoritative
  }

  /* ---------- RECORDS ---------- */
  function getRecords() { return state.records; }
  function setRecord(key, val) {
    if (!state.records) state.records = {};
    state.records[key] = val;
    // Sync to Firestore immediately
    if (typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser) {
      var recData = {}; recData[key] = val;
      db.collection('records').doc('global').set(recData, { merge: true }).catch(function(){});
    }
  }

  /* ---------- CALCULATIONS ---------- */
  function calcStableford(score, par) {
    if (!score || score <= 0) return 0;
    var d = score - par;
    return d <= -2 ? 6 : d === -1 ? 4 : d === 0 ? 2 : d === 1 ? 1 : 0;
  }

  // Delegates to the canonical WHS implementation in handicap.js
  function calcHandicap(rounds) {
    return calculateHandicapIndex(rounds);
  }

  // getHandicapDetails is now provided by the global function in handicap.js

  function getPlayerAvg(pid) {
    var r = getPlayerRounds(pid).filter(function(rd){return rd.visibility !== "private" && rd.format !== "scramble" && rd.format !== "scramble4" && (!rd.holesPlayed || rd.holesPlayed >= 18);});
    if (r.length) return Math.round(r.reduce(function(a, x) { return a + x.score; }, 0) / r.length);
    // Fallback to Firestore-persisted value when rounds not yet loaded
    var p = getPlayer(pid);
    var cached = (typeof fbMemberCache !== "undefined") && (fbMemberCache[pid] || (p && p.claimedFrom && fbMemberCache[p.claimedFrom]));
    return (cached && cached.avgScore) ? cached.avgScore : null;
  }

  function getDisplayName(p) {
    if (!p) return "Unknown";
    var pref = p.displayPref || "name";
    if (pref === "username" && p.username) return p.username;
    if (pref === "nick" && p.nick) return p.nick;
    return p.name || p.username || "Unknown";
  }

  function getPlayerBest(pid) {
    var r = getPlayerRounds(pid).filter(function(rd){return rd.visibility !== "private" && rd.format !== "scramble" && rd.format !== "scramble4" && (!rd.holesPlayed || rd.holesPlayed >= 18);});
    if (r.length) {
      var bestRound = r.reduce(function(best, x) { return x.score < best.score ? x : best; }, r[0]);
      return { score: bestRound.score, roundId: bestRound.id };
    }
    // Fallback to Firestore-persisted value when rounds not yet loaded
    var p = getPlayer(pid);
    var cached = (typeof fbMemberCache !== "undefined") && (fbMemberCache[pid] || (p && p.claimedFrom && fbMemberCache[p.claimedFrom]));
    return (cached && cached.bestRound) ? { score: cached.bestRound, roundId: null } : null;
  }


  function getUniqueCourses(pid) {
    var r = getPlayerRounds(pid);
    var c = {};
    r.forEach(function(x) { c[x.course] = 1; });
    return Object.keys(c).length;
  }

  function getTripStableford(tripId, courseKey, playerId) {
    var trip = getTrip(tripId);
    if (!trip) return 0;
    var course = trip.courses.find(function(c) { return c.key === courseKey; });
    if (!course) return 0;
    var scores = getScores(tripId, courseKey, playerId);
    var total = 0;
    scores.forEach(function(v, i) {
      if (v && v > 0) total += calcStableford(parseInt(v), course.p[i]);
    });
    return Math.round(total * (course.m || 1) * 10) / 10;
  }

  function getTripTotal(tripId, courseKey, playerId, from, to) {
    var scores = getScores(tripId, courseKey, playerId);
    return scores.slice(from || 0, to || 18).reduce(function(a, v) { return a + (parseInt(v) || 0); }, 0);
  }

  function getMiniPoints(tripId, pid) {
    var trip = getTrip(tripId);
    if (!trip || !trip.miniGames) return 0;
    var myIds = getAllPlayerIds(pid);
    return trip.miniGames.reduce(function(t, g) { return t + (myIds.indexOf(state.miniWinners[g.i]) !== -1 ? g.p : 0); }, 0);
  }

  function getBonusPoints(tripId, pid) {
    var trip = getTrip(tripId);
    if (!trip || !trip.bonusAwards) return 0;
    var myIds = getAllPlayerIds(pid);
    return trip.bonusAwards.reduce(function(t, b) { return t + (myIds.indexOf(state.bonusWinners[b.i]) !== -1 ? b.p : 0); }, 0);
  }

  function getTripPoints(tripId, pid) {
    var trip = getTrip(tripId);
    if (!trip) return 0;
    var pts = getMiniPoints(tripId, pid) + getBonusPoints(tripId, pid);
    trip.courses.forEach(function(c) {
      if (!c.s) pts += getTripStableford(tripId, c.key, pid);
    });
    return Math.round(pts * 10) / 10;
  }

  function daysUntil(dateStr) {
    if (!dateStr) return 999;
    var parts = dateStr.split("-");
    var target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  /* ---------- AI COMMENTARY ---------- */
  function generateRoundCommentary(round) {
    var score = round.score;
    var is9hole = round.holesPlayed && round.holesPlayed <= 9;
    var rating = is9hole ? (round.rating || 72) / 2 : (round.rating || 72);
    var slope = round.slope || 113;
    var effectiveScore = is9hole ? score * 2 : score;
    var effectiveRating = is9hole ? rating * 2 : rating;

    // Look up player handicap for relative commentary
    var playerHcap = null;
    if (round.player) {
      var hcapIds = getAllPlayerIds(round.player);
      var pRounds = state.rounds.filter(function(r){ return hcapIds.indexOf(r.player) !== -1 && r.format !== "scramble" && r.format !== "scramble4"; });
      playerHcap = calcHandicap(pRounds);
      if (!playerHcap) {
        var pl = getPlayer(round.player);
        if (pl) playerHcap = pl.handicap || pl.handicapIndex || null;
      }
    }

    // Calculate diff relative to expected score (handicap-adjusted), not raw course rating
    var diff;
    if (playerHcap !== null && playerHcap > 0) {
      // Course handicap — full 18-hole value since we're comparing doubled 9-hole score against doubled rating
      var courseHcap = Math.round(playerHcap * (slope / 113));
      var expectedScore = effectiveRating + courseHcap;
      diff = effectiveScore - expectedScore;
    } else {
      // No handicap data — fall back to raw course rating diff
      diff = effectiveScore - effectiveRating;
    }

    var highlights = [];
    var roasts = [];
    var seed = (score * 7 + (round.slope || 113)) % 100; // pseudo-random from score for variety

    // Score-based tiers — using diff vs expected (handicap-adjusted) score
    if (diff <= -8) {
      var elite = ["Absolute clinic. Save some birdies for the rest of us.","Playing like you have a sponsorship deal nobody told us about.","The course owes you an apology for being too easy.","Someone call the PGA, we found their missing player."];
      highlights.push(elite[seed % elite.length]);
    } else if (diff <= -3) {
      var great = ["Well under your number today. The Parbaughs bow before you.","This is the round you'll bring up in every conversation for 6 months.","Tell your playing partners to bring sunglasses, your game is blinding.","You peaked today. It's all downhill from here. Enjoy it."];
      highlights.push(great[seed % great.length]);
    } else if (diff <= 3) {
      var solid = ["Solid round — right around your number.","Respectable. Playing to your handicap is harder than people think.","Kept it together out there. Consistency is king.","Played your game. No more, no less. That's discipline."];
      highlights.push(solid[seed % solid.length]);
    } else if (diff <= 8) {
      var mid = ["The course won today, but you put up a fight.","A few bad holes away from a solid round. Shake it off.","Your short game carried your long game's dead weight today.","Not your best, not your worst. We call that a Tuesday."];
      roasts.push(mid[seed % mid.length]);
    } else if (diff <= 15) {
      var rough = ["The course fought back and won. At least you got exercise.","Your scorecard looks like a phone number.","Some holes were good. The rest were character building.","Golf is hard. You proved that today.","The ball spent more time in the rough than on the fairway."];
      roasts.push(rough[seed % rough.length]);
    } else if (diff <= 25) {
      var bad = ["Were you playing golf or hiking? You saw every part of that course.","The course ranger asked if you needed a search party.","Your caddie would've quit if you had one.","Legend says you're still looking for your ball on the 7th.","The golf cart got more of a workout than your clubs."];
      roasts.push(bad[seed % bad.length]);
    } else {
      var brutal = ["We're not sure that counts as golf. More of an outdoor adventure experience.","Your ball spent more time in the woods than a Boy Scout.","That wasn't a round of golf, that was a nature walk with anger issues.","The course is pressing charges.","Someone check if the course is okay after what you just did to it."];
      roasts.push(brutal[seed % brutal.length]);
    }

    // Special score Easter eggs
    if (score === 69) highlights.push("Nice.");
    if (score === 42) highlights.push("The answer to life, the universe, and your golf game.");
    if (score === 77) highlights.push("Lucky 77. The golf gods smiled today.");
    if (score === 100) roasts.push("A perfect hundo. At least you're consistent.");
    if (score === 99) highlights.push("So close to triple digits. The golf gods showed mercy.");
    if (score === 111) roasts.push("Triple ones. A score so bad it's almost a PIN number.");
    if (score === 88) highlights.push("Double eights. Infinity on its side. Poetic.");
    if (effectiveScore < 80) highlights.push("Sub-80 club. Welcome to the elite.");
    if (score > 120) roasts.push("At this point just tell people you played 27 holes.");
    if (score > 130) roasts.push("Did you count every practice swing too?");

    // Course-specific humor
    if (round.course && round.course.indexOf("Sequoyah") !== -1) {
      if (diff > 10) roasts.push("Sequoyah claims another victim. That 142 slope is undefeated.");
      else highlights.push("You survived Sequoyah. That alone deserves a trophy.");
    }

    // Improvement tracking — compare like-for-like (9-hole vs 9-hole, 18-hole vs 18-hole)
    var myIds = round.player ? getAllPlayerIds(round.player) : [round.player];
    var playerRounds;
    if (is9hole) {
      playerRounds = state.rounds.filter(function(r) { return myIds.indexOf(r.player) !== -1 && r.format !== "scramble" && r.format !== "scramble4" && r.holesPlayed && r.holesPlayed <= 9; });
    } else {
      playerRounds = state.rounds.filter(function(r) { return myIds.indexOf(r.player) !== -1 && r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18); });
    }
    if (playerRounds.length >= 3) {
      var lastThree = playerRounds.slice(-3);
      var avgLast3 = Math.round(lastThree.reduce(function(a, r) { return a + r.score; }, 0) / 3);
      var holeLabel = is9hole ? " for 9 holes" : "";
      if (score < avgLast3 - 3) highlights.push("That's " + (avgLast3 - score) + " strokes better than your recent average" + holeLabel + ". Trending up.");
      if (score > avgLast3 + (is9hole ? 5 : 10)) roasts.push("That's " + (score - avgLast3) + " strokes worse than your recent average" + holeLabel + ". What happened out there?");
    }

    // Personal best detection — same like-for-like comparison
    if (playerRounds.length > 1) {
      var prevBest = Math.min.apply(null, playerRounds.slice(0, -1).map(function(r) { return r.score; }));
      if (score < prevBest) highlights.push("NEW PERSONAL BEST" + (is9hole ? " (9 holes)" : "") + ". Previous was " + prevBest + ". The grind is paying off.");
    }

    return { highlights: highlights, roasts: roasts };
  }

  /* ---------- ACTIVITY FEED ---------- */
  function getActivity(limit) {
    var items = [];
    // Build from rounds already loaded from Firestore
    state.rounds.forEach(function(r) {
      items.push({type:"round", playerName:r.playerName||r.player, course:r.course, score:r.score, date:r.date, ts:r.timestamp||0, roundId:r.id, player:r.player});
    });
    // Merge in-memory activity items (member joins, reviews, posts) that aren't rounds
    if (state.activity) {
      state.activity.forEach(function(a) {
        if (a.type !== "round") items.push(a);
      });
    }
    // Range sessions from live listener
    if (typeof liveRangeSessions !== "undefined") {
      liveRangeSessions.forEach(function(s) {
        if (s.visibility === "private") return;
        items.push({type:"range", playerName:s.playerName||s.playerId, durationMin:s.durationMin||0, sessionXP:s.sessionXP||0, date:s.date, ts:s.startedAt ? new Date(s.startedAt).getTime() : 0});
      });
    }
    return items.sort(function(a,b){return(b.ts||0)-(a.ts||0)}).slice(0, limit || 20);
  }

  /* ---------- ACHIEVEMENTS & XP SYSTEM ---------- */

  // Titles unlock every 5 levels up to 100
  var LEVEL_TITLES = {
    1:"Rookie",5:"Weekend Warrior",10:"Range Rat",15:"Fairway Finder",20:"Club Member",
    25:"Course Regular",30:"Low Handicapper",35:"Scratch Aspirant",40:"Ironman",
    45:"Birdie Hunter",50:"Eagle Eye",55:"Tour Wannabe",60:"Golf Addict",
    65:"Links Legend",70:"Course Conqueror",75:"The Professor",80:"Hall of Famer",
    85:"Living Legend",90:"Immortal",95:"Transcendent",100:"G.O.A.T."
  };

  function xpForLevel(level) {
    // Progressive curve: Level 100 ~100K XP, reachable in ~1 year of active play
    // No level cap — players can keep going past 100
    if (level <= 1) return 0;
    return Math.floor(200 * Math.pow(level - 1, 1.65));
  }

  function getPlayerLevel(pid) {
    if (!pid) return {level:1,name:"Rookie",xp:0,currentLevelXp:0,nextLevelXp:500,titleLevel:1};
    var xp = getPlayerXP(pid);
    var level = 1;
    while (xpForLevel(level + 1) <= xp) level++;
    var currentLevelXp = xpForLevel(level);
    var nextLevelXp = xpForLevel(level + 1);
    // Find the most recent title unlock
    var titleLevel = 1;
    var keys = Object.keys(LEVEL_TITLES).map(Number).sort(function(a,b){return a-b});
    for (var i = keys.length - 1; i >= 0; i--) {
      if (level >= keys[i]) { titleLevel = keys[i]; break; }
    }
    return {
      level: level,
      name: LEVEL_TITLES[titleLevel] || "Rookie",
      xp: xp,
      currentLevelXp: currentLevelXp,
      nextLevelXp: nextLevelXp,
      titleLevel: titleLevel
    };
  }

  function getPlayerXP(pid) {
    if (!pid) return 0;
    var rounds = getPlayerRounds(pid);
    var player = getPlayer(pid);
    // Resolve from Firebase cache, currentProfile, or claimedFrom
    if (!player && typeof fbMemberCache !== "undefined" && fbMemberCache[pid]) player = fbMemberCache[pid];
    if (!player && currentProfile && currentProfile.id === pid) player = currentProfile;
    if (!player) {
      var all = getPlayers();
      for (var xi = 0; xi < all.length; xi++) {
        if (all[xi].claimedFrom === pid || all[xi].id === pid) { player = all[xi]; break; }
      }
    }
    if (!player) return 0;
    // Also check rounds under claimedFrom
    if (!rounds.length && player.claimedFrom) {
      rounds = getPlayerRounds(player.claimedFrom);
    }
    var xp = 0;

    // Rounds XP
    rounds.forEach(function(r) {
      xp += r.holeScores ? 150 : 100; // Play Now bonus
      if (r.scorecardPhoto) xp += 25;
    });

    // New course bonus
    var seenCourses = {};
    rounds.forEach(function(r) {
      if (!seenCourses[r.course]) { xp += 75; seenCourses[r.course] = 1; }
    });

    // New state bonus
    var seenStates = {};
    rounds.forEach(function(r) {
      var c = getCourseByName(r.course);
      if (c && c.region && !seenStates[c.region]) { xp += 150; seenStates[c.region] = 1; }
    });

    // Personal best bonus (individual rounds only — scramble team scores don't count)
    var indivForPB = rounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
    if (indivForPB.length >= 2) {
      var sorted = indivForPB.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date)});
      var bestSoFar = sorted[0].score;
      for (var i = 1; i < sorted.length; i++) {
        if (sorted[i].score < bestSoFar) { xp += 200; bestSoFar = sorted[i].score; }
      }
    }

    // H2H wins (individual rounds only)
    var players = getPlayers();
    players.forEach(function(opp) {
      if (opp.id === pid) return;
      var oppRounds = getPlayerRounds(opp.id);
      rounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";}).forEach(function(r) {
        var match = oppRounds.find(function(o){return o.course===r.course&&o.date===r.date&&o.format!=="scramble"&&o.format!=="scramble4"});
        if (match && r.score < match.score) xp += 50;
      });
    });

    // Event wins
    if (player) xp += (player.wins || 0) * 500;

    // Aces
    var rec = getRecords();
    if (rec.holeInOnes && player) {
      rec.holeInOnes.forEach(function(a) { if (a.by === player.name) xp += 1000; });
    }

    // Reviews
    var courses = getCourses();
    courses.forEach(function(c) {
      if (c.reviews) c.reviews.forEach(function(r) { if (r.by === (player?player.name:"")) xp += 25; });
    });

    // Achievement XP — calculated from the same conditions, not from getAchievements (avoids circular call)
    // Round milestones
    if (rounds.length >= 1) xp += 100;
    if (rounds.length >= 5) xp += 50;
    if (rounds.length >= 10) xp += 100;
    if (rounds.length >= 25) xp += 250;
    if (rounds.length >= 50) xp += 500;
    if (rounds.length >= 100) xp += 1000;
    if (rounds.length >= 200) xp += 2000;
    if (rounds.length >= 500) xp += 5000;
    // Score achievements — only full 18-hole individual rounds count (no scramble)
    var full18 = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
    if (full18.some(function(r){return r.score<=120})) xp += 50;
    if (full18.some(function(r){return r.score<100})) xp += 100;
    if (full18.some(function(r){return r.score<90})) xp += 200;
    if (full18.some(function(r){return r.score<85})) xp += 300;
    if (full18.some(function(r){return r.score<80})) xp += 500;
    if (full18.some(function(r){return r.score<75})) xp += 750;
    if (full18.some(function(r){return r.score<70})) xp += 1000;
    // Explore achievements
    var achCourseCount = Object.keys(seenCourses).length;
    if (achCourseCount >= 3) xp += 50;
    if (achCourseCount >= 5) xp += 100;
    if (achCourseCount >= 10) xp += 200;
    if (achCourseCount >= 25) xp += 500;
    if (achCourseCount >= 50) xp += 1000;
    var achStateCount = Object.keys(seenStates).length;
    if (achStateCount >= 2) xp += 75;
    if (achStateCount >= 3) xp += 150;
    if (achStateCount >= 5) xp += 300;
    if (achStateCount >= 8) xp += 500;
    // Play Now rounds
    var playNowRounds = rounds.filter(function(r){return r.holeScores});
    if (playNowRounds.length >= 1) xp += 50;
    if (playNowRounds.length >= 10) xp += 150;
    // Attested rounds
    var attestedRounds = rounds.filter(function(r){return r.attestedBy});
    if (attestedRounds.length >= 1) xp += 50;
    if (attestedRounds.length >= 10) xp += 150;
    // Home course
    var coursePlays = {};
    rounds.forEach(function(r){coursePlays[r.course]=(coursePlays[r.course]||0)+1});
    var maxPlays = Math.max.apply(null, Object.values(coursePlays).concat([0]));
    if (maxPlays >= 5) xp += 75;
    if (maxPlays >= 10) xp += 150;
    if (maxPlays >= 25) xp += 300;
    // Streaks
    if (rounds.length >= 3) {
      var weekSet = {};
      rounds.forEach(function(r){if(r.date){var d=new Date(r.date+"T12:00:00");var wk=d.getFullYear()+"-"+Math.floor((d.getTime()-new Date(d.getFullYear(),0,1).getTime())/604800000);weekSet[wk]=1;}});
      var weeks = Object.keys(weekSet).sort();
      var maxStreak = 1, curStreak = 1;
      for (var si = 1; si < weeks.length; si++) {
        var prev = weeks[si-1].split("-"), curr = weeks[si].split("-");
        if (parseInt(curr[0]) === parseInt(prev[0]) && parseInt(curr[1]) === parseInt(prev[1]) + 1) { curStreak++; if (curStreak > maxStreak) maxStreak = curStreak; }
        else curStreak = 1;
      }
      if (maxStreak >= 3) xp += 100;
      if (maxStreak >= 6) xp += 200;
    }
    // Back to back days
    if (rounds.length >= 2) {
      var sortedDates = rounds.map(function(r){return r.date}).filter(Boolean).sort();
      for (var di = 1; di < sortedDates.length; di++) {
        var d1 = new Date(sortedDates[di-1]+"T12:00:00"), d2 = new Date(sortedDates[di]+"T12:00:00");
        if ((d2-d1) <= 86400000) { xp += 75; break; }
      }
    }
    // Social
    var chatCount = 0;
    try { if (typeof liveChat !== "undefined") chatCount = liveChat.filter(function(m){return m.authorId===pid}).length; } catch(e){}
    if (chatCount >= 1) xp += 25;
    if (chatCount >= 25) xp += 75;
    if (chatCount >= 100) xp += 200;
    // Invites — also check fbMemberCache for recruited member count
    var inviteCount = player ? (player.invitesUsed || 0) : 0;
    if (player && isFounderRole(player) && typeof fbMemberCache !== "undefined") {
      var recruited = Object.values(fbMemberCache).filter(function(m) { return m.invitedBy === pid; });
      if (recruited.length > inviteCount) inviteCount = recruited.length;
    }
    if (inviteCount >= 1) xp += 100;
    if (inviteCount >= 3) xp += 250;
    // Special achievement XP
    if (player && (player.founding || player.isFoundingFour)) xp += 500;
    if (player) xp += 250; // Beta tester — all current members qualify
    if (player && isFounderRole(player)) xp += 500;
    if (player && player.email === "jopinksalot@msn.com") xp += 250;

    // Profile completion XP
    if (player) {
      var _pf = 0;
      if (player.bio && player.bio.trim()) _pf++;
      if (player.range && player.range.trim()) _pf++;
      if (player.homeCourse && player.homeCourse.trim()) _pf++;
      if (player.favoriteCourse && player.favoriteCourse.trim()) _pf++;
      var _cc = 0; if (player.clubs) Object.keys(player.clubs).forEach(function(k){if(player.clubs[k])_cc++});
      if (_cc >= 1) _pf++;
      if (_pf >= 1) xp += 25;   // Getting Settled
      if (_pf >= 4) xp += 100;  // Profile Complete
      // Fully Loaded check (need photo too)
      var _hp = false;
      if (typeof photoCache !== "undefined") { var _xpc = photoCache["member:"+pid]; if (_xpc && _xpc.indexOf("stock_profile")===-1) _hp = true; }
      if (!_hp && player.photoUrl && player.photoUrl.indexOf("stock_profile")===-1) _hp = true;
      if (_pf >= 4 && _hp && _cc >= 5) xp += 200; // Fully Loaded
    }

    // Range session XP — only public sessions earn XP
    var rangeSessions = typeof liveRangeSessions !== "undefined" ? liveRangeSessions.filter(function(s){return s.playerId===pid && s.visibility !== "private"}) : [];
    rangeSessions.forEach(function(s) { xp += getRangeSessionXP(s); });
    // Range achievement XP
    if (rangeSessions.length >= 1) xp += 50;  // First Swing
    if (rangeSessions.length >= 10) xp += 100; // Range Rat
    if (rangeSessions.length >= 25) xp += 200; // Creature of Habit
    if (rangeSessions.length >= 50) xp += 400; // Iron Sharpener
    if (rangeSessions.length >= 100) xp += 750; // Range Resident
    var rangeStreak = typeof calcRangeStreak !== "undefined" ? calcRangeStreak(rangeSessions) : 0;
    if (rangeStreak >= 2) xp += 50;   // Two-Peat
    if (rangeStreak >= 4) xp += 100;  // Hot Streak
    if (rangeStreak >= 8) xp += 250;  // Dialed In
    if (rangeStreak >= 12) xp += 500; // Relentless
    var rangeTotalMins = rangeSessions.reduce(function(a,s){return a+(s.durationMin||0)},0);
    if (rangeTotalMins >= 300) xp += 75;   // Bucket Buster (5hrs)
    if (rangeTotalMins >= 1500) xp += 200; // Sweat Equity (25hrs)
    if (rangeTotalMins >= 6000) xp += 750; // 10,000 Hours (100hrs)
    if (rangeSessions.some(function(s){return (s.durationMin||0)>=60})) xp += 100; // Locked In
    if (rangeSessions.some(function(s){return (s.durationMin||0)>=90})) xp += 200; // Marathon Man
    // Special range achievements
    if (rangeSessions.some(function(s){return s.drills&&s.drills.length>=3})) xp += 50; // Lab Work
    var rangeDrillCounts = {};
    rangeSessions.forEach(function(s){if(s.drills)s.drills.forEach(function(d){rangeDrillCounts[d]=(rangeDrillCounts[d]||0)+1})});
    if (Object.values(rangeDrillCounts).some(function(c){return c>=10})) xp += 75; // Specialist
    // Double Duty: range + round same day
    var rangeDates = {};
    rangeSessions.forEach(function(s){if(s.date)rangeDates[s.date]=1});
    if (rounds.some(function(r){return r.date && rangeDates[r.date]})) xp += 100; // Double Duty

    return xp;
  }

  // Simplified XP calculation from a provided rounds array + player object.
  // Used by persistPlayerStats which fetches ALL rounds globally from Firestore.
  // Does NOT read from state.rounds — takes rounds as direct input.
  function calcXPFromRounds(rounds, pid) {
    var player = getPlayer(pid);
    if (!player && typeof fbMemberCache !== "undefined" && fbMemberCache[pid]) player = fbMemberCache[pid];
    if (!player && currentProfile && currentProfile.id === pid) player = currentProfile;
    if (!player) return 0;
    var xp = 0;
    // Rounds XP
    rounds.forEach(function(r) { xp += r.holeScores ? 150 : 100; if (r.scorecardPhoto) xp += 25; });
    // New course bonus
    var seenCourses = {};
    rounds.forEach(function(r) { if (!seenCourses[r.course]) { xp += 75; seenCourses[r.course] = 1; } });
    // New state bonus
    var seenStates = {};
    rounds.forEach(function(r) { var c = getCourseByName(r.course); if (c && c.region && !seenStates[c.region]) { xp += 150; seenStates[c.region] = 1; } });
    // Personal best bonus
    var indiv = rounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
    if (indiv.length >= 2) { var sorted = indiv.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date)}); var bestSoFar = sorted[0].score; for (var i = 1; i < sorted.length; i++) { if (sorted[i].score < bestSoFar) { xp += 200; bestSoFar = sorted[i].score; } } }
    // Event wins + special
    xp += (player.wins || 0) * 500;
    if (player.founding || player.isFoundingFour) xp += 500;
    xp += 250; // Beta tester
    if (isFounderRole(player)) xp += 500;
    // Round milestones
    if (rounds.length >= 1) xp += 100; if (rounds.length >= 5) xp += 50; if (rounds.length >= 10) xp += 100; if (rounds.length >= 25) xp += 250; if (rounds.length >= 50) xp += 500;
    // Score achievements
    var full18 = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
    if (full18.some(function(r){return r.score<=120})) xp += 50;
    if (full18.some(function(r){return r.score<100})) xp += 100;
    if (full18.some(function(r){return r.score<90})) xp += 200;
    if (full18.some(function(r){return r.score<80})) xp += 500;
    // Explore achievements
    var achCourseCount = Object.keys(seenCourses).length;
    if (achCourseCount >= 3) xp += 50; if (achCourseCount >= 5) xp += 100; if (achCourseCount >= 10) xp += 200;
    // Profile XP
    var _pf = 0;
    if (player.bio && player.bio.trim()) _pf++;
    if (player.range && player.range.trim()) _pf++;
    if (player.homeCourse && player.homeCourse.trim()) _pf++;
    if (player.favoriteCourse && player.favoriteCourse.trim()) _pf++;
    if (_pf >= 1) xp += 25; if (_pf >= 4) xp += 100;
    // Invites
    var invCount = player.invitesUsed || 0;
    if (invCount >= 1) xp += 100; if (invCount >= 3) xp += 250;
    return xp;
  }

  // Calculate level from a given XP value
  // Single source of truth for "what XP value should a display element show"?
  // Used by home.js, firebase.js (top-left profile bar), members.js (profile
  // page + member list + Edit Profile + shareProfileCard), trophyroom.js,
  // chat.js, and router.js (Online Now).
  // Precedence:
  //   1. currentProfile.xp       — viewing own identity, persisted global value
  //                                maintained by persistPlayerStats
  //   2. fbMemberCache[pid].xp   — viewing another member, their persisted global
  //   3. getPlayerLevel(pid).xp  — live fallback (league-scoped; used before
  //                                persisted has been written on a new account)
  // The helper exists to keep all 9 display sites in lock-step — v7.8.4 shipped
  // with only 3 of 9 migrated, which is the failure mode this centralization
  // prevents from recurring.
  function getPlayerXPForDisplay(pid) {
    if (!pid) return 0;
    var isSelf = typeof currentUser !== "undefined" && currentUser
      && (pid === currentUser.uid
          || (typeof currentProfile !== "undefined" && currentProfile && pid === currentProfile.claimedFrom));
    if (isSelf && typeof currentProfile !== "undefined" && currentProfile && currentProfile.xp > 0) {
      return currentProfile.xp;
    }
    if (!isSelf && typeof fbMemberCache !== "undefined"
        && fbMemberCache[pid] && fbMemberCache[pid].xp > 0) {
      return fbMemberCache[pid].xp;
    }
    var live = getPlayerLevel(pid);
    return live ? live.xp : 0;
  }

  function calcLevelFromXP(xp) {
    var level = 1;
    while (xpForLevel(level + 1) <= xp) level++;
    var currentLevelXp = xpForLevel(level);
    var nextLevelXp = xpForLevel(level + 1);
    var titleLevel = 1;
    var keys = Object.keys(LEVEL_TITLES).map(Number).sort(function(a,b){return a-b});
    for (var i = keys.length - 1; i >= 0; i--) { if (level >= keys[i]) { titleLevel = keys[i]; break; } }
    return { level: level, name: LEVEL_TITLES[titleLevel] || "Rookie", xp: xp, currentLevelXp: currentLevelXp, nextLevelXp: nextLevelXp, titleLevel: titleLevel };
  }

  function getAchievements(pid) {
    var rounds = getPlayerRounds(pid);
    var player = getPlayer(pid);
    // Resolve from Firebase cache, currentProfile, or claimedFrom
    if (!player && typeof fbMemberCache !== "undefined" && fbMemberCache[pid]) player = fbMemberCache[pid];
    if (!player && currentProfile && currentProfile.id === pid) player = currentProfile;
    if (!player) {
      var all = getPlayers();
      for (var pi = 0; pi < all.length; pi++) {
        if (all[pi].claimedFrom === pid || all[pi].id === pid) { player = all[pi]; break; }
      }
    }
    // Also check rounds under claimedFrom if none found under Firebase UID
    if (!rounds.length && player && player.claimedFrom) {
      rounds = getPlayerRounds(player.claimedFrom);
    }
    var xp = getPlayerXP(pid);
    var lvl = getPlayerLevel(pid);
    var achievements = [];

    // --- ROUND MILESTONES ---
    if (rounds.length >= 1) achievements.push({id:"first_blood",name:"First Blood",desc:"Log your first round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"});
    if (rounds.length >= 5) achievements.push({id:"getting_started",name:"Getting Started",desc:"Log 5 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"});
    if (rounds.length >= 10) achievements.push({id:"regular",name:"Regular",desc:"Log 10 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"});
    if (rounds.length >= 25) achievements.push({id:"grinder",name:"Grinder",desc:"Log 25 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:250,cat:"milestone"});
    if (rounds.length >= 50) achievements.push({id:"veteran",name:"Veteran",desc:"Log 50 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone"});
    if (rounds.length >= 100) achievements.push({id:"centurion",name:"Centurion",desc:"Log 100 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"milestone"});

    // --- SCORE ACHIEVEMENTS --- (only full 18-hole rounds count)
    var full18rounds = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
    if (full18rounds.some(function(r){return r.score<=120})) achievements.push({id:"sub120",name:"Breaking In",desc:"Break 120 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"score"});
    if (full18rounds.some(function(r){return r.score<100})) achievements.push({id:"sub100",name:"Double Digits",desc:"Break 100 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v4M6 7h4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"score"});
    if (full18rounds.some(function(r){return r.score<90})) achievements.push({id:"sub90",name:"Sub-90 Club",desc:"Shoot under 90 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:200,cat:"score"});
    if (full18rounds.some(function(r){return r.score<85})) achievements.push({id:"sub85",name:"Mid-80s",desc:"Shoot under 85 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:300,cat:"score"});
    if (full18rounds.some(function(r){return r.score<80})) achievements.push({id:"sub80",name:"Sharpshooter",desc:"Shoot under 80 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"score"});
    if (full18rounds.some(function(r){return r.score<75})) achievements.push({id:"sub75",name:"Near Scratch",desc:"Shoot under 75 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:750,cat:"score"});
    if (full18rounds.some(function(r){return r.score<70})) achievements.push({id:"sub70",name:"Tour Ready",desc:"Shoot under 70 (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:1000,cat:"score"});
    if (full18rounds.some(function(r){return r.score===Number(r.rating)})) achievements.push({id:"course_rating",name:"Par for the Course",desc:"Shoot exactly the course rating (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:200,cat:"score"});

    // --- COURSE EXPLORATION ---
    var uniqueCourses = {}; rounds.forEach(function(r){uniqueCourses[r.course]=1});
    var courseCount = Object.keys(uniqueCourses).length;
    if (courseCount >= 3) achievements.push({id:"sampler",name:"Course Sampler",desc:"Play 3 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"explore"});
    if (courseCount >= 5) achievements.push({id:"explorer",name:"Explorer",desc:"Play 5 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"explore"});
    if (courseCount >= 10) achievements.push({id:"collector",name:"Course Collector",desc:"Play 10 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"explore"});
    if (courseCount >= 25) achievements.push({id:"nomad",name:"Nomad",desc:"Play 25 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"explore"});

    var states = {}; rounds.forEach(function(r){var c=getCourseByName(r.course);if(c&&c.region)states[c.region]=1});
    var stateCount = Object.keys(states).length;
    if (stateCount >= 2) achievements.push({id:"traveler2",name:"State Hopper",desc:"Play courses in 2 states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"explore"});
    if (stateCount >= 3) achievements.push({id:"traveler",name:"Globe Trotter",desc:"Play in 3+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"explore"});
    if (stateCount >= 5) achievements.push({id:"roadwarrior",name:"Road Warrior",desc:"Play in 5+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"explore"});

    // --- COMPETITIVE ---
    var totalH2Hwins = 0;
    var players = getPlayers();
    players.forEach(function(opp){
      if(opp.id===pid)return;
      var oppR=getPlayerRounds(opp.id);
      rounds.forEach(function(r){var m=oppR.find(function(o){return o.course===r.course&&o.date===r.date});if(m&&r.score<m.score)totalH2Hwins++});
    });
    if (totalH2Hwins >= 1) achievements.push({id:"first_win",name:"First Win",desc:"Win an H2H matchup",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"compete"});
    if (totalH2Hwins >= 5) achievements.push({id:"rival",name:"Rival",desc:"Win 5 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"});
    if (totalH2Hwins >= 10) achievements.push({id:"nemesis",name:"Nemesis",desc:"Win 10 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"compete"});
    if (totalH2Hwins >= 25) achievements.push({id:"dominator",name:"Dominator",desc:"Win 25 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"compete"});

    // Event champion — check wins field OR trip champion IDs
    var achEventWins = (player && player.wins >= 1) || getTrips().some(function(t){ return t.champion && (t.champion === pid || (player && player.claimedFrom && t.champion === player.claimedFrom)); });
    if (achEventWins) achievements.push({id:"champion",name:"Champion",desc:"Win an event",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"compete"});
    if (player && player.wins >= 3) achievements.push({id:"dynasty",name:"Dynasty",desc:"Win 3 events",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"compete"});

    // --- IMPROVEMENT --- (exclude scramble — team scores would skew averages)
    var indivRounds = rounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
    if (indivRounds.length >= 5) {
      var first5=Math.round(indivRounds.slice(0,5).reduce(function(a,r){return a+r.score},0)/5);
      var last5=Math.round(indivRounds.slice(-5).reduce(function(a,r){return a+r.score},0)/5);
      if (last5<first5-3) achievements.push({id:"improving",name:"On The Rise",desc:"Average improved by 3+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"growth"});
      if (last5<first5-8) achievements.push({id:"transformed",name:"Transformed",desc:"Average improved by 8+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"growth"});
      if (last5<first5-15) achievements.push({id:"metamorphosis",name:"Metamorphosis",desc:"Average improved by 15+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"growth"});
    }
    if (indivRounds.length >= 3) {
      var avg=Math.round(indivRounds.reduce(function(a,r){return a+r.score},0)/indivRounds.length);
      if (indivRounds.some(function(r){return r.score<avg-10})) achievements.push({id:"sandbagger",name:"Sandbagger",desc:"Beat average by 10+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"growth"});
    }

    // --- SPECIAL ---
    var rec = getRecords();
    if (rec.holeInOnes&&rec.holeInOnes.some(function(a){return a.by===(player?player.name:"")})) achievements.push({id:"ace",name:"Ace",desc:"Make a hole-in-one",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:1000,cat:"special"});
    if (player && (player.founding || player.isFoundingFour)) achievements.push({id:"og",name:"The Original Four",desc:"Founding member",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"special"});
    // Beta tester — all current members are in the first 30
    var playerIdx = -1;
    var allPlayers = getPlayers();
    for (var bi = 0; bi < allPlayers.length; bi++) {
      if (allPlayers[bi].id === pid || (player && allPlayers[bi].id === player.claimedFrom) || allPlayers[bi].claimedFrom === pid) { playerIdx = bi; break; }
    }
    if (player && (playerIdx < 30 || allPlayers.length < 30)) achievements.push({id:"beta",name:"Beta Tester",desc:"Among the first 30 members",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"special"});

    // --- PROFILE COMPLETION ---
    if (player) {
      var profFields = 0;
      if (player.bio && player.bio.trim()) profFields++;
      if (player.range && player.range.trim()) profFields++;
      if (player.homeCourse && player.homeCourse.trim()) profFields++;
      if (player.favoriteCourse && player.favoriteCourse.trim()) profFields++;
      var clubCount = 0;
      if (player.clubs) { Object.keys(player.clubs).forEach(function(k){ if(player.clubs[k]) clubCount++; }); }
      if (clubCount >= 1) profFields++;
      var hasPhoto = false;
      if (typeof photoCache !== "undefined") {
        var pc = photoCache["member:" + pid];
        if (pc && pc.indexOf("stock_profile") === -1) hasPhoto = true;
      }
      if (!hasPhoto && player.photoUrl && player.photoUrl.indexOf("stock_profile") === -1) hasPhoto = true;
      if (profFields >= 1) achievements.push({id:"profile_started",name:"Getting Settled",desc:"Add your first profile detail",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"special"});
      if (profFields >= 4) achievements.push({id:"profile_complete",name:"Profile Complete",desc:"Fill in bio, range, home course & clubs",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 9l2 2 3-4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special",title:"The Complete Package"});
      if (profFields >= 4 && hasPhoto && clubCount >= 5) achievements.push({id:"fully_loaded",name:"Fully Loaded",desc:"Complete profile with photo & 5+ club distances",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='.8'/></svg>",xp:200,cat:"special",title:"Fully Loaded"});
    }

    // --- PLAY NOW SPECIFIC ---
    var playNowRounds = rounds.filter(function(r){return r.holeScores});
    if (playNowRounds.length >= 1) achievements.push({id:"live_scorer",name:"Live Scorer",desc:"Complete a Play Now round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"});
    if (playNowRounds.length >= 10) achievements.push({id:"dedicated",name:"Dedicated",desc:"10 Play Now rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"});

    // --- SCRAMBLE CAPTAIN ---
    var teams = getScrambleTeams();
    var isCaptain = teams.some(function(t){return t.captain === pid});
    if (isCaptain) achievements.push({id:"captain",name:"Captain",desc:"Named team captain",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"});

    // --- ATTESTATION ---
    var attestedRounds = rounds.filter(function(r){return r.attestedBy});
    if (attestedRounds.length >= 1) achievements.push({id:"attested",name:"Verified",desc:"Have a score attested",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"});
    if (attestedRounds.length >= 10) achievements.push({id:"honest_game",name:"Honest Game",desc:"10 attested rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"});

    // --- CONSISTENCY ---
    var coursePlays = {};
    rounds.forEach(function(r){coursePlays[r.course]=(coursePlays[r.course]||0)+1});
    var maxPlays = Math.max.apply(null, Object.values(coursePlays).concat([0]));
    if (maxPlays >= 5) achievements.push({id:"home_course",name:"Home Course Hero",desc:"Play same course 5 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"milestone"});
    if (maxPlays >= 10) achievements.push({id:"local_legend",name:"Local Legend",desc:"Play same course 10 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"});
    if (maxPlays >= 25) achievements.push({id:"resident",name:"Resident Pro",desc:"Play same course 25 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"milestone"});

    // --- LEVEL ACHIEVEMENTS ---
    if (lvl.level >= 5) achievements.push({id:"lvl5",name:"Level 5",desc:"Reach Weekend Warrior",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:0,cat:"level"});
    if (lvl.level >= 10) achievements.push({id:"lvl10",name:"Level 10",desc:"Reach Range Rat",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:0,cat:"level"});
    if (lvl.level >= 25) achievements.push({id:"lvl25",name:"Level 25",desc:"Reach Course Regular",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:0,cat:"level"});
    if (lvl.level >= 50) achievements.push({id:"lvl50",name:"Level 50",desc:"Reach Eagle Eye",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:0,cat:"level"});
    if (lvl.level >= 75) achievements.push({id:"lvl75",name:"Level 75",desc:"Reach The Professor",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:0,cat:"level"});
    if (lvl.level >= 100) achievements.push({id:"lvl100",name:"Level 100",desc:"Reach G.O.A.T.",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:0,cat:"level"});

    // --- BLUNDERS (fun shame achievements) ---
    if (full18rounds.some(function(r){return r.score>=120})) achievements.push({id:"blow120",name:"The Blow-Up",desc:"Shoot 120 or higher (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l1 4 4-1-3 3 3 3-4-1-1 4-1-4-4 1 3-3-3-3 4 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"blunder",title:"The Blow-Up Artist"});
    if (full18rounds.some(function(r){return r.score>=130})) achievements.push({id:"blow130",name:"Cart Path Warrior",desc:"Shoot 130 or higher (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='6' cy='14' r='1' fill='currentColor'/><circle cx='12' cy='14' r='1' fill='currentColor'/><path d='M1 1h2l2 9h8l2-6H5' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"blunder",title:"Cart Path Warrior"});
    if (full18rounds.some(function(r){return r.score>=140})) achievements.push({id:"blow140",name:"Lost in the Woods",desc:"Shoot 140 or higher (18 holes)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L4 7h2L3 12h10L10 7h2L8 1zM7 12h2v3H7z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"blunder",title:"Lost in the Woods"});
    if (indivRounds.length >= 2) {
      var scores = indivRounds.map(function(r){return r.score}).sort(function(a,b){return a-b});
      if (scores[scores.length-1] - scores[0] >= 20) achievements.push({id:"roller_coaster",name:"Roller Coaster",desc:"20+ stroke difference between best and worst round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 12c2-8 4-8 6 0s4 0 6-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"blunder",title:"The Roller Coaster"});
    }
    if (indivRounds.length >= 3) {
      var last3 = indivRounds.slice(-3);
      var allWorse = last3.every(function(r,i){return i===0 || r.score > last3[i-1].score});
      if (allWorse && last3.length === 3) achievements.push({id:"downhill",name:"Going Downhill",desc:"3 rounds in a row getting worse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 3l5 4 3-2 6 7' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M12 8l3 4h-4z' fill='currentColor'/></svg>",xp:25,cat:"blunder",title:"Mr. Downhill"});
    }
    if (indivRounds.filter(function(r){return r.score>=110}).length >= 5) achievements.push({id:"thick_skin",name:"Thick Skin",desc:"Log 5 rounds of 110+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 2 3-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"blunder",title:"Thick Skinned"});
    if (indivRounds.length >= 10 && !indivRounds.some(function(r){return r.score<100})) achievements.push({id:"triple_club",name:"Triple Digit Club",desc:"10 rounds without breaking 100",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><text x='8' y='12' text-anchor='middle' font-size='10' font-weight='700' fill='currentColor'>100</text></svg>",xp:50,cat:"blunder",title:"Triple Digit King"});

    // --- DEDICATION & SOCIAL ---
    // Hot Streak: play at least once per week across 3+ distinct calendar weeks
    if (indivRounds.length >= 3) {
      var weekSet = {};
      indivRounds.forEach(function(r) {
        if (!r.date) return;
        var d = new Date(r.date + "T12:00:00");
        var jan1 = new Date(d.getFullYear(), 0, 1);
        var weekNum = d.getFullYear() + "-W" + Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        weekSet[weekNum] = true;
      });
      var weeks = Object.keys(weekSet).sort();
      var streak = 1, maxStreak = 1;
      for (var si = 1; si < weeks.length; si++) {
        // Parse week numbers and check consecutive
        var parts1 = weeks[si-1].split("-W"), parts2 = weeks[si].split("-W");
        var y1 = parseInt(parts1[0]), w1 = parseInt(parts1[1]);
        var y2 = parseInt(parts2[0]), w2 = parseInt(parts2[1]);
        var consecutive = (y1 === y2 && w2 === w1 + 1) || (y2 === y1 + 1 && w1 >= 51 && w2 <= 2);
        if (consecutive) { streak++; maxStreak = Math.max(maxStreak, streak); } else { streak = 1; }
      }
      if (maxStreak >= 3) achievements.push({id:"weekly_streak",name:"Hot Streak",desc:"Play 3 weeks in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1C6 4 4 5 4 8a4 4 0 008 0c0-2-1-3-2-4-.5 1-1 2-2 1 0-2 0-3 0-4z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"milestone",title:"On Fire"});
      if (maxStreak >= 6) achievements.push({id:"iron_man_streak",name:"Iron Man",desc:"Play 6 weeks in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M9 1L4 9h4l-1 6 6-8H9l1-6z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"milestone",title:"The Iron Man"});
    }

    // --- PARBAUGH ROUND ACHIEVEMENTS ---
    var parbaughRounds = rounds.filter(function(r){return r.syncedRound});
    if (parbaughRounds.length >= 1) achievements.push({id:"first_parbaugh",name:"First Parbaugh Round",desc:"Complete a Parbaugh Round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"milestone"});
    if (parbaughRounds.length >= 5) achievements.push({id:"parbaugh_regular",name:"Parbaugh Regular",desc:"5 Parbaugh Rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"milestone",title:"Team Player"});
    if (parbaughRounds.length >= 25) achievements.push({id:"parbaugh_veteran",name:"Parbaugh Veteran",desc:"25 Parbaugh Rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone",title:"The Glue Guy"});

    // --- UNIQUE SPECIAL BADGES ---
    if (player && player.email === "jopinksalot@msn.com") achievements.push({id:"boss_wife",name:"The Boss's Wife",desc:"The one who really runs things",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 12h12L13 5l-3 3-2-4-2 4-3-3z' fill='none' stroke='currentColor' stroke-width='1.2'/><rect x='2' y='12' width='12' height='2' rx='1' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:250,cat:"special",title:"The Boss's Wife",badge:"boss_wife"});
    if (player && isFounderRole(player)) achievements.push({id:"the_commish",name:"The Commissioner",desc:"Running the show",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l6 4H2zM3 6v7M6 6v7M10 6v7M13 6v7M1 13h14M1 14h14' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"special",title:"The Commissioner",badge:"commissioner"});

    // --- EVENT PARTICIPATION BADGES ---
    // Each event a player participates in earns them a unique badge
    // REQUIRES actual scores on at least one course — membership alone isn't participation
    var trips = getTrips();
    var eventCount = 0;
    trips.forEach(function(trip) {
      var isMember = (trip.members && trip.members.indexOf(pid) !== -1) ||
        (player && player.claimedFrom && trip.members && trip.members.indexOf(player.claimedFrom) !== -1);
      if (!isMember || !trip.courses) return;
      // Check if player has actual scores on ANY course in this trip
      var hasPlayed = trip.courses.some(function(crs) {
        var scores = getScores(trip.id, crs.key, pid);
        if (scores && scores.some(function(s){return s!==""&&s!==null&&s!==undefined;})) return true;
        // Also check claimedFrom
        if (player && player.claimedFrom) {
          var scores2 = getScores(trip.id, crs.key, player.claimedFrom);
          if (scores2 && scores2.some(function(s){return s!==""&&s!==null&&s!==undefined;})) return true;
        }
        return false;
      });
      // Also check if they have a round logged for any course in the trip
      if (!hasPlayed) {
        hasPlayed = rounds.some(function(r) {
          return trip.courses.some(function(crs) { return r.course === (crs.n || crs.key); });
        });
      }
      if (!hasPlayed) return;
      if (!achievements.some(function(a){return a.id === "event_" + trip.id})) {
        eventCount++;
        achievements.push({
          id: "event_" + trip.id,
          name: trip.name,
          desc: (trip.location || "Event") + " · " + (trip.dates || ""),
          icon: "<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='8' cy='4' r='3'/><path d='M3 14l5-5 5 5'/><line x1='8' y1='9' x2='8' y2='16'/></svg>",
          xp: 100,
          cat: "event",
          badge: "event_" + trip.id
        });
      }
    });
    if (eventCount >= 1) achievements.push({id:"event_goer",name:"Event Goer",desc:"Participate in an event",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 14h12M3 14V7M13 14V7M8 2L3 7h10z' fill='none' stroke='currentColor' stroke-width='1'/><path d='M8 2v5' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"milestone"});
    if (eventCount >= 3) achievements.push({id:"event_regular",name:"Event Regular",desc:"Participate in 3 events",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 14h12M3 14V7M13 14V7M8 2L3 7h10z' fill='none' stroke='currentColor' stroke-width='1'/><path d='M8 2v5' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"milestone",title:"Event Regular"});
    if (eventCount >= 5) achievements.push({id:"road_dog",name:"Road Dog",desc:"Participate in 5 events",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><rect x='1' y='7' width='14' height='5' rx='2' fill='none' stroke='currentColor' stroke-width='1'/><path d='M3 7l2-3h6l2 3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='4' cy='12' r='1.2' fill='currentColor'/><circle cx='12' cy='12' r='1.2' fill='currentColor'/></svg>",xp:300,cat:"milestone",title:"Road Dog"});
    if (eventCount >= 10) achievements.push({id:"tour_life",name:"Tour Life",desc:"Participate in 10 events",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 2l2 5h5l-1 1-4 0 0 4 2 1H5l2-1 0-4-4 0-1-1h5z' fill='none' stroke='currentColor' stroke-width='.8'/></svg>",xp:500,cat:"milestone",title:"Tour Life"});

    // --- SOCIAL ACHIEVEMENTS ---
    var chatPosts = 0;
    try { if (liveChat) chatPosts = liveChat.filter(function(m){return m.authorId === pid}).length; } catch(e){}
    if (chatPosts >= 1) achievements.push({id:"first_post",name:"First Post",desc:"Send a message in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"milestone"});

    // --- GOLF CULTURE & HOLE-BY-HOLE ACHIEVEMENTS ---
    // Exclude scramble — team birdies/eagles aren't individual achievements
    var indivHoleRounds = rounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
    var hasHoleScores = indivHoleRounds.some(function(r){return r.holeScores && r.holeScores.length});
    if (hasHoleScores) {
      var allHoleScores = [];
      var totalBirdies = 0, totalEagles = 0, totalPars = 0, totalDoubles = 0, totalTriples = 0;
      var maxBirdieStreak = 0;
      var maxParStreak = 0;
      
      indivHoleRounds.forEach(function(r) {
        if (!r.holeScores) return;
        // Reset streaks at start of each round — streaks must be within a single round
        var birdieStreak = 0;
        var parStreak = 0;
        // Try to get actual course pars: holePars on round > course holes data
        // CRITICAL: Do NOT fall back to default pars — they cause false birdies/eagles
        var coursePars = null;
        if (r.holePars && r.holePars.length) {
          coursePars = r.holePars;
        } else if (r.course) {
          var courseObj = PB.getCourses().find(function(c){ return c.name === r.course; });
          if (courseObj && courseObj.holes && courseObj.holes.length >= 9) {
            coursePars = courseObj.holes.map(function(h){ return h.par || 0; });
          }
        }
        r.holeScores.forEach(function(s, i) {
          if (s === "" || s === null || s === undefined) return;
          var score = parseInt(s);
          if (isNaN(score) || score <= 0) return;
          // Only count birdie/eagle/par if we have VERIFIED par for this hole
          var par = coursePars ? coursePars[i] : 0;
          if (!par || par <= 0) return; // Skip — no verified par data, can't determine relative score
          var diff = score - par;
          
          if (diff <= -2) { totalEagles++; birdieStreak++; }
          else if (diff === -1) { totalBirdies++; birdieStreak++; }
          else if (diff === 0) { totalPars++; birdieStreak = 0; parStreak++; }
          else if (diff === 2) { totalDoubles++; birdieStreak = 0; parStreak = 0; }
          else if (diff >= 3) { totalTriples++; birdieStreak = 0; parStreak = 0; }
          else { birdieStreak = 0; parStreak = 0; }
          
          if (birdieStreak > maxBirdieStreak) maxBirdieStreak = birdieStreak;
          if (parStreak > maxParStreak) maxParStreak = parStreak;
        });
      });
      
      // Birdie achievements
      if (totalBirdies >= 1) achievements.push({id:"first_birdie",name:"Tweet Tweet",desc:"Make your first birdie",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='1' fill='currentColor'/></svg>",xp:50,cat:"score"});
      if (totalBirdies >= 10) achievements.push({id:"birdie_machine",name:"Birdie Machine",desc:"10 career birdies",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='2' fill='currentColor'/></svg>",xp:150,cat:"score",title:"Birdie Machine"});
      if (totalBirdies >= 50) achievements.push({id:"birdie_king",name:"Birdie King",desc:"50 career birdies",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='currentColor' opacity='.2'/><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='8' cy='8' r='2' fill='currentColor'/></svg>",xp:500,cat:"score",title:"Birdie King"});
      
      // Eagle
      if (totalEagles >= 1) achievements.push({id:"eagle_eye",name:"Eagle!",desc:"Make your first eagle",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='8' cy='8' r='1' fill='currentColor'/></svg>",xp:200,cat:"score",title:"Eagle Eye"});
      
      // Par streaks
      if (maxParStreak >= 5) achievements.push({id:"steady_eddie",name:"Steady Eddie",desc:"5 pars in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h14' stroke='currentColor' stroke-width='2'/></svg>",xp:100,cat:"score"});
      if (maxParStreak >= 9) achievements.push({id:"par_machine",name:"Par Machine",desc:"9 pars in a row (full side)",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h14' stroke='currentColor' stroke-width='2'/><circle cx='4' cy='8' r='1' fill='currentColor'/><circle cx='8' cy='8' r='1' fill='currentColor'/><circle cx='12' cy='8' r='1' fill='currentColor'/></svg>",xp:300,cat:"score",title:"Par Machine"});
      
      // Birdie streaks
      if (maxBirdieStreak >= 2) achievements.push({id:"b2b_birdies",name:"Back to Back Birdies",desc:"2 birdies in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='5' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='11' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"score"});
      if (maxBirdieStreak >= 3) achievements.push({id:"birdie_streak3",name:"Hat Trick",desc:"3 birdies in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='3' cy='8' r='3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='8' cy='8' r='3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='13' cy='8' r='3' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"score",title:"Hat Trick"});
      
      // Bogey-free — only count if we have verified course pars (exclude scramble)
      var hasBogeyFreeRound = indivHoleRounds.some(function(r) {
        if (!r.holeScores || r.holeScores.filter(function(s){return s!==""}).length < 18) return false;
        var cp = null;
        if (r.holePars && r.holePars.length) cp = r.holePars;
        else if (r.course) { var co = PB.getCourses().find(function(c){return c.name===r.course;}); if (co && co.holes && co.holes.length>=18) cp = co.holes.map(function(h){return h.par||0;}); }
        if (!cp) return false; // No verified pars — can't determine bogey-free
        return !r.holeScores.some(function(s,i) { var p = cp[i]; return s !== "" && p > 0 && parseInt(s) > p; });
      });
      if (hasBogeyFreeRound) achievements.push({id:"bogey_free",name:"Bogey Free",desc:"Complete 18 holes without a bogey",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:1000,cat:"score",title:"Bogey Free"});
      
      // Double trouble (exclude scramble)
      if (totalDoubles >= 20) achievements.push({id:"double_trouble",name:"Double Trouble",desc:"20 career double bogeys",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l1 4 4-1-3 3 3 3-4-1-1 4-1-4-4 1 3-3-3-3 4 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"blunder",title:"Double Trouble"});
      
      // Snowman (score an 8 on a hole) — exclude scramble
      var hasSnowman = false;
      indivHoleRounds.forEach(function(r) { if (r.holeScores) r.holeScores.forEach(function(s) { if (parseInt(s) >= 8) hasSnowman = true; }); });
      if (hasSnowman) achievements.push({id:"snowman",name:"Snowman",desc:"Score an 8 or worse on a single hole",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='8' cy='12' r='4' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"blunder",title:"The Snowman"});
    }
    
    // --- FAMOUS COURSE ACHIEVEMENTS ---
    var coursesPlayed = {};
    rounds.forEach(function(r) { coursesPlayed[r.course] = 1; });
    
    if (coursesPlayed["Pinehurst No. 2"]) achievements.push({id:"pinehurst",name:"Pinehurst Pilgrim",desc:"Play Pinehurst No. 2",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"explore",title:"Pinehurst Pilgrim"});
    if (coursesPlayed["Tobacco Road Golf Club"]) achievements.push({id:"tobacco_rd",name:"Road Warrior",desc:"Survive Tobacco Road",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"explore"});
    if (coursesPlayed["The Omni Homestead - Cascades"]) achievements.push({id:"cascades",name:"Mountain Golf",desc:"Play The Cascades at Homestead",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 14l5-10 3 5 4-7 2 12z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"explore"});
    if (coursesPlayed["Primland - Highland Course"]) achievements.push({id:"primland",name:"Highland Fling",desc:"Play Primland Highland Course",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 14l5-10 3 5 4-7 2 12z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"explore"});
    if (coursesPlayed["Kingsmill Resort - River Course"]) achievements.push({id:"kingsmill",name:"River Rat",desc:"Play Kingsmill River Course",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8c3-3 5 3 8 0s4 3 6 0' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"explore"});
    if (coursesPlayed["Sequoyah National"]) achievements.push({id:"sequoyah",name:"Smoky Mountain Legend",desc:"Play Sequoyah National",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 14l5-10 3 5 4-7 2 12z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"explore"});
    
    // Check for courses with slope 140+
    var playedTough = rounds.some(function(r) {
      var c = getCourseByName(r.course);
      return c && c.slope >= 140;
    });
    if (playedTough) achievements.push({id:"beast_mode",name:"Beast Mode",desc:"Play a course with 140+ slope",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 2 3-4' fill='none' stroke='currentColor' stroke-width='1.5'/></svg>",xp:150,cat:"score",title:"Beast Mode"});
    
    // --- GOLF SAYINGS / FUN ACHIEVEMENTS ---
    // "Grip it and rip it" — play 3 rounds in one week
    if (rounds.length >= 3) {
      var weekRounds = {};
      rounds.forEach(function(r) {
        if (!r.date) return;
        var d = new Date(r.date + "T12:00:00");
        var weekKey = d.getFullYear() + "-W" + Math.floor((d.getTime() - new Date(d.getFullYear(),0,1).getTime()) / 604800000);
        weekRounds[weekKey] = (weekRounds[weekKey]||0) + 1;
      });
      if (Object.values(weekRounds).some(function(c){return c >= 3})) {
        achievements.push({id:"grip_rip",name:"Grip It & Rip It",desc:"Play 3 rounds in one week",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M9 1L4 9h4l-1 6 6-8H9l1-6z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"milestone",title:"Grip It & Rip It"});
      }
    }
    
    // "19th hole" — post in the Clubhouse after logging a round on the same day
    // (simplified: has both rounds and chat posts)
    if (chatPosts >= 1 && rounds.length >= 1) {
      achievements.push({id:"19th_hole",name:"The 19th Hole",desc:"Talk trash and play golf",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 12h12M7 12V3M7 3l5 3-5 3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='12' cy='12' r='2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"milestone"});
    }
    
    // "Sunday Best" — play a round on a Sunday
    var sundayRound = rounds.some(function(r) { return r.date && new Date(r.date+"T12:00:00").getDay() === 0; });
    if (sundayRound) achievements.push({id:"sunday_best",name:"Sunday Best",desc:"Play a round on Sunday",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='4' r='3' fill='none' stroke='currentColor' stroke-width='1'/><path d='M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"milestone"});
    
    // "The Comeback Kid" — improve score by 10+ strokes between two rounds at the same course
    if (rounds.length >= 2) {
      var courseScores = {};
      rounds.forEach(function(r) {
        if (!courseScores[r.course]) courseScores[r.course] = [];
        courseScores[r.course].push(r.score);
      });
      var hasComeback = Object.values(courseScores).some(function(scores) {
        if (scores.length < 2) return false;
        return Math.max.apply(null,scores) - Math.min.apply(null,scores) >= 10;
      });
      if (hasComeback) achievements.push({id:"comeback_kid",name:"The Comeback Kid",desc:"Improve by 10+ strokes at the same course",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 12l5-4 3 2 6-7' fill='none' stroke='currentColor' stroke-width='1.5'/><path d='M12 1l3 2-3 2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"growth",title:"Comeback Kid"});
    }

    // --- SOCIAL ACHIEVEMENTS (continued) ---
    if (chatPosts >= 25) achievements.push({id:"trash_talker",name:"Trash Talker",desc:"25 messages in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 6h4M6 8h2' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"milestone",title:"Trash Talker"});
    if (chatPosts >= 100) achievements.push({id:"motormouth",name:"Motor Mouth",desc:"100 messages in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"milestone",title:"Motor Mouth"});

    // --- WEEKEND / TIME ACHIEVEMENTS ---
    var weekendRounds = rounds.filter(function(r) { var d = new Date(r.date + "T12:00:00"); return d.getDay() === 0 || d.getDay() === 6; });
    if (weekendRounds.length >= 10) achievements.push({id:"weekend_warrior_ach",name:"Weekend Warrior",desc:"10 weekend rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 2 3-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone",title:"Weekend Warrior"});
    var weekdayRounds = rounds.filter(function(r) { var d = new Date(r.date + "T12:00:00"); return d.getDay() >= 1 && d.getDay() <= 5; });
    if (weekdayRounds.length >= 10) achievements.push({id:"hooky",name:"Playing Hooky",desc:"10 weekday rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"milestone",title:"Playing Hooky"});

    // --- CONSISTENCY ACHIEVEMENTS ---
    if (rounds.length >= 5) {
      var last5scores = rounds.slice(-5).map(function(r){return r.score});
      var range5 = Math.max.apply(null, last5scores) - Math.min.apply(null, last5scores);
      if (range5 <= 5) achievements.push({id:"mr_consistent",name:"Mr. Consistent",desc:"Last 5 rounds within 5 strokes",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h14' stroke='currentColor' stroke-width='1.5'/><circle cx='4' cy='8' r='1.5' fill='currentColor'/><circle cx='8' cy='8' r='1.5' fill='currentColor'/><circle cx='12' cy='8' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"growth",title:"Mr. Consistent"});
    }

    // --- BIRDIE / SCORE PATTERN ACHIEVEMENTS ---
    if (rounds.some(function(r){ return r.holeScores && r.holeScores.some(function(s,i){ var par = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5]; return s !== "" && parseInt(s) === 1; }); })) {
      achievements.push({id:"holed_out",name:"Holed Out",desc:"Score a 1 on any hole",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='2' fill='currentColor'/></svg>",xp:500,cat:"special"});
    }

    // --- ROUND COUNT MILESTONES (extended) ---
    if (rounds.length >= 200) achievements.push({id:"lifer",name:"Lifer",desc:"Log 200 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:2000,cat:"milestone",title:"The Lifer"});
    if (rounds.length >= 500) achievements.push({id:"legend",name:"Living Legend",desc:"Log 500 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:5000,cat:"milestone",title:"Living Legend"});

    // --- COURSE EXPLORATION (extended) ---
    if (courseCount >= 50) achievements.push({id:"cartographer",name:"Cartographer",desc:"Play 50 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"explore",title:"The Cartographer"});
    if (stateCount >= 8) achievements.push({id:"interstate",name:"Interstate",desc:"Play in 8+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:500,cat:"explore",title:"Interstate"});

    // --- BACK TO BACK ---
    if (rounds.length >= 2) {
      var sortedByDate = rounds.slice().sort(function(a,b){return a.date>b.date?1:-1});
      var backToBack = false;
      for (var bi = 1; bi < sortedByDate.length; bi++) {
        var d1 = new Date(sortedByDate[bi-1].date+"T12:00:00");
        var d2 = new Date(sortedByDate[bi].date+"T12:00:00");
        if ((d2 - d1) <= 86400000) { backToBack = true; break; }
      }
      if (backToBack) achievements.push({id:"b2b",name:"Back to Back",desc:"Play rounds on consecutive days",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M3 8h10M8 3v10' stroke='currentColor' stroke-width='1.5'/></svg>",xp:75,cat:"milestone"});
    }

    // --- DAWN PATROL (early season) ---
    var marchRounds = rounds.filter(function(r){ return r.date && r.date.substring(5,7) === "03"; });
    if (marchRounds.length >= 1) achievements.push({id:"dawn_patrol",name:"Dawn Patrol",desc:"Play a round in March",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 4v4l3 2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"milestone"});

    // --- SEASON FINISHER ---
    var septRounds = rounds.filter(function(r){ return r.date && r.date.substring(5,7) === "09"; });
    if (septRounds.length >= 1) achievements.push({id:"closer",name:"The Closer",desc:"Play a round in September",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 6v4' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='12' r='.8' fill='currentColor'/></svg>",xp:50,cat:"milestone"});

    // --- SCRAMBLE ACHIEVEMENTS ---
    var scrambleTeams = getScrambleTeams();
    var myTeams = scrambleTeams.filter(function(t){return t.members && t.members.indexOf(pid) !== -1});
    if (myTeams.length >= 1) achievements.push({id:"team_player",name:"Drafted",desc:"Join a scramble team",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"compete"});
    if (myTeams.length >= 2) achievements.push({id:"multi_team",name:"Free Agent",desc:"Join 2 different scramble teams",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='5' cy='5' r='2.5' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='11' cy='5' r='2.5' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M1 13c0-2.2 1.8-4 4-4M7 13c0-2.2 1.8-4 4-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"compete"});
    var totalTeamWins = 0;
    var totalTeamMatches = 0;
    myTeams.forEach(function(t){ if(t.matches) t.matches.forEach(function(m){totalTeamMatches++;if(m.result==="win")totalTeamWins++;}); });
    var totalTeamRounds = 0;
    myTeams.forEach(function(t){ if(t.matches) totalTeamRounds += t.matches.filter(function(m){return m.score;}).length; });
    if (totalTeamRounds >= 1) achievements.push({id:"scramble_debut",name:"Scramble Debut",desc:"Play in your first scramble round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"compete"});
    if (totalTeamWins >= 1) achievements.push({id:"scramble_first_win",name:"First W",desc:"Win your first scramble match",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M4 2h8l-1 6H5L4 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 6M10 8l-2 6' stroke='currentColor' stroke-width='1.2'/><path d='M3 14h10' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"});
    if (totalTeamWins >= 5) achievements.push({id:"squad_goals",name:"Squad Goals",desc:"Win 5 scramble matches",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"compete",title:"Squad Goals"});
    // Scramble under-par achievement
    var anyTeamUnderPar = false;
    myTeams.forEach(function(t){ if(t.matches) t.matches.forEach(function(m){if(m.score&&m.score<72)anyTeamUnderPar=true;}); });
    if (anyTeamUnderPar) achievements.push({id:"team_under_par",name:"Under the Radar",desc:"Team shoots under par in scramble",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 2a6 6 0 100 12A6 6 0 008 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 8l2 2 4-4' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"compete",title:"Under the Radar"});
    // Scramble courses variety
    var scrambleCourses = {};
    myTeams.forEach(function(t){ if(t.matches) t.matches.forEach(function(m){if(m.course)scrambleCourses[m.course]=1;}); });
    if (Object.keys(scrambleCourses).length >= 3) achievements.push({id:"road_warriors",name:"Road Warriors",desc:"Play scramble at 3 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 14L8 2l6 12' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4.5 10h7' stroke='currentColor' stroke-width='1.2'/></svg>",xp:125,cat:"compete",title:"Road Warriors"});
    // Captain achievement
    var captainTeams = myTeams.filter(function(t){ return t.captain === pid; });
    var captainRounds = 0;
    captainTeams.forEach(function(t){ if(t.matches) captainRounds += t.matches.filter(function(m){return m.score;}).length; });
    if (captainRounds >= 1) achievements.push({id:"captain_obvious",name:"Captain",desc:"Lead your team as captain",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4 4.3 12.5l.7-4.1-3-2.9 4.2-.9z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete",title:"The Captain"});

    // --- INVITE ACHIEVEMENT ---
    var inviteCount = player ? (player.invitesUsed || 0) : 0;
    // Commissioner who has created invites — check role as fallback since invitesUsed wasn't tracked before
    if (player && isFounderRole(player) && inviteCount < 3) {
      // Count from members who have invitedBy matching this user's UID
      var recruited = getPlayers().filter(function(p) { return p.invitedBy === pid || (player.claimedFrom && p.invitedBy === player.claimedFrom); });
      if (recruited.length > inviteCount) inviteCount = recruited.length;
      // Also check fbMemberCache
      if (typeof fbMemberCache !== "undefined") {
        var fbRecruited = Object.values(fbMemberCache).filter(function(m) { return m.invitedBy === pid; });
        if (fbRecruited.length > inviteCount) inviteCount = fbRecruited.length;
      }
    }
    if (player && inviteCount >= 1) achievements.push({id:"recruiter",name:"Recruiter",desc:"Invite a new member",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M12 3v4M10 5h4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special",title:"The Recruiter"});
    if (player && inviteCount >= 3) achievements.push({id:"ambassador",name:"Ambassador",desc:"Use all 3 invites",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"special",title:"Ambassador"});

    // ===== RANGE ACHIEVEMENTS =====
    var _rangeSVG = "<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>";
    var _rangeS = typeof liveRangeSessions !== "undefined" ? liveRangeSessions.filter(function(s){return s.playerId===pid && s.visibility !== "private"}) : [];
    // Consistency
    if (_rangeS.length >= 1) achievements.push({id:"first_swing",name:"First Swing",desc:"Log your first range session",icon:_rangeSVG,xp:50,cat:"range"});
    if (_rangeS.length >= 10) achievements.push({id:"range_rat",name:"Range Rat",desc:"10 range sessions",icon:_rangeSVG,xp:100,cat:"range",title:"Range Rat"});
    if (_rangeS.length >= 25) achievements.push({id:"creature_habit",name:"Creature of Habit",desc:"25 range sessions",icon:_rangeSVG,xp:200,cat:"range"});
    if (_rangeS.length >= 50) achievements.push({id:"iron_sharpener",name:"Iron Sharpener",desc:"50 range sessions",icon:_rangeSVG,xp:400,cat:"range",title:"Iron Sharpener"});
    if (_rangeS.length >= 100) achievements.push({id:"range_resident",name:"Range Resident",desc:"100 range sessions",icon:_rangeSVG,xp:750,cat:"range",title:"Range Resident"});
    // Streaks
    var _rStreak = typeof calcRangeStreak !== "undefined" ? calcRangeStreak(_rangeS) : 0;
    if (_rStreak >= 2) achievements.push({id:"two_peat",name:"Two-Peat",desc:"2-week range streak",icon:_rangeSVG,xp:50,cat:"range"});
    if (_rStreak >= 4) achievements.push({id:"range_hot_streak",name:"Range Hot Streak",desc:"4-week range streak",icon:_rangeSVG,xp:100,cat:"range",title:"Range Hot Streak"});
    if (_rStreak >= 8) achievements.push({id:"dialed_in",name:"Dialed In",desc:"8-week range streak",icon:_rangeSVG,xp:250,cat:"range",title:"Dialed In"});
    if (_rStreak >= 12) achievements.push({id:"relentless",name:"Relentless",desc:"12-week range streak",icon:_rangeSVG,xp:500,cat:"range",title:"Relentless"});
    // Volume
    var _rMins = _rangeS.reduce(function(a,s){return a+(s.durationMin||0)},0);
    if (_rMins >= 300) achievements.push({id:"bucket_buster",name:"Bucket Buster",desc:"5 total hours on the range",icon:_rangeSVG,xp:75,cat:"range"});
    if (_rMins >= 1500) achievements.push({id:"sweat_equity",name:"Sweat Equity",desc:"25 total hours on the range",icon:_rangeSVG,xp:200,cat:"range",title:"Sweat Equity"});
    if (_rMins >= 6000) achievements.push({id:"ten_k_hours",name:"10,000 Hours",desc:"100 total hours on the range",icon:_rangeSVG,xp:750,cat:"range",title:"10,000 Hours"});
    // Endurance
    if (_rangeS.some(function(s){return (s.durationMin||0)>=60})) achievements.push({id:"locked_in",name:"Locked In",desc:"60+ minute range session",icon:_rangeSVG,xp:100,cat:"range"});
    if (_rangeS.some(function(s){return (s.durationMin||0)>=90})) achievements.push({id:"marathon_man",name:"Marathon Man",desc:"90+ minute range session",icon:_rangeSVG,xp:200,cat:"range",title:"Marathon Man"});
    // Drills
    if (_rangeS.some(function(s){return s.drills&&s.drills.length>=3})) achievements.push({id:"lab_work",name:"Lab Work",desc:"Use 3+ drills in one session",icon:_rangeSVG,xp:50,cat:"range"});
    var _rDC={};_rangeS.forEach(function(s){if(s.drills)s.drills.forEach(function(d){_rDC[d]=(_rDC[d]||0)+1})});
    if (Object.values(_rDC).some(function(c){return c>=10})) achievements.push({id:"specialist",name:"Specialist",desc:"Use the same drill in 10 sessions",icon:_rangeSVG,xp:75,cat:"range",title:"Specialist"});
    // Check all cats covered
    var _rCats={};_rangeS.forEach(function(s){if(s.drills)s.drills.forEach(function(did){var dl=(typeof DRILL_LIBRARY!=="undefined"?DRILL_LIBRARY:[]).find(function(x){return x.id===did});if(dl)_rCats[dl.cat]=1;})});
    if (_rCats.path&&_rCats.extension&&_rCats.short&&_rCats.general) achievements.push({id:"well_rounded",name:"Well-Rounded",desc:"Use drills from every category",icon:_rangeSVG,xp:100,cat:"range",title:"Well-Rounded"});
    // Custom drill
    if (_rangeS.some(function(s){return s.drills&&s.drills.some(function(d){return d.indexOf("custom_")===0})})) achievements.push({id:"custom_built",name:"Custom Built",desc:"Create and use a custom drill",icon:_rangeSVG,xp:50,cat:"range"});
    // Coach's Orders
    if (_rangeS.some(function(s){return s.drills&&s.drills.length>=4})) achievements.push({id:"coachs_orders",name:"Coach's Orders",desc:"Complete a session with 4 drills",icon:_rangeSVG,xp:75,cat:"range"});
    // Double Duty
    var _rDates={};_rangeS.forEach(function(s){if(s.date)_rDates[s.date]=1});
    if (rounds.some(function(r){return r.date&&_rDates[r.date]})) achievements.push({id:"double_duty",name:"Double Duty",desc:"Range session + round same day",icon:_rangeSVG,xp:100,cat:"range",title:"Double Duty"});
    // Dawn Patrol / Night Owl (based on startedAt hour)
    if (_rangeS.some(function(s){if(!s.startedAt)return false;var h=new Date(s.startedAt).getHours();return h<8})) achievements.push({id:"range_dawn",name:"Dawn Patrol",desc:"Range session before 8am",icon:_rangeSVG,xp:50,cat:"range"});
    if (_rangeS.some(function(s){if(!s.startedAt)return false;var h=new Date(s.startedAt).getHours();return h>=20})) achievements.push({id:"range_night_owl",name:"Night Owl",desc:"Range session after 8pm",icon:_rangeSVG,xp:50,cat:"range"});
    if (_rangeS.some(function(s){if(!s.startedAt)return false;var dt=new Date(s.startedAt);var h=dt.getHours();var m=dt.getMinutes();return h>18||(h===18&&m>=30)})) achievements.push({id:"range_night_shift",name:"Night Shift",desc:"Range session after 6:30pm",icon:_rangeSVG,xp:75,cat:"range",title:"Night Shift"});
    // Focused practice
    var focusedSessions = _rangeS.filter(function(s){return s.focus && s.focus.trim().length > 0;});
    if (focusedSessions.length >= 1) achievements.push({id:"focused_practice",name:"Intentional",desc:"Log a range session with a focus note",icon:_rangeSVG,xp:25,cat:"range"});
    if (focusedSessions.length >= 5) achievements.push({id:"student_of_game",name:"Student of the Game",desc:"5 sessions with a focus note",icon:_rangeSVG,xp:100,cat:"range",title:"Student of the Game"});
    // Sessions with notes
    var notedSessions = _rangeS.filter(function(s){return s.notes && s.notes.trim().length > 0;});
    if (notedSessions.length >= 3) achievements.push({id:"tape_study",name:"Tape Study",desc:"Leave notes on 3 range sessions",icon:_rangeSVG,xp:50,cat:"range"});
    // Dialed feel
    var dialedSessions = _rangeS.filter(function(s){return s.feel===3;});
    if (dialedSessions.length >= 3) achievements.push({id:"dialed_feel",name:"Dialed",desc:"Rate 3 sessions as Dialed",icon:_rangeSVG,xp:75,cat:"range",title:"Dialed"});

    // ===== COURSE-SPECIFIC & IMPROVEMENT ACHIEVEMENTS ===== — improve 10+ strokes over previous round at same course
    if (indivRounds.length >= 2) {
      var _courseMap = {};
      indivRounds.slice().sort(function(a,b){return a.date>b.date?1:-1}).forEach(function(r) {
        if (_courseMap[r.course] !== undefined) {
          if (_courseMap[r.course] - r.score >= 10) achievements.push({id:"flip_flop",name:"Flip Flop",desc:"Improve 10+ strokes over your previous round at same course",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 12l5-7 3 4 3-6 3 5' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"growth",title:"The Flip Flop"});
        }
        _courseMap[r.course] = r.score;
      });
    }

    // Trophy Shelf — earn 15+ achievements
    if (achievements.length >= 15) achievements.push({id:"trophy_shelf",name:"Trophy Shelf",desc:"Earn 15 achievements",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M3 13h10M4 7h8M5 7V4a1 1 0 012-2h2a1 1 0 012 2v3M4 13v-2a4 4 0 018 0v2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:250,cat:"milestone",title:"Trophy Shelf"});
    if (achievements.length >= 25) achievements.push({id:"achievement_hunter",name:"Achievement Hunter",desc:"Earn 25 achievements",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone",title:"Achievement Hunter"});

    // Two rounds same day (exclude scramble — playing scramble + individual same day isn't "two-a-day")
    var _dateCounts = {};
    indivRounds.forEach(function(r){if(r.date) _dateCounts[r.date]=(_dateCounts[r.date]||0)+1;});
    if (Object.values(_dateCounts).some(function(c){return c>=2;})) {
      achievements.push({id:"two_a_day",name:"Two-A-Day",desc:"Log two rounds on the same day",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='5' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='11' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"});
    }

    // SMO Triple Crown — play all 4 SMO courses
    var smoCourses = ["Sequoyah National","Springdale Resort","Maggie Valley","Connestee Falls"];
    var _playedCourses = {};
    rounds.forEach(function(r){if(r.course)_playedCourses[r.course.split(" ")[0]]=1;});
    var smoPlayed = smoCourses.filter(function(c){return _playedCourses[c.split(" ")[0]];}).length;
    if (smoPlayed >= 4) achievements.push({id:"triple_crown",name:"SMO Triple Crown",desc:"Play all four Smoky Mountain Open courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 14l5-10 3 5 4-7 2 12z' fill='none' stroke='currentColor' stroke-width='1'/><path d='M3 14h10' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"explore",title:"SMO Legend"});

    // All In — round + range + party game in same week
    var _weekActivity = {};
    rounds.forEach(function(r){if(r.date){var d=new Date(r.date+"T12:00:00");var wk=d.getFullYear()+"-"+Math.floor(d.getDate()/7);_weekActivity[wk]=_weekActivity[wk]||{};_weekActivity[wk].round=1;}});
    _rangeS.forEach(function(s){if(s.date){var d=new Date(s.date+"T12:00:00");var wk=d.getFullYear()+"-"+Math.floor(d.getDate()/7);_weekActivity[wk]=_weekActivity[wk]||{};_weekActivity[wk].range=1;}});
    if (Object.values(_weekActivity).some(function(w){return w.round&&w.range;})) {
      achievements.push({id:"all_in",name:"All In",desc:"Log a round and a range session in the same week",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"milestone",title:"All In"});
    }

    // Deep Clean — 18-hole individual round where every score is par or better (verified pars only)
    if (indivHoleRounds.some(function(r){
      if (!r.holeScores || r.holeScores.filter(function(s){return s !== "";}).length < 18) return false;
      var cp = r.holePars || null;
      if (!cp && r.course) { var co = PB.getCourses().find(function(c){return c.name===r.course;}); if (co && co.holes && co.holes.length>=18) cp = co.holes.map(function(h){return h.par||0;}); }
      if (!cp) return false;
      return r.holeScores.every(function(s,i){ return s === "" || !cp[i] || parseInt(s) <= cp[i]; });
    })) achievements.push({id:"clean_card",name:"Clean Card",desc:"Complete an 18-hole round with no scores over par",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><rect x='3' y='2' width='10' height='12' rx='1' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 7l2 2 4-4' stroke='currentColor' stroke-width='1.2'/></svg>",xp:500,cat:"score",title:"Clean Card"});

    // Overcorrection — score 15+ strokes worse than personal best (exclude scramble)
    if (indivRounds.length >= 2) {
      var _pb = Math.min.apply(null, indivRounds.map(function(r){return r.score;}));
      if (indivRounds.some(function(r){return r.score >= _pb + 15;})) {
        achievements.push({id:"overcorrection",name:"The Overcorrection",desc:"Shoot 15+ strokes worse than your personal best",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 5l5 4 3-3 6 8' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M13 8l3 5h-4z' fill='currentColor'/></svg>",xp:30,cat:"blunder",title:"The Overcorrection"});
      }
    }

    // Founding Season — 5+ rounds in 2026
    var _2026rounds = rounds.filter(function(r){return r.date && r.date.startsWith("2026");});
    if (_2026rounds.length >= 5) achievements.push({id:"founding_season",name:"Founding Season",desc:"Log 5 rounds in the founding 2026 season",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special",title:"Founding Season"});

    // Share achievements — count persisted in Firestore member doc (shareCount field)
    var shareCount = window._pbShareCount || 0;
    if (shareCount >= 1)   achievements.push({id:"share_1",  name:"First Take",             desc:"Share your first scorecard", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:50,  cat:"social"});
    if (shareCount >= 5)   achievements.push({id:"share_5",  name:"Posting Season",         desc:"Share 5 scorecards",          icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:100, cat:"social"});
    if (shareCount >= 10)  achievements.push({id:"share_10", name:"Content Creator",        desc:"Share 10 scorecards",         icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:200, cat:"social", title:"Content Creator"});
    if (shareCount >= 25)  achievements.push({id:"share_25", name:"The Brand",              desc:"Share 25 scorecards",         icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:400, cat:"social", title:"The Brand"});
    if (shareCount >= 50)  achievements.push({id:"share_50", name:"Parbaugh Propagandist",  desc:"Share 50 scorecards",         icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:750, cat:"social", title:"Parbaugh Propagandist"});
    if (shareCount >= 100) achievements.push({id:"share_100",name:"The Chronicler",         desc:"Share 100 scorecards",        icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>", xp:1500,cat:"social", title:"The Chronicler"});

    // Range + Round Deep Dive — range session 30+ min + 3 drills + focus note
    if (_rangeS.some(function(s){return (s.durationMin||0)>=30 && s.drills && s.drills.length>=3 && s.focus && s.focus.trim();})) {
      achievements.push({id:"deep_dive",name:"The Deep Dive",desc:"30+ min range session with 3 drills and a focus note",icon:_rangeSVG,xp:125,cat:"range",title:"The Deep Dive"});
    }

    // ===== INFER earnedAt DATES =====
    var sortedRounds = rounds.slice().sort(function(a,b){return (a.date||"")>(b.date||"")?1:-1});
    var sortedRange = _rangeS.slice().sort(function(a,b){return (a.date||"")>(b.date||"")?1:-1});
    var playerCreated = player && player.createdAt ? (player.createdAt.toDate ? player.createdAt.toDate().toISOString().split("T")[0] : (typeof player.createdAt === "string" ? player.createdAt.split("T")[0] : null)) : null;
    
    // Helper: get date of Nth round
    function nthRoundDate(n) { return sortedRounds.length >= n ? sortedRounds[n-1].date : null; }
    // Helper: first round matching condition
    function firstRoundWhere(fn) { for (var i=0;i<sortedRounds.length;i++) { if (fn(sortedRounds[i])) return sortedRounds[i].date; } return null; }
    // Helper: date when Nth unique course was reached
    function nthCourseDate(n) { var seen={},count=0; for (var i=0;i<sortedRounds.length;i++) { if (!seen[sortedRounds[i].course]) { seen[sortedRounds[i].course]=1; count++; if (count>=n) return sortedRounds[i].date; } } return null; }
    // Helper: date when Nth unique state was reached
    function nthStateDate(n) { var seen={},count=0; for (var i=0;i<sortedRounds.length;i++) { var c=getCourseByName(sortedRounds[i].course); if (c&&c.region&&!seen[c.region]) { seen[c.region]=1; count++; if (count>=n) return sortedRounds[i].date; } } return null; }
    // Helper: Nth range session date
    function nthRangeDate(n) { return sortedRange.length >= n ? sortedRange[n-1].date : null; }
    // Helper: first range session where condition
    function firstRangeWhere(fn) { for (var i=0;i<sortedRange.length;i++) { if (fn(sortedRange[i])) return sortedRange[i].date; } return null; }
    
    var dateMap = {
      // Round milestones
      first_blood: nthRoundDate(1), getting_started: nthRoundDate(5), regular: nthRoundDate(10),
      grinder: nthRoundDate(25), veteran: nthRoundDate(50), centurion: nthRoundDate(100),
      rounds_200: nthRoundDate(200), rounds_500: nthRoundDate(500),
      // Score — only 18-hole rounds
      sub120: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<=120}), sub100: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<100}),
      sub90: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<90}), sub85: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<85}),
      sub80: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<80}), sub75: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<75}),
      sub70: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score<70}),
      course_rating: firstRoundWhere(function(r){return (!r.holesPlayed||r.holesPlayed>=18) && r.score===Number(r.rating)}),
      // Explore
      sampler: nthCourseDate(3), explorer: nthCourseDate(5), collector: nthCourseDate(10), nomad: nthCourseDate(25),
      traveler2: nthStateDate(2), traveler: nthStateDate(3), roadwarrior: nthStateDate(5),
      // Play Now
      live_scorer: firstRoundWhere(function(r){return r.holeScores}),
      attested: firstRoundWhere(function(r){return r.attestedBy}),
      // Range
      first_swing: nthRangeDate(1), range_rat: nthRangeDate(10), creature_habit: nthRangeDate(25),
      iron_sharpener: nthRangeDate(50), range_resident: nthRangeDate(100),
      locked_in: firstRangeWhere(function(s){return (s.durationMin||0)>=60}),
      marathon_man: firstRangeWhere(function(s){return (s.durationMin||0)>=90}),
      lab_work: firstRangeWhere(function(s){return s.drills&&s.drills.length>=3}),
      coachs_orders: firstRangeWhere(function(s){return s.drills&&s.drills.length>=4}),
      custom_built: firstRangeWhere(function(s){return s.drills&&s.drills.some(function(d){return d.indexOf("custom_")===0})}),
      // Special
      founding: playerCreated, beta: playerCreated, commissioner_ach: playerCreated,
      // Scramble/team
      multi_team: null, scramble_debut: firstRangeWhere(function(){ return false; }),
      scramble_first_win: null, team_under_par: null, road_warriors: null,
      captain_obvious: null,
      // Range — new
      range_night_shift: firstRangeWhere(function(s){ if(!s.startedAt)return false; var dt=new Date(s.startedAt); return dt.getHours()>18||(dt.getHours()===18&&dt.getMinutes()>=30); }),
      focused_practice: firstRangeWhere(function(s){ return s.focus&&s.focus.trim().length>0; }),
      student_of_game: null, tape_study: null, dialed_feel: null
    };
    
    achievements.forEach(function(ach) {
      if (dateMap[ach.id]) ach.earnedAt = dateMap[ach.id];
      else if (playerCreated) ach.earnedAt = playerCreated;
    });

    return achievements;
  }

  /* ---------- H2H CHALLENGES ---------- */
  function createChallenge(fromId, toId, courseId, stakes) {
    if (!state.challenges) state.challenges = [];
    var challenge = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      from: fromId,
      to: toId,
      course: courseId,
      stakes: stakes || "",
      status: "pending", // pending, accepted, declined, completed
      created: localDateStr(),
      result: null
    };
    state.challenges.push(challenge);
    addNotification(toId, {type:"h2h_challenge",from:fromId,challengeId:challenge.id,text:(getPlayer(fromId)||{}).username+" challenged you!"});
    save();
    return challenge;
  }

  function getChallenges(pid) {
    if (!state.challenges) return [];
    return state.challenges.filter(function(c) { return c.from === pid || c.to === pid; });
  }

  function updateChallenge(id, updates) {
    if (!state.challenges) return;
    var c = state.challenges.find(function(ch) { return ch.id === id; });
    if (c) { Object.keys(updates).forEach(function(k) { c[k] = updates[k]; }); save(); }
  }

  /* ---------- NOTIFICATIONS ---------- */
  function addNotification(pid, notif) {
    if (!state.notifications) state.notifications = {};
    if (!state.notifications[pid]) state.notifications[pid] = [];
    notif.id = Date.now().toString(36);
    notif.read = false;
    notif.ts = Date.now();
    notif.date = localDateStr();
    state.notifications[pid].push(notif);
    save();
  }

  function getNotifications(pid) {
    if (!state.notifications || !state.notifications[pid]) return [];
    return state.notifications[pid].slice().sort(function(a,b){return(b.ts||0)-(a.ts||0)});
  }

  function markNotificationRead(pid, notifId) {
    if (!state.notifications || !state.notifications[pid]) return;
    var n = state.notifications[pid].find(function(x){return x.id===notifId});
    if (n) { n.read = true; save(); }
  }

  function getUnreadCount(pid) {
    if (!state.notifications || !state.notifications[pid]) return 0;
    return state.notifications[pid].filter(function(n){return !n.read}).length;
  }

  /* ---------- SEASON STANDINGS (Point System) ---------- */
  // Points per round: based on differential (score - handicap - par)
  // Better than expected = more points. Levels the playing field.
  // Base 100pts per round, +/- 5pts per stroke vs expected
  // Bonus: personal best = 50pts, new course = 25pts, attested = 15pts
  // ── Season config ──
  var SEASON_CONFIG = [
    {key: "spring", label: "Spring", start: "-03-01", end: "-05-31"},
    {key: "summer", label: "Summer", start: "-06-01", end: "-08-31"},
    {key: "fall",   label: "Fall",   start: "-09-01", end: "-11-30"}
  ];

  function getCurrentSeason() {
    var now = new Date();
    var year = now.getFullYear();
    var todayStr = localDateStr(now);
    for (var i = 0; i < SEASON_CONFIG.length; i++) {
      var s = SEASON_CONFIG[i];
      if (todayStr >= year + s.start && todayStr <= year + s.end) {
        return {key: s.key, label: s.label + " " + year, year: year, start: year + s.start, end: year + s.end};
      }
    }
    // Offseason (Dec-Feb) — show most recent season
    if (todayStr < year + "-03-01") {
      return {key: "fall", label: "Fall " + (year - 1), year: year - 1, start: (year - 1) + "-09-01", end: (year - 1) + "-11-30"};
    }
    return {key: "fall", label: "Fall " + year, year: year, start: year + "-09-01", end: year + "-11-30"};
  }

  function getSeasonStandings(year, seasonKey) {
    year = year || new Date().getFullYear();
    var seasonStart, seasonEnd, seasonLabel;
    if (seasonKey) {
      var cfg = SEASON_CONFIG.find(function(s) { return s.key === seasonKey; });
      if (cfg) { seasonStart = year + cfg.start; seasonEnd = year + cfg.end; seasonLabel = cfg.label + " " + year; }
      else { seasonStart = year + "-03-01"; seasonEnd = year + "-11-30"; seasonLabel = year + " Full Year"; }
    } else {
      // Default: current season or full year
      var current = getCurrentSeason();
      seasonStart = current.start;
      seasonEnd = current.end;
      seasonLabel = current.label;
    }
    var players = getPlayers();
    var standings = players.map(function(p) {
      var allRounds = getPlayerRounds(p.id);
      var rounds = allRounds.filter(function(r) {
        return r.date >= seasonStart && r.date <= seasonEnd && r.visibility !== "private";
      });
      if (!rounds.length) return null;
      var ghinHcap = calcHandicap(allRounds);
      var hcap = ghinHcap !== null ? ghinHcap : 36; // WHS default for unestablished
      var points = 0;
      var bestSoFar = 999;
      var seenCourses = {};
      // Only individual rounds earn season points (scramble is team play)
      var seasonIndiv = rounds.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4"; });
      seasonIndiv.forEach(function(r) {
        var coursePar = 72;
        var c = getCourseByName(r.course);
        if (c && c.par) coursePar = c.par;
        var is9h = r.holesPlayed && r.holesPlayed <= 9;
        // For 9-hole rounds, halve the expected score
        var expected = is9h ? (coursePar / 2) + (hcap / 2) : coursePar + hcap;
        var diff = r.score - expected;
        var roundPts = Math.max(10, 100 - (diff * 5));
        // Personal best bonus — only compare like-for-like (18 vs 18)
        if (!is9h && r.score < bestSoFar) { roundPts += 50; bestSoFar = r.score; }
        else if (!is9h && bestSoFar === 999) bestSoFar = r.score;
        // New course bonus
        if (!seenCourses[r.course]) { roundPts += 25; seenCourses[r.course] = 1; }
        // Attested bonus
        if (r.attestedBy) roundPts += 15;
        points += Math.round(roundPts);
      });
      // Avg and best only from 18-hole individual rounds (no scramble)
      var full18 = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
      var avg = full18.length ? Math.round(full18.reduce(function(a,r){return a+r.score},0) / full18.length * 10) / 10 : null;
      var best = full18.length ? Math.min.apply(null, full18.map(function(r){return r.score})) : null;
      var uniqueCourses = {};
      rounds.forEach(function(r) { uniqueCourses[r.course] = 1; });
      var courseNames = Object.keys(uniqueCourses);
      return {
        id: p.id,
        username: p.username || p.name,
        name: p.name,
        rounds: rounds.length,
        points: points,
        avg: avg,
        best: best,
        hcap: calcHandicap(rounds),
        courses: courseNames
      };
    }).filter(function(s) { return s !== null; });
    standings.sort(function(a, b) { return b.points - a.points; });
    return { year: year, seasonKey: seasonKey || getCurrentSeason().key, seasonLabel: seasonLabel || (year + ""), standings: standings, seasonStart: seasonStart, seasonEnd: seasonEnd };
  }

  /* ---------- PROFILE POSTS ---------- */
  function addPost(pid, post) {
    var p = getPlayer(pid);
    if (!p) return null;
    if (!p.posts) p.posts = [];
    var newPost = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      type: post.type || "text", // text, photo, round, h2h
      text: post.text || "",
      photo: post.photo || "",
      roundId: post.roundId || null,
      visibility: post.visibility || "public",
      ts: Date.now(),
      date: localDateStr()
    };
    p.posts.unshift(newPost);
    if (newPost.visibility === "public") {
      if (!state.activity) state.activity = [];
      state.activity.push({type:"post",playerName:p.username||p.name,text:newPost.text,date:newPost.date,ts:Date.now()});
    }
    save();
    return newPost;
  }

  function getPlayerPosts(pid) {
    var p = getPlayer(pid);
    return p && p.posts ? p.posts : [];
  }

  /* ---------- INIT ---------- */
  state = load();
  if (!state.activity) state.activity = [];
  if (!state.challenges) state.challenges = [];
  if (!state.notifications) state.notifications = {};

  // ── v8.14.4 — Time-range filtering helpers (P17 trend-chart toggle pattern) ──
  // Used by Members profile trend charts (Scoring/GIR/Putts) to subset rounds
  // before passing to calcScoringTrends / calcStatTrends.

  // Extract round timestamp. Handles ISO date string (canonical r.date format
  // per utils.js localDateStr — "YYYY-MM-DD"), Firestore Timestamp shapes
  // (defensive against legacy round docs), Unix millis. Returns 0 on missing
  // or unparseable date — caller's range filter excludes via `>= cutoff`.
  function getRoundTimestamp(round) {
    var d = round && (round.date || round.createdAt || round.roundDate);
    if (!d) return 0;
    if (typeof d === "number") return d;
    if (typeof d === "string") {
      var ms = new Date(d).getTime();
      return isNaN(ms) ? 0 : ms;
    }
    if (typeof d.toMillis === "function") { try { return d.toMillis(); } catch (e) { return 0; } }
    if (typeof d.seconds === "number") return d.seconds * 1000;
    return 0;
  }

  // Filter rounds by time range. range: "30D" | "SEASON" | "ANNUAL".
  //   30D     — trailing 30 days from now
  //   SEASON  — Apr 1 – Oct 31 of current calendar year (US northern golf season)
  //   ANNUAL  — trailing 365 days from now
  // Unknown range falls through to unfiltered rounds (safe default).
  function filterRoundsByRange(rounds, range) {
    if (!Array.isArray(rounds)) return [];
    var now = Date.now();
    if (range === "30D") {
      var cutoff30 = now - (30 * 24 * 60 * 60 * 1000);
      return rounds.filter(function(r) { return getRoundTimestamp(r) >= cutoff30; });
    }
    if (range === "SEASON") {
      var year = new Date(now).getFullYear();
      var seasonStart = new Date(year, 3, 1).getTime();              // Apr 1
      var seasonEnd = new Date(year, 9, 31, 23, 59, 59, 999).getTime(); // Oct 31
      return rounds.filter(function(r) {
        var t = getRoundTimestamp(r);
        return t >= seasonStart && t <= seasonEnd;
      });
    }
    if (range === "ANNUAL") {
      var cutoff365 = now - (365 * 24 * 60 * 60 * 1000);
      return rounds.filter(function(r) { return getRoundTimestamp(r) >= cutoff365; });
    }
    return rounds;
  }

  // localStorage helpers for chart-range toggle state. Device-scoped per
  // existing pb_* convention (pb_theme, pb_liveState). chartId is canonical
  // identifier (e.g. "scoring_trend", "gir_trend", "putts_trend").
  var CHART_RANGE_PREFIX = "pb_chart_range_";
  function getChartRange(chartId, defaultRange) {
    try {
      var stored = localStorage.getItem(CHART_RANGE_PREFIX + chartId);
      if (stored === "30D" || stored === "SEASON" || stored === "ANNUAL") return stored;
    } catch (e) { /* private browsing / quota */ }
    return defaultRange || "30D";
  }
  function setChartRange(chartId, range) {
    try {
      localStorage.setItem(CHART_RANGE_PREFIX + chartId, range);
    } catch (e) { /* silent — device storage failure non-critical */ }
  }

  /* ---------- PUBLIC API ---------- */
  return {
    getPlayer:getPlayer, getPlayers:getPlayers, addPlayer:addPlayer, updatePlayer:updatePlayer, removePlayer:removePlayer,
    getCourse:getCourse, getCourses:getCourses, getCourseByName:getCourseByName, addCourse:addCourse, updateCourse:updateCourse, deleteCourse:deleteCourse, setCoursesFromFirestore:setCoursesFromFirestore, addCourseReview:addCourseReview, searchCourses:searchCourses,
    getRounds:getRounds, getPlayerRounds:getPlayerRounds, getCourseRounds:getCourseRounds, addRound:addRound, deleteRound:deleteRound, setRoundsFromFirestore:setRoundsFromFirestore,
    getTrips:getTrips, getTrip:getTrip, addTrip:addTrip, addTripFromFirestore:addTripFromFirestore, updateTrip:updateTrip, addTripPhoto:addTripPhoto,
    getScores:getScores, setScore:setScore,
    getFirGir:getFirGir, setFir:setFir, setGir:setGir, getFirGirTotals:getFirGirTotals,
    getMiniWinner:getMiniWinner, setMiniWinner:setMiniWinner, getBonusWinner:getBonusWinner, setBonusWinner:setBonusWinner,
    getScrambleTeams:getScrambleTeams, addScrambleTeam:addScrambleTeam, addScrambleTeamFromFirestore:addScrambleTeamFromFirestore, addScrambleMatch:addScrambleMatch,
    getRecords:getRecords, setRecord:setRecord,
    calcStableford:calcStableford, calcHandicap:calcHandicap, getHandicapDetails:getHandicapDetails,
    getPlayerAvg:getPlayerAvg, getPlayerBest:getPlayerBest, getDisplayName:getDisplayName, getUniqueCourses:getUniqueCourses, normCourseName:normCourseName, getAllPlayerIds:getAllPlayerIds,
    getTripStableford:getTripStableford, getTripTotal:getTripTotal,
    getMiniPoints:getMiniPoints, getBonusPoints:getBonusPoints, getTripPoints:getTripPoints,
    daysUntil:daysUntil, generateRoundCommentary:generateRoundCommentary, getActivity:getActivity, getAchievements:getAchievements, getPlayerXP:getPlayerXP, getPlayerLevel:getPlayerLevel, getPlayerXPForDisplay:getPlayerXPForDisplay, calcXPFromRounds:calcXPFromRounds, calcLevelFromXP:calcLevelFromXP,
    createChallenge:createChallenge, getChallenges:getChallenges, updateChallenge:updateChallenge,
    addNotification:addNotification, getNotifications:getNotifications, markNotificationRead:markNotificationRead, getUnreadCount:getUnreadCount,
    getSeasonStandings:getSeasonStandings,
    getCurrentSeason:getCurrentSeason,
    SEASON_CONFIG:SEASON_CONFIG,
    addPost:addPost, getPlayerPosts:getPlayerPosts,
    exportBackup:exportBackup, importBackup:importBackup, reset:reset, save:save, load:load, setScoreSilent:setScoreSilent,
    setMiniWinnerSilent:function(id,pid){state.miniWinners[id]=pid;},
    setBonusWinnerSilent:function(id,pid){state.bonusWinners[id]=pid;},
    getState:function(){return state;},
    // v8.14.4 — trend-chart time-range helpers (P17)
    filterRoundsByRange:filterRoundsByRange, getChartRange:getChartRange, setChartRange:setChartRange
  };
})();
