// Local presentation identity only. This module performs no authentication.
import {demoSession} from './store'
export function subscribeToDemoSession(callback){let active=true;queueMicrotask(()=>{if(active)callback(demoSession.currentUser)});return ()=>{active=false}}
