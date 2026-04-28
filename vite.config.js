import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, readdirSync } from 'fs';

var CORE_FILES = ['utils.js', 'theme.js', 'animate.js', 'handicap.js', 'firebase.js', 'data.js', 'sync.js', 'parcoins.js', 'weather.js', 'caddie.js', 'charts.js', 'analytics.js', 'transitions.js', 'router.js', 'page-shell.js', 'bottomsheet.js', 'haptics.js', 'loading.js'];

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
  'watchround.js', 'shop.js', 'wagers.js', 'social.js', 'bounties.js', 'richlist.js', 'roundhistory.js', 'leagues.js', 'findplayers.js', 'drills.js'
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
  plugins: [
    coreScriptsPlugin(),
    // Inline CSS into HTML — produces a single self-contained file
    // like the original index.html. No external CSS to fail loading.
    {
      name: 'inline-everything',
      enforce: 'post',
      generateBundle: function(options, bundle) {
        var cssCode = '';
        var jsEntryKey = null;
        // Collect CSS and find the JS entry to remove
        Object.keys(bundle).forEach(function(key) {
          if (key.endsWith('.css')) {
            cssCode += bundle[key].source;
            delete bundle[key];
          }
          if (key.endsWith('.js') && bundle[key].type === 'chunk' && bundle[key].isEntry) {
            jsEntryKey = key;
          }
        });
        // Inline CSS into HTML, remove the JS module entry (our plugin handles JS)
        Object.keys(bundle).forEach(function(key) {
          if (key.endsWith('.html') && bundle[key].type === 'asset') {
            var html = bundle[key].source;
            // Remove external CSS link
            html = html.replace(/<link rel="stylesheet"[^>]*>/g, '');
            // Remove Vite JS module entry (our coreScriptsPlugin already inlines JS)
            html = html.replace(/<script[^>]*type="module"[^>]*><\/script>/g, '');
            html = html.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g, '');
            // Remove Vite's bare crossorigin attributes (without ="anonymous")
            // but KEEP crossorigin="anonymous" on external scripts
            html = html.replace(/ crossorigin(?!=)/g, '');
            // Inject CSS as inline style tag right before </head>
            html = html.replace('</head>', '<style>' + cssCode + '</style>\n</head>');
            bundle[key].source = html;
          }
        });
        // Remove the JS entry file from output (not needed — JS is inlined by plugin)
        if (jsEntryKey) delete bundle[jsEntryKey];
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  }
});
