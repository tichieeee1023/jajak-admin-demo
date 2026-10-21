import {lazy,Suspense,useState,useRef} from 'react'
import {Routes,Route,Navigate} from 'react-router-dom'
import {resetDemo,getStorageWarning} from './demo/services/store'
import styles from './demo/DemoShell.module.scss'
const AdminLayout=lazy(()=>import('./pages/Admin/AdminLayout'))
const pages={Dashboard:lazy(()=>import('./pages/Admin/Dashboard')),UserManage:lazy(()=>import('./pages/Admin/UserManage')),ProductManage:lazy(()=>import('./pages/Admin/ProductManage')),OrdersManage:lazy(()=>import('./pages/Admin/OrdersManage')),ReviewManage:lazy(()=>import('./pages/Admin/ReviewManage')),NoticeManage:lazy(()=>import('./pages/Admin/NoticeManage')),EventManage:lazy(()=>import('./pages/Admin/EventManage')),AiLogManage:lazy(()=>import('./pages/Admin/AiLogManage')),AdminErrorContent:lazy(()=>import('./pages/Admin/AdminErrorContent'))}
export default function App(){
 const [generation,setGeneration]=useState(0),[message,setMessage]=useState('')
 const dialogRef=useRef(null)
 const routes=[['users','UserManage'],['products','ProductManage'],['orders','OrdersManage'],['reviews','ReviewManage'],['notices','NoticeManage'],['events','EventManage'],['ai-logs','AiLogManage'],['error','AdminErrorContent']]
 function handleReset(){try{resetDemo();setGeneration(n=>n+1);dialogRef.current.close();setMessage('가상 데이터를 초기 상태로 되돌렸습니다.')}catch(error){setMessage(error.message)}}
 return <div className={styles.shell}><div className={styles.banner}><div><strong>포트폴리오 체험용 데모 · 모든 데이터는 가상 데이터입니다</strong><small>실제 계정·결제·AI API에 연결되지 않습니다. 변경 사항은 이 브라우저에만 저장됩니다.</small></div><button type="button" onClick={()=>dialogRef.current.showModal()}>데모 데이터 초기화</button></div>{getStorageWarning()&&<p role="alert" className={styles.notice}>{getStorageWarning()}</p>}{message&&<p className={styles.notice} role="status">{message}<button onClick={()=>setMessage('')}>닫기</button></p>}<Suspense fallback={<p role="status" className={styles.notice}>데모 화면을 불러오는 중입니다.</p>}><Routes key={generation}><Route path="/admin" element={<AdminLayout/>}><Route index element={<pages.Dashboard/>}/>{routes.map(([route,name])=>{const Page=pages[name];return <Route key={route} path={route} element={<Page/>}/>})}</Route><Route path="*" element={<Navigate to="/admin" replace/>}/></Routes></Suspense><dialog ref={dialogRef} aria-labelledby="reset-title" className={styles.dialog}><h2 id="reset-title">데모 데이터를 초기화할까요?</h2><p>이 브라우저에서 변경한 가상 데이터가 초기 샘플로 돌아갑니다.</p><div><button autoFocus onClick={()=>dialogRef.current.close()}>취소</button><button onClick={handleReset}>초기화</button></div></dialog></div>
}
