// Keep servers and Chromium in one process tree, including isolated-network runners.
import {createServer} from 'vite';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const current=fileURLToPath(new URL('..',import.meta.url));
if(!process.env.BASELINE_ROOT)throw new Error('Set BASELINE_ROOT to the application directory in a checkout of main 570a217.');
const baseline=resolve(process.env.BASELINE_ROOT);
const expected='570a2174fc42c472c775414265f5fc320e6ede0c';
if(execFileSync('git',['rev-parse','HEAD'],{cwd:baseline,encoding:'utf8'}).trim()!==expected)throw new Error('Baseline must be the recorded production merge.');
execFileSync('git',['diff','HEAD','--exit-code','--','.'],{cwd:baseline,stdio:'pipe'});
const servers=[];
try{
 for(const [root,port]of [[current,5173],[baseline,5174]]){
  const server=await createServer({root,server:{host:'127.0.0.1',port,strictPort:true},define:{'import.meta.env.VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL':JSON.stringify(`http://127.0.0.1:${port}/__mock_subscribe`)}});
  await server.listen();servers.push(server);
 }
 const child=spawn(process.execPath,[process.env.JIF_BROWSER_SCRIPT||'scripts/verify-source-disclosure.mjs'],{cwd:current,stdio:'inherit',env:process.env});
 process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code??1));});
}finally{for(const server of servers)await server.close();}
