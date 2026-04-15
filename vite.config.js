import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, readdirSync } from 'fs';

var CORE_FILES = ['utils.js', 'firebase.js', 'theme.js', 'data.js', 'sync.js', 'router.js'];

// Pages needed for initial render (home + settings reachable from nav)
var IMMEDIATE_PAGES = ['home.js', 'settings.js', 'onboarding.js'];

// Pages loaded after initial render (deferred for faster first paint)
var DEFERRED_PAGES = [
  'merch.js', 'rules.js', 'members.js', 'scramble.js', 'aces.js',
  'playnow.js', 'standings.js', 'challenges.js', 'trips.js',
  'scorecard.js', 'rounds.js', 'courses.js', 'records.js',
  'teetimes.js', 'range.js', 'activity.js', 'rangelive.js', 'calendar.js',
  'more.js', 'feed.js', 'chat.js', 'dms.js', 'invite.js', 'admin.js',
  'faq.js', 'caddynotes.js', 'trophyroom.js', 'partygames.js',
  'syncround.js', 'scramblelive.js', 'seasonrecap.js', 'awards.js',
  'watchround.js'
];

var PAGE_FILES = IMMEDIATE_PAGES.concat(DEFERRED_PAGES);

function coreScriptsPlugin() {
  var isBuild = false;
  return {
    name: 'parbaughs-core-scripts',
    configResolved: function(config) {
      isBuild = config.command === 'build';
    },
    configureServer: function(server) {
      server.middlewares.use(function(req, res, next) {
        var match;
        if (req.url && (match = req.url.match(/^\/(core|pages)\/(.+\.js)$/))) {
          var filePath = resolve('src', match[1], match[2]);
          try {
            var content = readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(content);
          } catch(e) {
            next();
          }
        } else {
          next();
        }
      });
    },
    transformIndexHtml: function() {
      if (isBuild) {
        var coreCode = CORE_FILES.map(function(f) {
          return readFileSync(resolve('src/core', f), 'utf-8');
        }).join('\n');
        var immediateCode = IMMEDIATE_PAGES.map(function(f) {
          return readFileSync(resolve('src/pages', f), 'utf-8');
        }).join('\n');
        var deferredCode = DEFERRED_PAGES.map(function(f) {
          return readFileSync(resolve('src/pages', f), 'utf-8');
        }).join('\n');
        return [
          { tag: 'script', children: coreCode + '\n' + immediateCode, injectTo: 'body' },
          { tag: 'script', attrs: { defer: true }, children: deferredCode, injectTo: 'body' }
        ];
      } else {
        var coreTags = CORE_FILES.map(function(f) {
          return { tag: 'script', attrs: { src: '/core/' + f }, injectTo: 'body' };
        });
        var immediateTags = IMMEDIATE_PAGES.map(function(f) {
          return { tag: 'script', attrs: { src: '/pages/' + f }, injectTo: 'body' };
        });
        var deferredTags = DEFERRED_PAGES.map(function(f) {
          return { tag: 'script', attrs: { src: '/pages/' + f, defer: true }, injectTo: 'body' };
        });
        return coreTags.concat(immediateTags).concat(deferredTags);
      }
    }
  };
}

export default defineConfig({
  base: '/smoky-mountain-open/',
  root: '.',
  publicDir: 'public',
  plugins: [coreScriptsPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'app.html')
    }
  }
});
