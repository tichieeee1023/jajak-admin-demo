import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'test-results')
fs.mkdirSync(out,{recursive:true})
const origin='http://127.0.0.1:4175',debugPort=9337
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--disable-background-networking','--disable-component-update','--disable-sync','--disable-domain-reliability','--disable-default-apps','--no-first-run','--no-default-browser-check','--remote-debugging-port='+debugPort,'--user-data-dir='+path.join(out,'chrome-profile'),'--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','about:blank'],{windowsHide:true,stdio:'ignore'})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
let socket, debugEvaluate
const errors=[],external=[],requests=[],failures=[],steps=[]
try{
 let endpoint;for(let i=0;i<60;i++){try{const tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json')).json();endpoint=tabs.find(t=>t.type==='page')?.webSocketDebuggerUrl;if(endpoint)break}catch{}await sleep(100)}
 if(!endpoint)throw Error('Isolated Chrome did not start')
 socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject})
 let serial=0;const pending=new Map()
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})
 socket.onmessage=async event=>{const msg=JSON.parse(event.data);if(msg.id){const waiter=pending.get(msg.id);if(waiter){pending.delete(msg.id);msg.error?waiter.reject(Error(JSON.stringify(msg.error))):waiter.resolve(msg.result)}return}
 if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.exception?.description??msg.params.exceptionDetails.text)
 if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error')errors.push(msg.params.args.map(a=>a.value??a.description).join(' '))
 if(msg.method==='Network.requestWillBeSent')requests.push({url:msg.params.request.url,type:msg.params.type})
 if(msg.method==='Network.responseReceived'&&msg.params.response.status>=400)failures.push(msg.params.response.url+' '+msg.params.response.status)
 if(msg.method==='Fetch.requestPaused'){const {requestId,request}=msg.params;const allowed=request.url.startsWith(origin+'/')||/^(data:|blob:|about:)/.test(request.url);if(!allowed){external.push(request.url);await call('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'})}else await call('Fetch.continueRequest',{requestId})}
 if(msg.method==='Page.javascriptDialogOpening')await call('Page.handleJavaScriptDialog',{accept:true})
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]})
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value}
 debugEvaluate=evaluate
 const wait=async expression=>{for(let i=0;i<80;i++){if(await evaluate('Boolean('+expression+')'))return;await sleep(100)}throw Error('Timed out: '+expression)}
 const navigate=async route=>{await call('Page.navigate',{url:origin+route});await sleep(500);await wait('document.querySelector("main h1") && document.querySelector("main").innerText.length > 150');await sleep(250)}
 const click=async(text,selector='button')=>{const result=await evaluate('(()=>{const el=[...document.querySelectorAll('+JSON.stringify(selector)+')].find(e=>e.textContent.trim()==='+JSON.stringify(text)+');if(!el)return false;el.click();return true})()');assert.ok(result,'Missing control: '+text);await sleep(150)}
 const set=async(selector,value)=>{await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Input missing");Object.getOwnPropertyDescriptor(el.tagName==="SELECT"?HTMLSelectElement.prototype:el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');await sleep(100)}
 const record=title=>steps.push(title)

 const routes=['/admin','/admin/products','/admin/orders','/admin/users','/admin/reviews','/admin/notices','/admin/events','/admin/ai-logs']
 await navigate('/')
 assert.equal(await evaluate('location.pathname'),'/admin')
 record('root redirects to admin')
 for(const route of routes){
  await navigate(route)
  assert.equal(await evaluate('location.pathname'),route)
  const title=await evaluate('document.querySelector("main h1").textContent')
  await call('Page.reload',{ignoreCache:true});await sleep(500)
  await wait('document.querySelector("main h1")')
  assert.equal(await evaluate('location.pathname'),route)
  assert.equal(await evaluate('document.querySelector("main h1").textContent'),title)
  record('direct navigation and reload '+route)
 }
 await navigate('/admin')
 const bannerCloseExpression='document.querySelector('+JSON.stringify('button[aria-label="데모 안내 닫기"]')+')'
 const heightBeforeDismiss=await evaluate('document.querySelector("main").getBoundingClientRect().height')
 await evaluate(bannerCloseExpression+'.click()')
 await wait('!'+bannerCloseExpression)
 assert.ok(await evaluate('document.querySelector("main").getBoundingClientRect().height')>heightBeforeDismiss)
 await evaluate('document.querySelector('+JSON.stringify('nav a[href="/admin/products"]')+').click()')
 await wait('location.pathname==="/admin/products" && document.querySelector("main h1")?.textContent==="상품 관리"')
 assert.equal(await evaluate('Boolean('+bannerCloseExpression+')'),false)
 await call('Page.reload',{ignoreCache:true});await sleep(400)
 await wait(bannerCloseExpression)
 record('banner dismiss expands content, stays dismissed across navigation and resets on reload')
 const notFound=async route=>{
  await call('Page.navigate',{url:origin+route});await sleep(400)
  await wait('document.querySelector("#not-found-title")')
  assert.equal(await evaluate('location.pathname'),route)
  assert.equal(await evaluate('document.querySelector("#not-found-title").textContent'),'페이지를 찾을 수 없습니다.')
  assert.ok(await evaluate('document.title.startsWith("404")'))
 }
 for(const route of ['/missing-demo-page','/admin/missing-page','/404']){
  await notFound(route)
  await call('Page.reload',{ignoreCache:true});await sleep(400)
  await wait('document.querySelector("#not-found-title")')
  assert.equal(await evaluate('location.pathname'),route)
  record('unknown URL keeps path and renders 404 '+route)
 }
 const desktop=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'not-found-desktop.png'),Buffer.from(desktop.data,'base64'))
 await click('이전 화면')
 await wait('location.pathname==="/admin" && document.querySelector("main h1")')
 record('back button on direct entry safely returns to admin')
 for(const width of [390,320]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true})
  await notFound('/admin/missing-page')
  await evaluate(bannerCloseExpression+'.click()')
  await wait('!'+bannerCloseExpression)
  assert.ok(await evaluate('Boolean(document.querySelector("#not-found-title"))'))
  record('mobile banner dismiss '+width+'px')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
  const homeSelector='main a[href="/admin"]'
  await evaluate('document.querySelector('+JSON.stringify(homeSelector)+').focus()')
  assert.equal(await evaluate('document.activeElement.tagName'),'A')
  await evaluate('document.querySelector('+JSON.stringify(homeSelector)+').click()')
  await wait('location.pathname==="/admin" && document.querySelector("main h1")')
  record('mobile 404 and home recovery '+width+'px')
 }
 await notFound('/missing-demo-page')
 const mobile=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'not-found-mobile.png'),Buffer.from(mobile.data,'base64'))
 fs.writeFileSync(path.join(out,'routing-result.json'),JSON.stringify({steps,errors,external,failures,requests},null,2))
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failures,[])
 console.log(JSON.stringify({steps,consoleErrors:errors.length,externalRequests:external.length,failedResponses:failures.length,requestCount:requests.length},null,2))
 await call('Browser.close')
}catch(error){console.error(error);console.error(JSON.stringify({errors,external,failures,steps},null,2));if(debugEvaluate)console.error(await debugEvaluate('document.body.innerText'));process.exitCode=1}finally{socket?.close();chrome.kill()}
