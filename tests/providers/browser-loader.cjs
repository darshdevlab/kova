/* eslint-disable @typescript-eslint/no-require-imports -- Webpack invokes this test-only loader as CommonJS. */
const ts = require('typescript');
module.exports = function(source) {
  if (this.resourcePath.endsWith('.css')) {
    const classes = Object.fromEntries([...source.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(match => [match[1], match[1]]));
    return `const style=document.createElement('style');style.textContent=${JSON.stringify(source)};document.head.appendChild(style);module.exports=${JSON.stringify(classes)};`;
  }
  return ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
};
