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
 const wait=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await sleep(100)}throw Error('Timed out: '+expression)}
 const navigate=async route=>{await call('Page.navigate',{url:origin+route});await sleep(500);await wait('document.querySelector("main h1") && document.querySelector("main").innerText.length > 150');await sleep(250)}
 const click=async(text,selector='button')=>{const result=await evaluate('(()=>{const el=[...document.querySelectorAll('+JSON.stringify(selector)+')].find(e=>e.textContent.trim()==='+JSON.stringify(text)+');if(!el)return false;el.click();return true})()');assert.ok(result,'Missing control: '+text);await sleep(150)}
 const set=async(selector,value)=>{await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Input missing");Object.getOwnPropertyDescriptor(el.tagName==="SELECT"?HTMLSelectElement.prototype:el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');await sleep(100)}
 const record=title=>steps.push(title)
 const routes=['/admin','/admin/products','/admin/orders','/admin/users','/admin/reviews','/admin/notices','/admin/events','/admin/ai-logs']
 for(const route of routes){await navigate(route);const text=await evaluate('document.querySelector("main").innerText');assert.ok(!text.includes('불러오지 못했습니다'),route+' load failure');record('render '+route);fs.writeFileSync(path.join(out,route.split('/').pop()||'admin')+'.txt',text)}

 // Real UI mutations are restricted to the isolated demo browser store.
 const persisted=async()=>evaluate('JSON.parse(localStorage.getItem("jajak_portfolio_demo_v1"))?.data')
 const clickSelector=async selector=>{await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await sleep(180)}
 await click('데모 데이터 초기화');await click('초기화','dialog button')
 await navigate('/admin/products')
 await set('main input[type="search"]','존재하지않는가상상품')
 assert.equal(await evaluate('document.querySelectorAll("main tbody tr").length'),0)
 record('product search empty state')
 await click('초기화','main button')
 const beforePage=await evaluate('document.querySelector("main tbody").innerText')
 await clickSelector('button[aria-label="다음 페이지"]')
 assert.notEqual(await evaluate('document.querySelector("main tbody").innerText'),beforePage)
 record('product pagination')
 await click('+ 새 상품 등록')
 await set('#create-product-id','demo_browser_product');await set('#create-product-name','가상 브라우저 상품');await set('#create-product-price','23000');await set('#create-product-stock','9')
 await click('다음 >','main aside button');await set('#create-brand','가상 제조사');await click('다음 >','main aside button')
 const demoImage='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="green"/></svg>'
 await evaluate('(()=>{const svg='+JSON.stringify(demoImage)+';document.querySelectorAll("main aside input[type=file]").forEach(el=>{const dt=new DataTransfer();dt.items.add(new File([svg],"demo.svg",{type:"image/svg+xml"}));el.files=dt.files;el.dispatchEvent(new Event("change",{bubbles:true}));})})()')
 await sleep(500);await click('다음 >','main aside button');await click('상품 등록','main aside button')
 assert.ok((await persisted()).products.some(p=>p.productId==='demo_browser_product'))
 record('product creation with generated local images')
 await set('main input[type="search"]','가상 브라우저 상품');await click('수정','main tbody button')
 await set('main aside input[type="number"]','24000')
 for(let i=0;i<3;i++)await click('다음 >','main aside button')
 await click('저장','main aside button')
 assert.equal((await persisted()).products.find(p=>p.productId==='demo_browser_product').price,24000)
 await navigate('/admin/products');await set('main input[type="search"]','가상 브라우저 상품')
 assert.ok((await evaluate('document.querySelector("main tbody").innerText')).includes('24,000'))
 record('product edit persists across reload')
 await click('수정','main tbody button');for(let i=0;i<3;i++)await click('다음 >','main aside button');await click('상품 삭제','main aside button')
 assert.ok(!(await persisted()).products.some(p=>p.productId==='demo_browser_product'));record('product delete')
 await navigate('/admin/notices');await click('+ 새 공지 등록');await set('input[placeholder="공지 제목을 입력하세요"]','가상 브라우저 공지');await set('textarea[placeholder="공지사항 본문을 입력하세요..."]','가상 본문입니다.');await click('등록하기','main aside button')
 const notice=(await persisted()).notices.find(n=>n.title==='가상 브라우저 공지');assert.ok(notice);record('notice create')
 await set('main input[type="search"]','가상 브라우저 공지');await click('수정하기','main tbody button');await set('input[placeholder="공지 제목을 입력하세요"]','가상 공지 수정 완료');await click('저장하기','main aside button');assert.equal((await persisted()).notices.find(n=>n.id===notice.id).title,'가상 공지 수정 완료');record('notice edit')
 await set('main input[type="search"]','가상 공지 수정 완료');await click('수정하기','main tbody button');await click('공지 삭제','main aside button');assert.ok(!(await persisted()).notices.some(n=>n.id===notice.id));record('notice delete')
 await navigate('/admin/orders');const beforeShipped=(await persisted()).orders.filter(o=>o.status==='shipped').length
 await evaluate('[...document.querySelectorAll("main tbody tr")].find(row=>row.innerText.includes("배송 중")).querySelector("button").click()');await sleep(200);await click('배송 완료','main aside button');assert.equal((await persisted()).orders.filter(o=>o.status==='shipped').length,beforeShipped-1);record('order delivery state change')
 await navigate('/admin/reviews');await click('상세 보기','main tbody button');const beforeReviews=(await persisted()).reviews.filter(r=>r.status==='visible').length;await click('다시 게시','main aside button');assert.equal((await persisted()).reviews.filter(r=>r.status==='visible').length,beforeReviews+1);record('review visibility')
 await navigate('/admin/ai-logs');await set('main select','guest');assert.ok((await evaluate('document.querySelector("main tbody").innerText')).includes('가상 게스트'));record('AI log filter without API')
 await click('데모 데이터 초기화');await click('취소','dialog button');assert.equal(await evaluate('document.querySelector("dialog").open'),false);await click('데모 데이터 초기화');await click('초기화','dialog button');assert.equal((await persisted()).reviews.filter(r=>r.status==='visible').length,19);assert.equal((await persisted()).orders.filter(o=>o.status==='shipped').length,5);record('reset cancel and confirm restores seed')
 await navigate('/admin');await sleep(300)
 const desktop=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'desktop.png'),Buffer.from(desktop.data,'base64'))
 for(const width of [390,320]){await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});for(const route of routes){await navigate(route);assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),width+' overflow '+route)}record('mobile routes '+width+'px')}
 assert.ok(await evaluate('(()=>{const el=document.querySelector('+JSON.stringify('button[aria-label="관리자 메뉴 열기"]')+');const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()'),'Mobile menu must be visible and clickable')
 await clickSelector('button[aria-label="관리자 메뉴 열기"]');assert.equal(await evaluate('document.querySelector('+JSON.stringify('button[aria-label="관리자 메뉴 열기"]')+').getAttribute("aria-expanded")'),'true');await clickSelector('button[aria-label="관리자 메뉴 닫기"]');record('mobile navigation open and close')
 const mobile=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'mobile.png'),Buffer.from(mobile.data,'base64'))

 const image=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'last-view.png'),Buffer.from(image.data,'base64'))
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({steps,errors,external,failures,requests},null,2))
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failures,[])
 console.log(JSON.stringify({steps,consoleErrors:errors.length,externalRequests:external.length,failedResponses:failures.length,requestCount:requests.length},null,2))
 await call('Browser.close')
}catch(error){console.error(error);console.error(JSON.stringify({errors,external,failures,steps},null,2));if(debugEvaluate)console.error(await debugEvaluate('document.body.innerText'));process.exitCode=1}finally{socket?.close();chrome.kill()}
