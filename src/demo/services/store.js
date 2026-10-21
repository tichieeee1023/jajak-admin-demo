import {createSeed} from '../data/catalog.js'
export const STORAGE_KEY='jajak_portfolio_demo_v1'
export const demoStore=Object.freeze({mode:'local-only'})
export const demoSession=Object.freeze({currentUser:Object.freeze({uid:'demo_operator',displayName:'데모 운영자',email:'demo-operator@example.invalid'})})
const listeners=new Set()
let warning=''
const clone=value=>JSON.parse(JSON.stringify(value))
function load(){try{const raw=globalThis.localStorage?.getItem(STORAGE_KEY);if(raw){const saved=JSON.parse(raw);const seed=createSeed();if(saved.version===1&&saved.data&&Object.keys(seed).every(k=>Array.isArray(saved.data[k])))return saved.data;warning='저장 형식이 달라 초기 샘플을 표시합니다.'}}catch{warning='브라우저 저장소를 읽지 못해 메모리에서 체험합니다.'}return clone(createSeed())}
let state=load()
export const getStorageWarning=()=>warning
// Timestamp-shaped values are generated locally to preserve the UI's date formatting.
function hydrate(value){if(Array.isArray(value))return value.map(hydrate);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k.endsWith('At')&&typeof v==='string'&&!Number.isNaN(Date.parse(v))?{toDate:()=>new Date(v),toMillis:()=>Date.parse(v)}:hydrate(v)]));return value}
const assertCollection=name=>{if(!Object.hasOwn(state,name))throw Error('Unknown demo collection: '+name)}
export const collection=(_store,...segments)=>({path:segments.join('/'),filters:[]})
export const collectionGroup=(_store,name)=>({group:name,filters:[]})
export const where=(field,operator,value)=>({field,operator,value})
export const query=(reference,...filters)=>({...reference,filters})
export const doc=(_store,...segments)=>({path:segments.slice(0,-1).join('/'),id:segments.at(-1)})
function snapshot(reference){let rows;if(reference.group){rows=Object.entries(state).filter(([key])=>key.endsWith('/'+reference.group)).flatMap(([,items])=>items)}else{assertCollection(reference.path);rows=state[reference.path]}for(const f of reference.filters??[]){if(f.operator!=='==')throw Error('Unsupported demo query');rows=rows.filter(row=>row[f.field]===f.value)}const docs=rows.map(row=>({id:row.id,data:()=>hydrate(clone(row))}));return {docs,size:docs.length,empty:docs.length===0}}
export const getDocs=async reference=>snapshot(reference)
export const getCollection=async name=>{assertCollection(name);return hydrate(clone(state[name]))}
export const getDocument=async (name,id)=>(await getCollection(name)).find(item=>item.id===id)??null
export function onSnapshot(reference,onNext,onError){let active=true;const emit=()=>{if(!active)return;try{onNext(snapshot(reference))}catch(error){onError?.(error)}};listeners.add(emit);queueMicrotask(emit);return ()=>{active=false;listeners.delete(emit)}}
function commit(next){let storage;try{storage=globalThis.localStorage}catch{warning='브라우저 저장소 없이 메모리에서 체험합니다.'}if(storage){try{storage.setItem(STORAGE_KEY,JSON.stringify({version:1,data:next}))}catch(error){throw Error('브라우저 저장 공간이 부족합니다. 작은 이미지를 사용하거나 데모 데이터를 초기화해주세요.',{cause:error})}}state=next;listeners.forEach(emit=>queueMicrotask(emit))}
const now=()=>new Date().toISOString()
export const serverTimestamp=now
export async function setDocument(name,id,data){assertCollection(name);const next=clone(state);const at=next[name].findIndex(item=>item.id===id);const row={...(at<0?{}:next[name][at]),...clone(data),id,updatedAt:now()};if(at<0)next[name].push(row);else next[name][at]=row;commit(next)}
export async function addDocument(name,data){const id='demo_'+crypto.randomUUID();await setDocument(name,id,{...data,createdAt:now()});return id}
export async function updateDocument(name,id,data){assertCollection(name);if(!state[name].some(item=>item.id===id))throw Error('가상 항목을 찾을 수 없습니다.');await setDocument(name,id,data)}
export async function deleteDocument(name,id){assertCollection(name);const next=clone(state);next[name]=next[name].filter(item=>item.id!==id);commit(next)}
export const updateDoc=(reference,data)=>updateDocument(reference.path,reference.id,data)
export const deleteDoc=reference=>deleteDocument(reference.path,reference.id)
export function resetDemo(){commit(clone(createSeed()));warning=''}
