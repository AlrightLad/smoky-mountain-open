import io, os, re, glob

# Collect registered routes + containers (valid Router.go targets)
idx = io.open('index.html', encoding='utf-8', errors='ignore').read()
containers = set(re.findall(r'data-page="([a-z0-9-]+)"', idx))

src_files = glob.glob('src/**/*.js', recursive=True)
allsrc = {}
for f in src_files:
    allsrc[f] = io.open(f, encoding='utf-8', errors='ignore').read()
blob = "\n".join(allsrc.values())

routes = set(re.findall(r'Router\.register\(["\']([a-z0-9-]+)["\']', blob))
valid_targets = containers | routes

# 1. Router.go('X') / Router.go("X") literal targets — flag any with no container+route
go_targets = set(re.findall(r'Router\.go\(["\']([a-z0-9-]+)["\']', blob))
dead_routes = sorted(t for t in go_targets if t not in valid_targets)

# 2. onclick="fn(...)" global function calls — flag fn not defined anywhere.
#    Collect all defined function names (declarations + window.fn = + var fn = function).
defined = set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', blob))
defined |= set(re.findall(r'\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function', blob))
defined |= set(re.findall(r'window\.([A-Za-z_$][\w$]*)\s*=', blob))
defined |= set(re.findall(r'\b([A-Za-z_$][\w$]*)\s*:\s*function', blob))  # object-method/PB.*
# Browser/global builtins that legitimately appear in onclick
BUILTINS = {'Router','PB','event','window','document','console','Math','JSON','Object',
            'Array','String','Number','Boolean','Date','this','alert','confirm','prompt',
            'parseInt','parseFloat','setTimeout','localStorage','sessionStorage','firebase',
            'navigator','location','history','db','auth','currentUser','currentProfile',
            'pbConfirm','pbPrompt','pbCelebrate','return','if','else','var','true','false','null'}

# Extract the leading call token from each onclick/onkeydown handler
handler_calls = re.findall(r'on(?:click|keydown|change|input|submit)="([^"]*)"', blob)
unknown = {}
for h in handler_calls:
    # split on ; and pull bare fn-call tokens   foo(  or  foo.bar(
    for m in re.finditer(r'(?:^|[;{}\s>])([A-Za-z_$][\w$]*)\s*\(', h):
        fn = m.group(1)
        if fn in BUILTINS or fn in defined: continue
        # method calls like Router.go handled by BUILTINS; obj.method( -> check obj
        unknown.setdefault(fn, 0)
        unknown[fn] += 1

# Filter unknowns that are actually defined as PB.x or object props won't be caught;
# treat anything appearing as "X." somewhere as a known namespace object.
namespaces = set(re.findall(r'\b([A-Za-z_$][\w$]*)\.[A-Za-z_$]', blob))
real_unknown = {k:v for k,v in unknown.items() if k not in namespaces}

print("=== Router.go targets with NO route/container (dead nav):")
print("  " + (", ".join(dead_routes) if dead_routes else "(none)"))
print()
print("=== onclick handler functions NOT defined anywhere (dead controls):")
if real_unknown:
    for k in sorted(real_unknown, key=lambda x:-real_unknown[x]):
        print("  %-32s x%d" % (k, real_unknown[k]))
else:
    print("  (none)")
