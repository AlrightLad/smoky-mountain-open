// ESM helper: load a vanilla-JS source file (script-tag style, no exports)
// and expose its top-level bindings as an object.
//
// PARBAUGHS uses `var` declarations in src/core/*.js loaded via Vite's
// CORE_FILES bundle as plain script tags. To unit-test the pure functions,
// we eval the file in a Node vm sandbox + collect the named bindings.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function loadSource(relPath, exportNames, stubs = {}) {
  const abs = path.resolve(process.cwd(), relPath);
  const code = fs.readFileSync(abs, 'utf8');
  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseFloat,
    parseInt,
    isNaN,
    Number,
    String,
    Array,
    Object,
    Promise,
    db: stubs.db || null,
    auth: stubs.auth || null,
    firebase: stubs.firebase || {
      firestore: {
        FieldValue: {
          increment: (n) => ({ __op: 'increment', value: n }),
        },
      },
    },
    currentUser: stubs.currentUser || null,
    currentProfile: stubs.currentProfile || null,
    fbMemberCache: stubs.fbMemberCache || {},
    pbLog: stubs.pbLog || (() => {}),
    pbWarn: stubs.pbWarn || (() => {}),
    pbError: stubs.pbError || (() => {}),
    Router: stubs.Router || { toast: () => {} },
    fsTimestamp: stubs.fsTimestamp || (() => Date.now()),
    localDateStr: stubs.localDateStr || (() => new Date().toISOString().slice(0, 10)),
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: relPath });
  const result = {};
  for (const name of exportNames) {
    if (!(name in sandbox)) {
      const available = Object.keys(sandbox).filter(k => typeof sandbox[k] === 'function').join(', ');
      throw new Error(`loadSource: "${name}" not found in ${relPath}. Available functions: ${available}`);
    }
    result[name] = sandbox[name];
  }
  return result;
}
