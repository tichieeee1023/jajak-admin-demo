import {getCollection} from './store'
export async function fetchProducts({includeHidden=false}={}){return (await getCollection('products')).filter(p=>includeHidden||p.status!=='hidden')}
