const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX}}).outputText;
const loaded = new Map();
function load(file) {
 if (loaded.has(file)) return loaded.get(file);
 const exports = {};
 loaded.set(file, exports);
 vm.runInNewContext(compile(file), {exports, require: name => {
  if (name.startsWith('.')) return load(path.posix.join(path.posix.dirname(file), name) + '.ts');
  return require(name);
 }});
 return exports;
}
const matcherExports = load('lib/columnSearch.ts');
const {columnMatchesSearch} = matcherExports;
const names = {columnNames:true,columnDescriptions:false,columnDataTypes:false};
const descriptions = {...names,columnNames:false,columnDescriptions:true};
const types = {...names,columnNames:false,columnDataTypes:true};
const base = {SchemaName:'dmvp_Forum',DisplayName:'Forum',Description:'Discussion forum',IsCustomAttribute:true,IsStandardFieldModified:false};
const text = {...base,AttributeType:'StringAttribute',Format:'Rich Text',MaxLength:2000};
const date = {...base,SchemaName:'dmvp_Start',DisplayName:'Start',AttributeType:'DateTimeAttribute',Format:'Date',Behavior:'DateOnly'};
const choice = {...base,SchemaName:'dmvp_Category',DisplayName:'Category',Description:null,AttributeType:'ChoiceAttribute',Type:'Multi',Options:[{Name:'Selected',Value:1}]};
assert.equal(columnMatchesSearch(text,'forum',types),false,'Data types must not search names/descriptions');
assert.equal(columnMatchesSearch(text,'discussion',names),false,'Names scope must not search descriptions');
assert.equal(columnMatchesSearch(text,'discussion',descriptions),true);
assert.equal(columnMatchesSearch(text,'rich',types),true);
assert.equal(columnMatchesSearch(text,'text',types),true);
assert.equal(columnMatchesSearch(date,'Date - DateOnly',types),true);
assert.equal(columnMatchesSearch({...date,Format:'Date & time'},'date & time',types),true);
assert.equal(columnMatchesSearch(choice,'choice',types),true);
assert.equal(columnMatchesSearch(choice,'multi-select',types),true);
assert.equal(columnMatchesSearch({...choice,Type:'Single'},'single-select',types),true);
assert.equal(columnMatchesSearch(choice,'selected',names),false);
assert.equal(columnMatchesSearch(choice,'selected',types),true);
const details = [
 [text, ['2000', '2.000', '(2.000)', 'rich text']],
 [{...date, Behavior:'TimeZoneIndependent'}, ['timezoneindependent']],
 [{...base, AttributeType:'IntegerAttribute', Format:'Whole Number', MinValue:-2147483648, MaxValue:2147483647}, ['whole number', 'min to max']],
 [{...base, AttributeType:'IntegerAttribute', Format:'Duration', MinValue:-1200, MaxValue:3500}, ['-1200', '-1.200', '3500', '3.500']],
 [{...base, AttributeType:'DecimalAttribute', Type:'Decimal', MinValue:-1250.5, MaxValue:9876.25, Precision:3}, ['-1250.5', '-1.250,5', '9876.25', '9.876,25', 'precision: 3']],
 [{...base, AttributeType:'DecimalAttribute', Type:'Money', MinValue:-922337203685477, MaxValue:922337203685477, Precision:2}, ['money', 'min to max', 'precision: 2']],
 [{...base, AttributeType:'FileAttribute', MaxSize:32768}, ['file', '32768', '32.768kb', 'max 32.768kb']],
 [{...choice, DefaultValue:123456, Options:[{Name:'Selected', Value:123456, Description:'Ready for launch'}]}, ['123456', '123.456', 'ready for launch', 'default: selected']],
 [{...base, AttributeType:'StatusAttribute', Options:[{Name:'Ready', Value:123456, State:'Active'}]}, ['state/status', 'active', '123456', '123.456']],
 [{...base, AttributeType:'LookupAttribute', Targets:[{Name:'dmvp_Planet'}]}, ['lookup', 'dmvp_planet']],
 [{...base, AttributeType:'BooleanAttribute', TrueLabel:'Enabled', FalseLabel:'Disabled', DefaultValue:false}, ['boolean', 'true', 'false', 'enabled', 'default: disabled']],
 [{...base, AttributeType:'GenericAttribute', Type:'Uniqueidentifier'}, ['uniqueidentifier']],
];
for (const [attribute, queries] of details) {
 for (const query of queries) {
  assert.equal(columnMatchesSearch(attribute, query, types), true, `${attribute.AttributeType}: ${query}`);
  assert.equal(columnMatchesSearch(attribute, query, names), false, `Type value leaked into names: ${query}`);
  assert.equal(columnMatchesSearch(attribute, query, descriptions), false, `Type value leaked into descriptions: ${query}`);
 }
}
const {renderToStaticMarkup} = require('react-dom/server');
const {highlightMatch, highlightTypeMatch} = load('lib/searchHighlight.tsx');
for (const [value, query, expected] of [
 ['(2.000)', '2000', '2.000'], ['(2.000)', '200', '2.00'], ['(2.000)', '2.000', '2.000'],
 ['(-1.250,5 to 9.876,25)', '-1250.5', '-1.250,5'],
 ['(Max 32.768KB)', '32768', '32.768'], ['TimeZoneIndependent', ' timezoneindependent ', 'TimeZoneIndependent'],
]) assert.match(renderToStaticMarkup(highlightTypeMatch(value, query)), new RegExp(`<mark[^>]*>${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</mark>`));
assert.match(renderToStaticMarkup(highlightMatch('Synthetic table description', 'TABLE')), /<mark[^>]*>table<\/mark>/);
assert.equal(highlightMatch('Description', ''), 'Description');
assert.equal(highlightTypeMatch('(2.000)', '999'), '(2.000)');
const messages=[];
const worker={postMessage:message=>messages.push(message)};
vm.runInNewContext(compile('components/datamodelview/searchWorker.ts'), {exports:{},self:worker,setTimeout,require:name=>{assert.equal(name,'@/lib/columnSearch');return matcherExports;}});
(async()=>{
 await worker.onmessage({data:{type:'init',groups:[{Name:'Playground',Entities:[{SchemaName:'dmvp_Project',DisplayName:'Project',Description:null,Attributes:[text,date,choice],Relationships:[],SecurityRoles:[]}]}]}});
 for(const [query,scope,expected] of [['forum',types,[]],['discussion',names,[]],['rich',types,['dmvp_Forum']],['Date - DateOnly',types,['dmvp_Start']],['multi-select',types,['dmvp_Category']],['nomatches',types,[]]]) {
  messages.length=0;
  await worker.onmessage({data:{type:'search',data:query,searchScope:scope,requestId:42}});
  assert.equal(messages.at(-1).complete,true,`${query}: completion required even without results`);
  assert.equal(messages.at(-1).requestId,42);
  const rows=messages.flatMap(message=>message.data||[]).filter(item=>item.type==='attribute').map(item=>item.attribute.SchemaName);
  assert.deepEqual(Array.from(rows),expected,query);
 }
 for (const [index, [attribute, queries]] of details.entries()) {
  await worker.onmessage({data:{type:'init',groups:[{Name:'Playground',Entities:[{SchemaName:'dmvp_Project',DisplayName:'Project',Description:'Synthetic table description',Attributes:[attribute],Relationships:[],SecurityRoles:[]}]}]}});
  for (const query of queries) {
   messages.length=0;
   await worker.onmessage({data:{type:'search',data:query,searchScope:types,requestId:index}});
   assert.equal(messages.at(-1).complete,true);
   assert.equal(messages.flatMap(message=>message.data||[]).filter(item=>item.type==='attribute').length,1, `Worker: ${query}`);
  }
 }
 for (const enabled of [true, false]) {
  messages.length=0;
  await worker.onmessage({data:{type:'search',data:'synthetic table description',searchScope:{columnNames:false,columnDescriptions:false,columnDataTypes:false,tableDescriptions:enabled},requestId:99}});
  assert.equal(messages.flatMap(message=>message.data||[]).filter(item=>item.type==='entity').length,enabled ? 1 : 0);
 }
 console.log('PASS: scoped matching and worker results for all 10 column types, raw/formatted numbers, empty results, table descriptions, and highlight markup');
})().catch(error=>{console.error(error);process.exitCode=1;});
