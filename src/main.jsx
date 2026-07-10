import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  Album, ArrowRight, BadgeDollarSign, BarChart3, Bell, Check, ChevronRight,
  Ban, CircleHelp, Clock3, Copy, CreditCard, Edit3, FileAudio, Headphones, Home, Link,
  LifeBuoy, LogOut, Menu,
  MessageCircle, Megaphone, Newspaper, Plus, Search, Send, ShieldCheck,
  Sparkles, TrendingUp, UploadCloud, UserRound, Users, Wallet, X, Sun, Moon
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || (import.meta.env.PROD && !import.meta.env.VITE_API_URL);
const APP_BASE = import.meta.env.BASE_URL || '/';

function appPath(path){
  const base=APP_BASE==='/'?'':APP_BASE.replace(/\/$/,'');
  return `${base}${path}`;
}

function publicLinkUrl(slug){
  return `${location.origin}${appPath(`/p/${slug}`)}`;
}

function makeSlug(value=''){
  return value.toString().trim().toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,'-').replace(/^-+|-+$/g,'')||`link-${Date.now()}`;
}

function normalizeSmartLink(item){
  const rawLinks=item.links||{};
  const labels=Array.isArray(rawLinks)?rawLinks:Object.keys(rawLinks);
  const url=item.url?.startsWith('http')?item.url:publicLinkUrl(item.slug||item.url?.split('/').pop()||item.title);
  return {...item,url,links:labels,rawLinks};
}

function isValidUrl(value){
  try{new URL(value);return true}catch{return false}
}

function downloadJson(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=filename;link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename,rows){
  const csv=rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=filename;link.click();
  URL.revokeObjectURL(url);
}

async function api(path,{method='GET',body,token,form=false}={}){
  const headers={};
  if(token)headers.Authorization=`Bearer ${token}`;
  if(body&&!form)headers['Content-Type']='application/json';
  const res=await fetch(`${API}${path}`,{method,headers,body:form?body:body?JSON.stringify(body):undefined});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(json.detail||'Ошибка запроса');
  return json;
}

function apiFileUrl(url){return url&&url.startsWith('/uploads')?`${API}${url}`:url}

const demoReleases = [
  {id:1,userId:1,title:'Neon Dreams',artist:'Luna Ray',type:'Сингл',genre:'Pop',date:'18 июня 2026',releaseDate:'2026-07-10',status:'На модерации',streams:0,cover:'neon',upc:'',isrc:'',tracks:[{title:'Neon Dreams',isrc:''}],platforms:['Яндекс Музыка','VK Музыка','Apple Music'],comment:'Первый летний сингл, мягкий synth-pop с ночной атмосферой.'},
  {id:2,userId:1,title:'Midnight Echoes',artist:'Luna Ray',type:'EP · 5 треков',genre:'Electronic',date:'10 июня 2026',releaseDate:'2026-06-10',status:'Принят',streams:128440,cover:'midnight',upc:'4630119902456',isrc:'RUIIM2600001',tracks:[{title:'Midnight Echoes',isrc:'RUIIM2600001'}],platforms:['Яндекс Музыка','VK Музыка','Apple Music','Spotify'],comment:'EP для ночных подборок и редакционных плейлистов.'},
  {id:3,userId:1,title:'Cold Summer',artist:'Luna Ray',type:'Сингл',genre:'Pop',date:'2 июня 2026',releaseDate:'2026-06-02',status:'Черновик',reason:'Обложка содержит мелкий текст. Загрузите версию без надписей.',streams:0,cover:'cold',upc:'',isrc:'',tracks:[{title:'Cold Summer',isrc:''}],platforms:['VK Музыка','Звук'],comment:'Нужна замена обложки.'}
];

const demoUsers = [
  {id:1,email:'artist@insomnia.market',artist:'Luna Ray',role:'artist',status:'Активен',registered:'22 июня 2026',balance:86420.5,paid:53580},
  {id:2,email:'misha.wave@mail.ru',artist:'Misha Wave',role:'artist',status:'Активен',registered:'28 июня 2026',balance:12400,paid:0},
  {id:3,email:'blocked@example.com',artist:'No Rules',role:'artist',status:'Заблокирован',registered:'2 июля 2026',balance:0,paid:0}
];

const demoPayouts = [
  {id:1,userId:1,artist:'Luna Ray',amount:30000,card:'2200 7012 3456 7890',status:'Ожидает выплаты',date:'8 июля 2026'},
  {id:2,userId:2,artist:'Misha Wave',amount:12400,card:'5536 9134 0000 9912',status:'Ожидает выплаты',date:'7 июля 2026'}
];

const demoAdmins = [
  {id:10,initials:'АК',name:'Алексей Ковалёв',role:'owner',access:'Полный доступ',active:true},
  {id:11,initials:'АИ',name:'Алина Исаева',role:'support',access:'Чаты, релизы',active:true},
  {id:12,initials:'МС',name:'Мария Соколова',role:'moderator',access:'Релизы, финансы',active:true}
];

const demoPromoLinks = [
  {id:1,title:'Midnight Echoes',slug:'midnight-echoes',url:publicLinkUrl('midnight-echoes'),links:['Яндекс Музыка','VK Музыка','Apple Music'],rawLinks:{'Яндекс Музыка':'https://music.yandex.ru','VK Музыка':'https://vk.com/music','Apple Music':'https://music.apple.com'}}
];

const demoNews = [
  {id:1,category:'ГАЙД',title:'Как подготовить релиз, который заметят',body:'Чек-лист от нашей редакции: от обложки до питчинга.',published_at:'18 июня 2026'},
  {id:2,category:'ИНДУСТРИЯ',title:'Что изменилось в музыкальном продвижении',body:'Разбираем главные тренды этого лета.',published_at:'14 июня 2026'},
  {id:3,category:'ИСТОРИЯ',title:'От демо до первого миллиона прослушиваний',body:'Lissa рассказала о пути своего дебютного сингла.',published_at:'9 июня 2026'}
];

const artistNav = [
  ['Главная',Home],['Релизы',Album],['Статистика',BarChart3],['Финансы',Wallet],
  ['Новости',Newspaper],['Промо',Megaphone],['Промо-ссылки',Link],['Поддержка',MessageCircle],['Профиль',UserRound]
];

const staffNav = [
  ['Админка',ShieldCheck],['Поддержка',MessageCircle],['Новости',Newspaper]
];

function Logo({compact=false}){
  return <div className={'logo '+(compact?'compact':'')}><span className="moon">I</span><div><b>INSOMNIA</b><small>MARKET</small></div></div>
}

function Badge({status}){
  const icon=status==='Принят'?<Check/>:status==='Черновик'?<X/>:<Clock3/>;
  return <span className={'badge '+status.toLowerCase().replace(' ','-')}>{icon}{status}</span>
}

function Cover({kind='neon',large=false}){
  return <div className={`cover ${kind} ${large?'large':''}`}><span className="cover-noise"/><i>INSOMNIA</i><b>{kind==='midnight'?'MIDNIGHT\nECHOES':kind==='cold'?'COLD\nSUMMER':'NEON\nDREAMS'}</b></div>
}

function ThemeToggle({theme,onToggle,className=''}){return <button className={`icon theme-toggle ${className}`} onClick={onToggle} aria-label={theme==='dark'?'Включить светлую тему':'Включить тёмную тему'}>{theme==='dark'?<Sun/>:<Moon/>}</button>}

function Toasts({items,onClose}){
  return <div className="toasts">{items.map(item=><div className={`toast ${item.type||'ok'}`} key={item.id}><b>{item.title}</b><span>{item.text}</span><button onClick={()=>onClose(item.id)}><X/></button></div>)}</div>
}

function SearchBox({items,setPage}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const wrapRef=useRef(null);
  useEffect(()=>{const close=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
  const results=query.trim()?items.filter(item=>`${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(query.toLowerCase())).slice(0,8):[];
  const select=item=>{setPage(item.page);setOpen(false);setQuery('')};
  return <div className="search-wrap" ref={wrapRef}><div className={`search ${open?'active':''}`} onClick={()=>setOpen(true)}><Search/>{open?<input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Escape'&&setOpen(false)} placeholder="Поиск по кабинету..."/>:<button>Поиск</button>}</div>{open&&<div className="dropdown search-results"><div className="drop-head"><b>Поиск</b><button onClick={()=>setOpen(false)}><X/></button></div>{!query&&<p>Введите название релиза, раздела, новость, сообщение или промо-ссылку.</p>}{query&&results.length===0&&<p>Ничего не найдено</p>}{results.map(item=><button key={`${item.type}-${item.id}`} onClick={()=>select(item)}><span>{item.type}</span><b>{item.title}</b><small>{item.subtitle}</small></button>)}</div>}</div>
}

function notificationPage(item){
  const text=`${item.subject||''} ${item.body||''}`.toLowerCase();
  if(text.includes('выплат')||text.includes('начислен'))return 'Финансы';
  if(text.includes('поддерж')||text.includes('тикет')||text.includes('чат'))return 'Поддержка';
  if(text.includes('промо')||text.includes('питчинг'))return 'Промо';
  if(text.includes('релиз')||text.includes('модерац'))return 'Релизы';
  return 'Главная';
}

function NotificationMenu({items,onReadAll,setPage}){
  const [open,setOpen]=useState(false);
  const unread=items.filter(x=>!x.read).length;
  const openItem=item=>{setPage(notificationPage(item));setOpen(false)};
  return <div className="menu-wrap"><button className="icon notification" onClick={()=>setOpen(!open)} aria-label="Уведомления"><Bell/>{unread>0&&<i/>}</button>{open&&<div className="dropdown notify-menu"><div className="drop-head"><b>Уведомления {unread>0&&<small>{unread} новых</small>}</b><button onClick={onReadAll}>Прочитано</button></div>{items.length===0&&<p>Пока нет уведомлений.</p>}{items.slice(0,8).map(item=><button className={`notify-item ${item.read?'read':''}`} key={item.id} onClick={()=>openItem(item)}><span>{item.channel||'system'}</span><b>{item.subject}</b><p>{item.body}</p></button>)}</div>}</div>
}

function UserMenu({currentUser,setPage,onLogout}){
  const [open,setOpen]=useState(false);
  const initials=currentUser.role==='artist'?(currentUser.artist||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase():'IM';
  return <div className="menu-wrap"><button className="avatar" onClick={()=>setOpen(!open)}>{currentUser.avatar_url?<img src={apiFileUrl(currentUser.avatar_url)} alt="avatar"/>:initials}</button>{open&&<div className="dropdown user-menu"><div className="drop-head"><b>{currentUser.artist||'Insomnia'}</b><small>{currentUser.role==='artist'?'Артист':'Команда'}</small></div><button onClick={()=>{setPage(currentUser.role==='artist'?'Профиль':'Админка');setOpen(false)}}><UserRound/>Профиль</button><button onClick={()=>{setPage(currentUser.role==='artist'?'Поддержка':'Поддержка');setOpen(false)}}><LifeBuoy/>Поддержка</button><button onClick={onLogout}><LogOut/>Выйти</button></div>}</div>
}

function Login({onLogin,theme,onToggleTheme}){
  const [register,setRegister]=useState(false);
  const [email,setEmail]=useState('artist@insomnia.market'); const [password,setPassword]=useState('insomnia');
  const [name,setName]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async()=>{setBusy(true);setError('');try{await onLogin({email,password,artist_name:name,register})}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <div className="auth-shell"><ThemeToggle theme={theme} onToggle={onToggleTheme} className="auth-theme"/>
    <div className="auth-art"><Logo/><div className="art-copy"><span className="eyebrow light"><Sparkles/> независимая дистрибуция</span><h1>Музыка не спит.<br/><em>И мы тоже.</em></h1><p>Выпускай музыку на всех площадках, следи за ростом и оставайся на связи с командой.</p></div><div className="orb one"/><div className="orb two"/><div className="vinyl"><div/></div></div>
    <div className="auth-form"><div className="mobile-logo"><Logo/></div><div className="form-inner"><span className="eyebrow">INSOMNIA SPACE</span><h2>{register?'Создать аккаунт':'С возвращением'}</h2><p>{register?'Начни выпускать музыку уже сегодня.':'Войди в кабинет артиста.'}</p>
      {register&&<label>Имя артиста<input value={name} onChange={e=>setName(e.target.value)} placeholder="Например, Luna Ray"/></label>}
      <label>Почта<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<div className="auth-error">{error}</div>}
      <button className="primary wide" disabled={busy} onClick={submit}>{busy?'Подождите...':register?'Зарегистрироваться':'Войти'}<ArrowRight/></button>
      <div className="form-switch">{register?'Уже есть аккаунт?':'Ещё нет аккаунта?'} <button onClick={()=>setRegister(!register)}>{register?'Войти':'Регистрация'}</button></div>
      <div className="demo-hint"><ShieldCheck/> Демо-вход: любые данные</div>
    </div></div>
  </div>
}

function PublicSmartLink(){
 const slug=decodeURIComponent(location.pathname.split('/p/')[1]||'').replace(/\/$/,'');
 const [item,setItem]=useState(null);
 const [error,setError]=useState('');
 useEffect(()=>{if(!slug)return;api(`/p/${slug}`).then(setItem).catch(e=>setError(e.message))},[slug]);
 const links=item?.links||{};
 return <div className="public-link-page"><div className="public-card"><Logo/><div className="public-cover">{item?.cover_url?<img src={apiFileUrl(item.cover_url)} alt={item.title}/>:<Sparkles/>}</div>{error?<><h1>Линкс не найден</h1><p>{error}</p></>:<><span className="eyebrow">INSOMNIA SMART LINK</span><h1>{item?.title||'Загрузка...'}</h1><p>{item?.artist_name||'Insomnia Market'}</p><div className="public-buttons">{Object.entries(links).map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<ArrowRight/></a>)}</div></>}</div></div>
}

function Sidebar({page,setPage,open,setOpen,onLogout,currentUser}){
  const isStaff=currentUser.role!=='artist';
  const nav=isStaff?staffNav:artistNav;
  const initials=isStaff?'IM':(currentUser.artist||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return <aside className={open?'open':''}><div className="aside-head"><Logo/><button className="icon mobile" onClick={()=>setOpen(false)}><X/></button></div><nav>{nav.map(([n,I])=><button key={n} className={page===n?'active':''} onClick={()=>{setPage(n);setOpen(false)}}><I/><span>{n}</span>{n==='Поддержка'&&<i>1</i>}</button>)}</nav><div className="promo-mini"><Sparkles/><b>{isStaff?'Ручной контроль':'Нужен буст?'}</b><p>{isStaff?'Релизы, выплаты и кабинеты собраны в админке.':'Расскажи нам о релизе — подберём промо.'}</p><button onClick={()=>setPage(isStaff?'Админка':'Промо')}>{isStaff?'Открыть':'Узнать больше'}</button></div><button className="user-mini"><span>{initials}</span><div><b>{isStaff?'Команда Insomnia':currentUser.artist}</b><small>{isStaff?'Админ': 'Артист'}</small></div><ChevronRight/></button><button className="logout" onClick={onLogout}><LogOut/>Выйти</button></aside>
}

function Topbar({title,setOpen,setPage,theme,onToggleTheme,currentUser,searchItems,notifications,onReadAll,onLogout}){
  return <header><button className="icon mobile" onClick={()=>setOpen(true)}><Menu/></button><div><span>INSOMNIA MARKET</span><h2>{title}</h2></div><div className="top-actions"><SearchBox items={searchItems} setPage={setPage}/><ThemeToggle theme={theme} onToggle={onToggleTheme}/><NotificationMenu items={notifications} onReadAll={onReadAll} setPage={setPage}/><UserMenu currentUser={currentUser} setPage={setPage} onLogout={onLogout}/></div></header>
}

function HomePage({setPage,releases,news=[]}){
 const featured=news[0]||demoNews[0];
 const second=news[1]||demoNews[1];
 return <div className="page fade"><section className="hello"><div><span className="eyebrow"><Sparkles/> ДОБРЫЙ ВЕЧЕР, LUNA</span><h1>Твоя музыка<br/>уже <em>звучит.</em></h1><p>Мы собрали главное за последние 30 дней.</p><button className="primary" onClick={()=>setPage('Загрузить релиз')}><Plus/>Новый релиз</button></div><div className="hero-card"><div className="soundwave">{[2,4,7,3,9,6,4,8,5,10,7,3,6,8,4,2,7,5,9,3].map((n,i)=><i key={i} style={{height:n*10+'%'}}/>)}</div><span>СЛУШАТЕЛЕЙ СЕЙЧАС</span><b>248</b><small><TrendingUp/> +18% к прошлой неделе</small></div></section>
  <section className="metrics"><Metric icon={Headphones} label="Прослушивания" value="128 440" delta="+24,8%"/><Metric icon={UserRound} label="Слушатели" value="42 918" delta="+17,2%"/><Metric icon={BadgeDollarSign} label="Доход" value="₽ 86 420" delta="+12,4%"/><Metric icon={Album} label="Активные релизы" value="12" delta="2 новых"/></section>
  <section className="grid-two"><div className="panel"><PanelHead title="Последние релизы" action="Все релизы" onClick={()=>setPage('Релизы')}/><div className="release-list">{releases.map(r=><div className="release-row" key={r.id}><Cover kind={r.cover}/><div className="release-name"><b>{r.title}</b><span>{r.type} · {r.date}</span></div><Badge status={r.status}/><div className="stream"><b>{r.streams?r.streams.toLocaleString('ru'):'—'}</b><span>прослушиваний</span></div><ChevronRight/></div>)}</div></div>
  <div className="panel news-panel"><PanelHead title="Новости" action="Все новости" onClick={()=>setPage('Новости')}/><article className="featured-news"><span>{featured.category}</span><h3>{featured.title}</h3><p>{featured.body}</p><small>{featured.published_at||'сегодня'}</small></article><article className="news-line"><div className="news-pic purple"/><div><span>{second.category}</span><b>{second.title}</b><small>{second.published_at||'сегодня'}</small></div></article></div></section>
 </div>
}

function Metric({icon:I,label,value,delta}){return <div className="metric"><div className="metric-icon"><I/></div><span>{label}</span><b>{value}</b><small><TrendingUp/>{delta}</small></div>}
function PanelHead({title,action,onClick}){return <div className="panel-head"><h3>{title}</h3>{action&&<button onClick={onClick}>{action}<ArrowRight/></button>}</div>}

function Releases({releases,setPage,onOpenRelease}){
 const [filter,setFilter]=useState('Все');
 const shown=filter==='Все'?releases:releases.filter(r=>r.status===filter);
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">ТВОЙ КАТАЛОГ</span><h1>Релизы</h1><p>Загружай музыку и следи за каждым этапом модерации.</p></div><button className="primary" onClick={()=>setPage('Загрузить релиз')}><UploadCloud/>Загрузить релиз</button></div><div className="tabs">{['Все','На модерации','Принят','Черновик'].map(x=><button className={filter===x?'active':''} onClick={()=>setFilter(x)} key={x}>{x}<i>{x==='Все'?releases.length:releases.filter(r=>r.status===x).length}</i></button>)}</div>{shown.length===0&&<div className="panel empty-state"><Album/><h3>Релизов пока нет</h3><p>Загрузите первый релиз или переключите фильтр.</p></div>}<div className="release-cards">{shown.map(r=><article key={r.id}><Cover kind={r.cover} large/><div className="release-card-body"><div><span>{r.type}</span><h3>{r.title}</h3><p>{r.artist}</p></div><Badge status={r.status}/>{r.reason&&<div className="reject"><CircleHelp/><div><b>Что нужно исправить</b><p>{r.reason}</p></div></div>}<div className="card-meta"><span><b>{r.streams.toLocaleString('ru')}</b> прослушиваний</span><span>Загружен {r.date}</span></div>{r.status==='Принят'&&<div className="release-codes"><span>UPC <b>{r.upc||'ожидает присвоения'}</b></span><span>ISRC <b>{r.isrc||'ожидает присвоения'}</b></span></div>}<button className="secondary" onClick={()=>onOpenRelease(r)}>Открыть релиз<ArrowRight/></button></div></article>)}</div></div>
}

function ReleaseDetail({release,setPage,onPromo,onLink,onFix}){
 if(!release)return <div className="page fade"><button className="back" onClick={()=>setPage('Релизы')}>← Назад</button><div className="panel empty-state"><Album/><h3>Релиз не выбран</h3></div></div>;
 const coverUrl=apiFileUrl(release.cover_url);
 const audioUrl=apiFileUrl(release.audio_url);
 return <div className="page fade release-detail"><button className="back" onClick={()=>setPage('Релизы')}>← Назад к релизам</button><div className="detail-hero panel"><div>{coverUrl?<img className="detail-cover-img" src={coverUrl} alt={release.title}/>:<Cover kind={release.cover} large/>}</div><div className="detail-info"><span className="eyebrow">КАРТОЧКА РЕЛИЗА</span><h1>{release.title}</h1><p>{release.artist} · {release.type} · {release.genre}</p><Badge status={release.status}/>{release.reason&&<div className="reject"><CircleHelp/><div><b>Причина отклонения</b><p>{release.reason}</p></div></div>}<div className="detail-actions">{release.status==='Черновик'&&<button className="primary" onClick={()=>onFix(release)}><Edit3/>Исправить и отправить повторно</button>}<button className="primary" onClick={()=>onPromo(release)}><Megaphone/>Подать на промо</button><button className="secondary" onClick={()=>onLink(release)}><Link/>Создать линкс</button><button className="secondary" onClick={()=>downloadJson(`release-${release.id}.json`,release)}><Copy/>Скачать данные</button></div></div></div><div className="grid-two"><div className="panel"><PanelHead title="Данные релиза" action=""/><div className="detail-list"><span>Дата релиза <b>{release.releaseDate||release.date}</b></span><span>Прослушивания <b>{release.streams.toLocaleString('ru')}</b></span><span>UPC <b>{release.upc||'Ожидает присвоения'}</b></span><span>ISRC <b>{release.isrc||'Ожидает присвоения'}</b></span><span>Площадки <b>{release.platforms?.join(', ')||'Не выбраны'}</b></span></div></div><div className="panel"><PanelHead title="Аудио" action=""/>{audioUrl?<audio controls src={audioUrl} className="audio-player"/>:<div className="empty-state small"><FileAudio/><p>Аудиофайл не прикреплён</p></div>}</div></div><div className="panel"><PanelHead title="Комментарий и участники" action=""/><p className="detail-text">{release.comment||'Комментарий не указан.'}</p></div></div>
}

function UploadRelease({setPage,onCreated,onUpdated,onUpload,currentUser,initialRelease=null}){
 const [step,setStep]=useState(1); const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [form,setForm]=useState(()=>initialRelease?{title:initialRelease.title,release_type:initialRelease.type||'Сингл',genre:initialRelease.genre||'Pop',release_date:initialRelease.releaseDate||'2026-07-10',language:initialRelease.language||'Русский',cover_url:initialRelease.cover_url||'',audio_url:initialRelease.audio_url||'',main_artist:initialRelease.contributors?.main_artist||currentUser.artist||'',music_author:initialRelease.contributors?.music_author||'',lyrics_author:initialRelease.contributors?.lyrics_author||'',lyrics:initialRelease.lyrics||'',platforms:initialRelease.platforms?.length?initialRelease.platforms:['Яндекс Музыка','VK Музыка','Звук','Apple Music','Spotify','YouTube Music'],comment:initialRelease.comment||''}:{title:'',release_type:'Сингл',genre:'Pop',release_date:'2026-07-10',language:'Русский',cover_url:'',audio_url:'',main_artist:currentUser.artist||'',music_author:'',lyrics_author:'',lyrics:'',platforms:['Яндекс Музыка','VK Музыка','Звук','Apple Music','Spotify','YouTube Music'],comment:''});
 const coverRef=useRef(null); const audioRef=useRef(null);
 const setField=(key,value)=>setForm(f=>({...f,[key]:value}));
 const upload=async(file,key)=>{if(!file)return;setBusy(true);try{const saved=await onUpload(file);setField(key,saved.url)}finally{setBusy(false)}};
 const validate=()=>{if(!form.title.trim())return 'Укажите название релиза';if(!form.cover_url)return 'Загрузите обложку релиза';if(!form.audio_url)return 'Загрузите аудиофайл';if(!form.main_artist.trim())return 'Укажите основного артиста';if(!form.platforms.length)return 'Выберите хотя бы одну площадку';return ''};
 const next=()=>{setError('');if(step===1&&!form.title.trim()){setError('Сначала укажите название релиза');return}setStep(step+1)};
 const send=async()=>{const message=validate();if(message){setError(message);return}setBusy(true);try{const payload={id:initialRelease?.id||Date.now(),title:form.title,artist:currentUser.artist,type:form.release_type,date:new Date().toLocaleDateString('ru'),status:'На модерации',streams:initialRelease?.streams||0,cover:initialRelease?.cover||'neon',...form,contributors:{main_artist:form.main_artist,music_author:form.music_author,lyrics_author:form.lyrics_author}};initialRelease?await onUpdated(initialRelease.id,payload):await onCreated(payload);setPage('Релизы')}finally{setBusy(false)}}
 return <div className="page fade upload-page"><button className="back" onClick={()=>setPage('Релизы')}>← Назад к релизам</button><div className="page-title"><div><span className="eyebrow">{initialRelease?'ИСПРАВЛЕНИЕ РЕЛИЗА':'НОВЫЙ РЕЛИЗ'}</span><h1>{initialRelease?'Повторная отправка':'Загрузка музыки'}</h1><p>{initialRelease?'Обнови данные — релиз снова уйдёт команде на модерацию.':'Заполни информацию — команда проверит релиз вручную.'}</p></div></div><div className="steps">{['Основное','Треки','Участники','Площадки'].map((x,i)=><div className={step>=i+1?'active':''} key={x}><i>{step>i+1?<Check/>:i+1}</i><span>{x}</span></div>)}</div><div className="form-card"><h3>{step===1?'Расскажи о релизе':step===2?'Загрузи аудиофайлы':step===3?'Укажи участников':'Выбери площадки'}</h3>{error&&<div className="auth-error">{error}</div>}{step===1&&<><input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>upload(e.target.files?.[0],'cover_url')}/><div className="upload-grid"><button className="cover-drop" onClick={()=>coverRef.current?.click()}>{form.cover_url?<img className="cover-preview" src={apiFileUrl(form.cover_url)} alt="cover"/>:<UploadCloud/>}<b>{form.cover_url?'Обложка загружена':'Загрузить обложку'}</b><span>{form.cover_url||'3000 × 3000 px, JPG или PNG'}</span></button><div><label>Название релиза<input value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="Название"/></label><label>Тип релиза<select value={form.release_type} onChange={e=>setField('release_type',e.target.value)}><option>Сингл</option><option>EP</option><option>Альбом</option></select></label><div className="field-row"><label>Жанр<select value={form.genre} onChange={e=>setField('genre',e.target.value)}><option>Pop</option><option>Hip-hop</option><option>Electronic</option><option>Rock</option></select></label><label>Дата релиза<input type="date" value={form.release_date} onChange={e=>setField('release_date',e.target.value)}/></label></div><label>Язык текста<select value={form.language} onChange={e=>setField('language',e.target.value)}><option>Русский</option><option>Английский</option><option>Инструментал</option></select></label><label>Комментарий для модерации<textarea value={form.comment} onChange={e=>setField('comment',e.target.value)} placeholder="Что важно знать команде по релизу"/></label></div></div></>}{step===2&&<><input ref={audioRef} type="file" accept="audio/wav,audio/mpeg,audio/flac" hidden onChange={e=>upload(e.target.files?.[0],'audio_url')}/><div className="audio-drop"><FileAudio/><b>{form.audio_url?'Аудиофайл загружен':'Загрузите WAV/MP3/FLAC'}</b><span>{form.audio_url||'WAV, 16/24 bit, 44.1 kHz или выше'}</span><button className="secondary" onClick={()=>audioRef.current?.click()}>Выбрать файлы</button>{form.audio_url&&<audio controls src={apiFileUrl(form.audio_url)} className="audio-player"/>}</div><label>Текст песни<textarea value={form.lyrics} onChange={e=>setField('lyrics',e.target.value)} placeholder="Если есть текст — вставьте сюда"/></label></>}{step===3&&<div className="fields"><label>Основной артист<input value={form.main_artist} onChange={e=>setField('main_artist',e.target.value)}/></label><label>Автор музыки<input value={form.music_author} onChange={e=>setField('music_author',e.target.value)} placeholder="Имя и фамилия"/></label><label>Автор текста<input value={form.lyrics_author} onChange={e=>setField('lyrics_author',e.target.value)} placeholder="Имя и фамилия"/></label></div>}{step===4&&<div className="platforms">{['Яндекс Музыка','VK Музыка','Звук','Apple Music','Spotify','YouTube Music'].map(x=><label key={x}><input type="checkbox" checked={form.platforms.includes(x)} onChange={e=>setField('platforms',e.target.checked?[...form.platforms,x]:form.platforms.filter(p=>p!==x))}/><span><Check/></span>{x}</label>)}</div>}<div className="form-actions"><button className="secondary" disabled={step===1||busy} onClick={()=>{setError('');setStep(step-1)}}>Назад</button><button className="primary" disabled={busy} onClick={()=>step<4?next():send()}>{busy?'Загрузка...':step<4?'Продолжить':initialRelease?'Отправить повторно':'Отправить на модерацию'}<ArrowRight/></button></div></div></div>
}

function Stats({releases=[]}){
 const total=releases.reduce((sum,r)=>sum+(r.streams||0),0);
 const accepted=releases.filter(r=>r.status==='Принят').length;
 const listeners=Math.round(total*0.34);
 const platforms=['Яндекс Музыка','VK Музыка','Apple Music','Spotify'].map((name,i)=>[name,[46,28,16,10][i],Math.round(total*([.46,.28,.16,.1][i]||0)).toLocaleString('ru')]);
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">АНАЛИТИКА</span><h1>Статистика</h1><p>Данные обновляются командой Insomnia после получения отчётов.</p></div><select className="period"><option>Последние 30 дней</option><option>Последние 90 дней</option></select></div><section className="metrics"><Metric icon={Headphones} label="Прослушивания" value={total.toLocaleString('ru')} delta={`${accepted} принятых релизов`}/><Metric icon={UserRound} label="Слушатели" value={listeners.toLocaleString('ru')} delta="оценка по отчётам"/><Metric icon={TrendingUp} label="Сохранения" value={Math.round(total*.064).toLocaleString('ru')} delta="ручное обновление"/></section>{total===0&&<div className="panel empty-state"><BarChart3/><h3>Статистика пока пустая</h3><p>Когда админ обновит прослушивания, графики появятся здесь.</p></div>}<div className="grid-two stats-grid"><div className="panel chart"><PanelHead title="Динамика прослушиваний" action=""/><div className="chart-area"><div className="chart-fill"/><svg viewBox="0 0 700 220" preserveAspectRatio="none"><path d="M0 180 C80 160,100 190,170 130 S280 160,350 90 S460 130,520 55 S620 90,700 20" fill="none" stroke="#9b7cff" strokeWidth="5"/></svg>{[0,1,2,3,4,5].map(i=><span key={i} style={{left:(i*19)+'%'}}>{i*5+1} июн</span>)}</div></div><div className="panel"><PanelHead title="Топ площадок" action=""/><div className="platform-list">{platforms.map(([n,p,v])=><div key={n}><span>{n}</span><b>{v}</b><div><i style={{width:p+'%'}}/></div></div>)}</div></div></div></div>
}

function Finance({finance,payouts,onPayoutRequest,currentUser}){
 const available=finance?.balance||0;
 const [form,setForm]=useState({amount:'30000',card:'',holder:'',bank:''});
 const [error,setError]=useState('');
 const history=(finance?.history||[]).map(row=>[row.period,row.source,row.status,`₽ ${Number(row.amount||0).toLocaleString('ru')}`]);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const request=()=>{const amount=Number(form.amount);if(!amount||amount<=0)return setError('Укажите сумму выплаты');if(amount>available)return setError('Сумма больше доступного баланса');if(form.card.replace(/\D/g,'').length<12)return setError('Укажите корректный номер карты');setError('');onPayoutRequest({...form,amount});setForm({amount:'',card:'',holder:'',bank:''})};
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">БАЛАНС</span><h1>Финансы</h1><p>Начисления обновляются вручную админами после отчётов площадок.</p></div></div><div className="balance-card"><span>Доступно к выплате</span><b>₽ {available.toLocaleString('ru')}</b><small>Начислено: ₽ {Number(finance?.accrued||0).toLocaleString('ru')} · Выплачено: ₽ {Number(finance?.paid||0).toLocaleString('ru')}</small><div className="balance-glow"/></div><div className="grid-two"><div className="panel payout-box"><PanelHead title="Запросить выплату" action=""/><p>Заявка появится в админке. После перевода команда отметит выплату как оплаченную.</p>{error&&<div className="auth-error">{error}</div>}<div className="field-row"><label>Сумма<input value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="30000"/></label><label>Банк<input value={form.bank} onChange={e=>set('bank',e.target.value)} placeholder="Т-Банк, Сбер..."/></label></div><label>Номер карты<input value={form.card} onChange={e=>set('card',e.target.value)} placeholder="2200 0000 0000 0000"/></label><label>ФИО получателя<input value={form.holder} onChange={e=>set('holder',e.target.value)} placeholder="Иванов Иван Иванович"/></label><button className="primary" onClick={request} disabled={available<=0}><CreditCard/>Отправить заявку</button>{available<=0&&<small className="muted">Пока нет доступного баланса для выплаты.</small>}</div><div className="panel transactions"><PanelHead title="Мои заявки" action=""/><div className="mini-list">{payouts.filter(x=>!currentUser||x.userId===currentUser.id||currentUser.role!=='artist').map(p=><div className="mini-row" key={p.id}><span><CreditCard/>{p.card}</span><b>{p.amount.toLocaleString('ru')} ₽</b><small className={p.status==='Оплачено'?'paid':p.status==='Отклонено'?'danger':''}>{p.status}</small></div>)}{payouts.length===0&&<div className="empty-line">Заявок на выплату пока нет.</div>}</div></div></div><div className="panel transactions"><PanelHead title="История начислений" action="Скачать отчёт" onClick={()=>downloadCsv('finance-report.csv',[['Период','Источник','Статус','Сумма'],...history])}/><div className="table"><div className="tr th"><span>Период</span><span>Источник</span><span>Статус</span><span>Сумма</span></div>{history.map(r=><div className="tr" key={r.join('-')}>{r.map((x,i)=><span key={x} className={i===2?'paid':''}>{x}</span>)}</div>)}{history.length===0&&<div className="empty-line">Начислений пока нет — они появятся после ручного отчёта админа.</div>}</div></div></div>}

function News({isStaff=false,items=[],onCreateNews,onUpdateNews,onDeleteNews}){
 const [selected,setSelected]=useState(null); const [form,setForm]=useState({category:'ГАЙД',title:'',body:''});
 const [editing,setEditing]=useState(null);
 const palette=['violet','cyan','pink'];
 const add=async()=>{if(form.title&&form.body){if(editing){await onUpdateNews?.(editing,{...form});setEditing(null)}else{await onCreateNews?.(form)}setForm({category:'ГАЙД',title:'',body:''})}};
 const startEdit=n=>{setEditing(n.id);setForm({category:n.category||'ГАЙД',title:n.title||'',body:n.body||''});window.scrollTo({top:0,behavior:'smooth'})};
 const cancelEdit=()=>{setEditing(null);setForm({category:'ГАЙД',title:'',body:''})};
 if(selected)return <div className="page fade upload-page"><button className="back" onClick={()=>setSelected(null)}>← Назад к новостям</button><article className={`news-card ${selected.color||'violet'} news-detail-card`}><div><span>{selected.category}</span><i>IM</i></div><h3>{selected.title}</h3><p>{selected.body}</p><small>{selected.published_at||'сегодня'}</small></article></div>;
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">INSOMNIA EDITORIAL</span><h1>Новости</h1><p>Гайды, обновления площадок и истории наших артистов.</p></div></div>{isStaff&&<div className="panel admin-form"><PanelHead title={editing?'Редактировать новость':'Добавить новость'} action={editing?'Отменить':''} onClick={cancelEdit}/><div className="field-row"><label>Категория<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Заголовок<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label></div><label>Текст новости<textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label><button className="primary" onClick={add}>{editing?<Check/>:<Plus/>}{editing?'Сохранить изменения':'Опубликовать'}</button></div>}{items.length===0&&<div className="panel empty-state"><Newspaper/><h3>Новостей пока нет</h3><p>Когда команда опубликует первую новость, она появится здесь.</p></div>}<div className="news-grid">{items.map((n,i)=><article className={'news-card '+(n.color||palette[i%3])} key={n.id||n.title}><div><span>{n.category}</span><i>{String(i+1).padStart(2,'0')}</i></div><h3>{n.title}</h3><p>{n.body}</p><div className="news-actions"><button onClick={()=>setSelected({...n,color:n.color||palette[i%3]})}>Читать<ArrowRight/></button>{isStaff&&<button onClick={()=>startEdit(n)}><Edit3/>Редактировать</button>}{isStaff&&<button onClick={()=>onDeleteNews?.(n.id)}><X/>Удалить</button>}</div></article>)}</div></div>
}

function Promo({releases,onPromoRequest}){
 const [form,setForm]=useState({release_id:releases[0]?.id||'',release_info:'',focus_track:'',artist_info:''});
 const [sent,setSent]=useState(false);const [guide,setGuide]=useState(false);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const submit=async()=>{await onPromoRequest({...form,release_id:Number(form.release_id)||null});setSent(true);setForm(f=>({...f,release_info:'',focus_track:'',artist_info:''}))};
 return <div className="page fade"><section className="promo-hero"><div><span className="eyebrow light"><Sparkles/> ПРОМО-ПОДДЕРЖКА</span><h1>Питчинг релизов<br/><em>для площадок.</em></h1><p>Наша команда отправляет треки редакторам площадок для попадания в плейлисты и на витрины сервисов. Чтобы попасть в рассылку, загрузите релиз минимум за 14 дней до даты выпуска и подготовьте описание.</p><button className="white-btn" onClick={()=>setGuide(!guide)}>Как написать пресс-релиз?<ArrowRight/></button></div><div className="promo-rings"><Megaphone/><i/><i/><i/></div></section>{guide&&<div className="panel promo-guide"><PanelHead title="Структура пресс-релиза" action="Использовать шаблон" onClick={()=>set('release_info','1. Коротко о релизе: жанр, настроение, история создания.\\n2. Почему трек может зайти редакторам: хуки, аудитория, контекст.\\n3. Референсы: похожие артисты/плейлисты.\\n4. План продвижения: клипы, соцсети, инфоповоды.')}/><ol><li>Начните с одной сильной фразы: о чём релиз и кому он подойдёт.</li><li>Опишите настроение, жанр, историю создания и фокус-трек.</li><li>Добавьте референсы и ссылки на соцсети артиста.</li><li>Не пишите слишком длинно — редактору нужно быстро понять ценность.</li></ol></div>}<div className="panel pitch-form"><PanelHead title="Заявка на питчинг" action=""/>{sent&&<div className="auth-error success">Заявка отправлена команде Insomnia</div>}<label>Выберите релиз<select value={form.release_id} onChange={e=>set('release_id',e.target.value)}>{releases.map(r=><option value={r.id} key={r.id}>{r.title}</option>)}</select></label><label>Информация о релизе<textarea value={form.release_info} onChange={e=>set('release_info',e.target.value)} placeholder="О чём трек, настроение, история создания, референсы"/></label><label>Фокус-трек для EP и альбомов<input value={form.focus_track} onChange={e=>set('focus_track',e.target.value)} placeholder="Название трека"/></label><label>Информация об артисте<textarea value={form.artist_info} onChange={e=>set('artist_info',e.target.value)} placeholder="Кто артист, достижения, ссылки на соцсети"/></label><div className="form-actions"><button className="secondary" onClick={()=>setForm({release_id:releases[0]?.id||'',release_info:'',focus_track:'',artist_info:''})}>Отмена</button><button className="primary" onClick={submit}>Отправить</button></div></div><div className="promo-options">{[['01','Питчинг','Отправим релиз редакторам площадок и поможем оформить заявку.'],['02','Посевы','Нативные размещения в тематических сообществах.'],['03','Стратегия','Соберём индивидуальный план продвижения под бюджет.']].map(x=><article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p><button onClick={()=>document.querySelector('.pitch-form')?.scrollIntoView({behavior:'smooth'})}>Обсудить<ArrowRight/></button></article>)}</div></div>
}

function PromoLinks({links,onCreateLink,onDeleteLink,releases=[]}){
 const firstRelease=releases[0]||{id:'',title:'Новый релиз'};
 const [form,setForm]=useState({release_id:firstRelease.id,title:firstRelease.title,slug:makeSlug(firstRelease.title),yandex:'https://music.yandex.ru',vk:'https://vk.com/music',apple:'https://music.apple.com',spotify:''});
 const [copied,setCopied]=useState('');
 const [error,setError]=useState('');
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const updateRelease=id=>{const release=releases.find(r=>String(r.id)===String(id))||firstRelease;setForm(f=>({...f,release_id:release.id,title:release.title,slug:makeSlug(release.title)}))};
 const create=()=>{const bad=['yandex','vk','apple','spotify'].find(key=>form[key]&& !isValidUrl(form[key]));if(bad){setError('Проверьте ссылки: каждая должна начинаться с https://');return}setError('');onCreateLink(form)};
 const copy=async url=>{try{await navigator.clipboard?.writeText(url)}catch{}setCopied(url);setTimeout(()=>setCopied(''),2500)};
 const releaseOptions=releases.length?releases:[firstRelease];
 return <div className="page fade promo-links-page"><div className="page-title"><div><span className="eyebrow">SMART LINKS</span><h1>Промо-ссылки</h1><p>Создавайте одну красивую страницу, где слушатель увидит все площадки релиза.</p></div><button className="primary" onClick={create}><Plus/>Создать линкс</button></div><div className="panel link-builder smart-form"><PanelHead title="Новый линкс" action=""/>{error&&<div className="auth-error">{error}</div>}<div className="field-row"><label>Релиз<select value={form.release_id} onChange={e=>updateRelease(e.target.value)}>{releaseOptions.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label><label>Slug<input value={form.slug} onChange={e=>set('slug',makeSlug(e.target.value))} placeholder="midnight-echoes"/><small className="field-hint">Будет ссылка: {publicLinkUrl(form.slug)}</small></label></div><div className="field-row"><label>Яндекс Музыка<input value={form.yandex} onChange={e=>set('yandex',e.target.value)} placeholder="https://music.yandex.ru/..."/></label><label>VK Музыка<input value={form.vk} onChange={e=>set('vk',e.target.value)} placeholder="https://vk.com/..."/></label></div><div className="field-row"><label>Apple Music<input value={form.apple} onChange={e=>set('apple',e.target.value)} placeholder="https://music.apple.com/..."/></label><label>Spotify<input value={form.spotify} onChange={e=>set('spotify',e.target.value)} placeholder="необязательно"/></label></div></div>{links.length===0&&<div className="panel empty-state"><Link/><h3>Промо-ссылок пока нет</h3><p>Выберите релиз, добавьте ссылки на площадки и нажмите «Создать линкс».</p></div>}<div className="link-grid">{links.map(item=><article className="link-card" key={item.id}><div><Link/><span>{item.title}</span></div><a className="link-url" href={item.url} target="_blank" rel="noreferrer">{item.url}</a><div className="platform-chips">{(item.links||[]).map(x=><i key={x}>{x}</i>)}</div><div className="link-actions"><a className="secondary" href={item.url} target="_blank" rel="noreferrer"><ArrowRight/>Открыть</a><button className="secondary" onClick={()=>copy(item.url)}><Copy/>{copied===item.url?'Скопировано':'Скопировать'}</button><button className="secondary danger-btn" onClick={()=>onDeleteLink(item.id)}><X/>Удалить</button></div></article>)}</div></div>
}

function Support({currentUser}){
 const demo=[{id:1,subject:'Вопрос по релизу',status:'Открыт',messages:[{me:false,text:'Привет! Команда поддержки на связи. Чем можем помочь?',time:'18:42'}]}];
 const [tickets,setTickets]=useState(demo); const [active,setActive]=useState(1); const [messages,setMessages]=useState(demo[0].messages);
 const [text,setText]=useState(''); const [subject,setSubject]=useState('Вопрос по релизу'); const [error,setError]=useState('');
 const tkn=()=>localStorage.getItem('im_token');
 const ticket=tickets.find(t=>t.id===active)||tickets[0];
 const loadTickets=async()=>{const token=tkn();if(!token||token==='demo')return;const rows=await api('/support/tickets',{token});setTickets(rows);if(rows.length&&!rows.some(t=>t.id===active))setActive(rows[0].id)};
 const loadMessages=async id=>{const token=tkn();if(!token||token==='demo')return;const rows=await api(`/support/tickets/${id}/messages`,{token});setMessages(rows.map(m=>({me:m.sender_id===currentUser.id,text:m.text,time:m.created_at,author:m.artist_name,role:m.role})))};
 useEffect(()=>{loadTickets().catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(active)loadMessages(active).catch(()=>{})},[active]);
 useEffect(()=>{const id=setInterval(()=>{loadTickets().catch(()=>{});if(active)loadMessages(active).catch(()=>{})},6000);return()=>clearInterval(id)},[active]);
 const createTicket=async()=>{try{setError('');const token=tkn();let item={id:Date.now(),subject,status:'Открыт'};if(token&&token!=='demo')item=await api('/support/tickets',{method:'POST',token,body:{subject}});setTickets(list=>[item,...list]);setActive(item.id);setMessages([])}catch(e){setError(e.message)}};
 const send=async()=>{if(!text.trim()||!ticket||ticket.status==='Закрыт')return;const value=text;setText('');setMessages(list=>[...list,{me:true,text:value,time:'сейчас',author:currentUser.artist}]);try{const token=tkn();if(token&&token!=='demo')await api(`/support/tickets/${ticket.id}/messages`,{method:'POST',token,body:{text:value}})}catch(e){setError(e.message)}};
 const closeTicket=async()=>{if(!ticket)return;try{const token=tkn();if(token&&token!=='demo')await api(`/support/tickets/${ticket.id}`,{method:'PATCH',token,body:{status:'Закрыт'}});setTickets(list=>list.map(t=>t.id===ticket.id?{...t,status:'Закрыт'}:t))}catch(e){setError(e.message)}};
 return <div className="page fade support"><div className="support-list"><div className="support-title"><h2>Поддержка</h2></div><div className="new-ticket"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Тема обращения"/><button className="primary" onClick={createTicket}><Plus/>Новый</button></div>{error&&<div className="auth-error">{error}</div>}{tickets.length===0&&<p className="support-empty">Диалогов пока нет.</p>}{tickets.map(t=><button className={`ticket ${t.id===active?'active':''}`} key={t.id} onClick={()=>setActive(t.id)}><span>{t.subject.slice(0,2).toUpperCase()}</span><div><b>{t.subject}</b><p>{t.artist_name||'Insomnia Market'}</p></div><small>{t.status}</small></button>)}</div><div className="chat">{ticket?<><div className="chat-head"><span>{ticket.subject.slice(0,2).toUpperCase()}</span><div><b>{ticket.subject}</b><small><i/> {currentUser?.role==='artist'?'команда Insomnia':'диалог с артистом'} · {ticket.status}</small></div><button className="secondary close-ticket" onClick={closeTicket}>Закрыть</button></div><div className="messages"><div className="date">Сегодня</div>{messages.map((m,i)=><div className={'message '+(m.me?'me':'')} key={i}><p>{m.text}</p><small>{m.author||''} · {m.time}</small></div>)}</div><div className="composer"><button className="icon" title="Вложения будут добавлены следующим этапом"><Plus/></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={ticket.status==='Закрыт'?'Тикет закрыт':'Напишите сообщение...'}/><button className="send" disabled={ticket.status==='Закрыт'} onClick={send}><Send/></button></div></>:<div className="empty-state"><MessageCircle/><h3>Выберите диалог</h3></div>}</div></div>
}

function Profile({currentUser,onSaveProfile,onAvatarUpload}){
 const [artist,setArtist]=useState(currentUser.artist||'');const [bio,setBio]=useState(currentUser.bio||'');const [city,setCity]=useState(currentUser.city||'');const [country,setCountry]=useState(currentUser.country||'');
 const [genres,setGenres]=useState((currentUser.genres||[]).join(', '));
 const initialSocial=currentUser.social_links||{};
 const [social,setSocial]=useState({vk:initialSocial.vk||'',telegram:initialSocial.telegram||'',youtube:initialSocial.youtube||'',tiktok:initialSocial.tiktok||'',instagram:initialSocial.instagram||'',site:initialSocial.site||''});
 const fileRef=useRef(null);
 const avatar=currentUser.avatar_url;
 const setLink=(key,value)=>setSocial(s=>({...s,[key]:value}));
 const save=()=>onSaveProfile({artist_name:artist,bio,city,country,genres:genres.split(',').map(x=>x.trim()).filter(Boolean),social_links:Object.fromEntries(Object.entries(social).filter(([,v])=>v.trim()))});
 return <div className="page fade upload-page"><div className="page-title"><div><span className="eyebrow">КАБИНЕТ</span><h1>Профиль артиста</h1><p>Аватарка, география, жанры и ссылки для команды Insomnia.</p></div><button className="primary" onClick={save}><Check/>Сохранить</button></div><div className="panel profile-panel"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>e.target.files?.[0]&&onAvatarUpload(e.target.files[0])}/><button className="profile-avatar" onClick={()=>fileRef.current?.click()}>{avatar?<img src={apiFileUrl(avatar)} alt="avatar"/>:<span>{(artist||'IM').slice(0,2).toUpperCase()}</span>}<small>Загрузить / заменить аватарку</small></button><div><label>Имя артиста<input value={artist} onChange={e=>setArtist(e.target.value)}/></label><label>Описание<textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Коротко об артисте, жанре, ссылках и достижениях"/></label><div className="field-row"><label>Город<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Москва"/></label><label>Страна<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Россия"/></label></div><label>Жанры<input value={genres} onChange={e=>setGenres(e.target.value)} placeholder="Pop, Indie, Electronic"/></label><div className="social-grid">{[['vk','VK'],['telegram','Telegram'],['youtube','YouTube'],['tiktok','TikTok'],['instagram','Instagram'],['site','Сайт']].map(([key,label])=><label key={key}>{label}<input value={social[key]} onChange={e=>setLink(key,e.target.value)} placeholder="https://..."/></label>)}</div></div></div></div>
}

function AdminDashboard({releases,users,payouts,admins,promoRequests,onModerate,onUpdateRelease,onBlockUser,onUpdatePayout,onAddFinance,onAddAdmin,onRemoveAdmin,onUpdatePromoStatus,section='Админка'}){
 const sectionTab=['Релизы','Кабинеты','Финансы','Промо','Команда'].includes(section)?section:'Релизы';
 const [tab,setTab]=useState(sectionTab);
 const [selected,setSelected]=useState(null);
 useEffect(()=>{setTab(sectionTab);setSelected(null)},[sectionTab]);
 const pending=releases.filter(r=>r.status==='На модерации').length;
 const waiting=payouts.filter(p=>p.status!=='Оплачено').length;
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">АДМИН-САЙТ</span><h1>Центр управления</h1><p>Релизы, кабинеты, выплаты, промо-заявки и команда — в одном рабочем центре.</p></div><div className="admin-kpis"><span>{pending} на модерации</span><span>{waiting} выплат</span><span>{users.length} кабинета</span></div></div><div className="tabs admin-tabs">{['Релизы','Кабинеты','Финансы','Промо','Команда'].map(x=><button className={tab===x?'active':''} onClick={()=>{setTab(x);setSelected(null)}} key={x}>{x}</button>)}</div>{tab==='Релизы'&&selected&&<AdminReleaseDetail release={selected} onBack={()=>setSelected(null)} onModerate={onModerate} onUpdateRelease={onUpdateRelease}/>} {tab==='Релизы'&&!selected&&<AdminReleases releases={releases} onOpen={setSelected} onModerate={onModerate} onUpdateRelease={onUpdateRelease}/>} {tab==='Кабинеты'&&<AdminAccounts users={users} onBlockUser={onBlockUser}/>} {tab==='Финансы'&&<AdminFinance users={users} payouts={payouts} onUpdatePayout={onUpdatePayout} onAddFinance={onAddFinance}/>} {tab==='Промо'&&<AdminPromo requests={promoRequests} releases={releases} onUpdateStatus={onUpdatePromoStatus}/>} {tab==='Команда'&&<AdminTeam admins={admins} onAddAdmin={onAddAdmin} onRemoveAdmin={onRemoveAdmin}/>}</div>
}

function AdminReleases({releases,onOpen,onModerate,onUpdateRelease}){
 const [reason,setReason]=useState('Не хватает корректной обложки / данных по релизу.');
 const [query,setQuery]=useState('');const [status,setStatus]=useState('Все');
 const shown=releases.filter(r=>(status==='Все'||r.status===status)&&`${r.title} ${r.artist} ${r.genre}`.toLowerCase().includes(query.toLowerCase()));
 return <><div className="panel admin-filters"><div className="field-row"><label>Поиск по релизам<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Название, артист, жанр"/></label><label>Статус<select value={status} onChange={e=>setStatus(e.target.value)}>{['Все','На модерации','Принят','Черновик'].map(x=><option key={x}>{x}</option>)}</select></label></div></div>{shown.length===0&&<div className="panel empty-state"><Album/><h3>Релизы не найдены</h3><p>Смените поиск или статус.</p></div>}<div className="admin-release-grid">{shown.map(r=><article className="panel admin-release-card" key={r.id}><div className="admin-release-head"><Cover kind={r.cover}/><div><span>{r.artist}</span><h3>{r.title}</h3><p>{r.type} · {r.genre} · дата: {r.releaseDate}</p></div><Badge status={r.status}/></div><div className="release-data"><label>Прослушивания<input type="number" defaultValue={r.streams} onBlur={e=>onUpdateRelease(r.id,{streams:Number(e.target.value)})}/></label><label>UPC<input defaultValue={r.upc} placeholder="Вписать UPC" onBlur={e=>onUpdateRelease(r.id,{upc:e.target.value})}/></label><label>ISRC<input defaultValue={r.isrc} placeholder="Вписать ISRC" onBlur={e=>onUpdateRelease(r.id,{isrc:e.target.value})}/></label></div><div className="admin-comment"><b>Информация релиза</b><p>{r.comment}</p><small>Площадки: {r.platforms.join(', ')}</small></div><label>Причина отклонения<textarea value={reason} onChange={e=>setReason(e.target.value)}/></label><div className="admin-actions"><button className="secondary" onClick={()=>onOpen(r)}><Edit3/>Открыть</button><button className="secondary" onClick={()=>onModerate(r.id,'Черновик',reason)}><X/>Отклонить</button><button className="primary" onClick={()=>onModerate(r.id,'Принят','')}><Check/>Принять релиз</button></div></article>)}</div></>
}

function AdminReleaseDetail({release,onBack,onModerate,onUpdateRelease}){
 const [reason,setReason]=useState(release.reason||'');
 const [form,setForm]=useState({streams:release.streams||0,upc:release.upc||'',isrc:release.isrc||''});
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const save=()=>onUpdateRelease(release.id,{streams:Number(form.streams)||0,upc:form.upc,isrc:form.isrc});
 return <div className="admin-detail"><button className="back" onClick={onBack}>← Назад к списку релизов</button><div className="detail-hero panel"><div>{release.cover_url?<img className="detail-cover-img" src={apiFileUrl(release.cover_url)} alt={release.title}/>:<Cover kind={release.cover} large/>}</div><div className="detail-info"><span className="eyebrow">МОДЕРАЦИЯ</span><h1>{release.title}</h1><p>{release.artist} · {release.type} · {release.genre}</p><Badge status={release.status}/><div className="detail-actions"><button className="primary" onClick={()=>onModerate(release.id,'Принят','')}><Check/>Принять</button><button className="secondary danger-btn" onClick={()=>onModerate(release.id,'Черновик',reason||'Необходимо исправить данные релиза')}><X/>Отклонить</button></div></div></div><div className="grid-two"><div className="panel"><PanelHead title="Ручные данные" action=""/><div className="release-data vertical"><label>Прослушивания<input type="number" value={form.streams} onChange={e=>set('streams',e.target.value)}/></label><label>UPC<input value={form.upc} onChange={e=>set('upc',e.target.value)} placeholder="UPC релиза"/></label><label>ISRC<input value={form.isrc} onChange={e=>set('isrc',e.target.value)} placeholder="ISRC трека"/></label><button className="primary" onClick={save}><Check/>Сохранить данные</button></div></div><div className="panel"><PanelHead title="Аудио и файлы" action=""/>{release.audio_url?<audio controls src={apiFileUrl(release.audio_url)} className="audio-player"/>:<div className="empty-state small"><FileAudio/><p>Аудиофайл не прикреплён</p></div>}<div className="detail-list"><span>Дата релиза <b>{release.releaseDate||'не указана'}</b></span><span>Площадки <b>{release.platforms?.join(', ')||'не выбраны'}</b></span></div></div></div><div className="panel"><PanelHead title="Комментарий артиста и причина отклонения" action=""/><p className="detail-text">{release.comment||'Комментарий артиста не указан.'}</p><label>Причина отклонения<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Напишите причину, если релиз нужно вернуть в черновик"/></label></div></div>
}

function AdminAccounts({users,onBlockUser}){
 return <div className="panel admin-table"><div className="tr th"><span>Кабинет</span><span>Почта</span><span>Регистрация</span><span>Статус</span></div>{users.map(u=><div className="tr" key={u.id}><span className="admin-name"><i>{u.artist.split(' ').map(x=>x[0]).join('').slice(0,2)}</i><b>{u.artist}</b></span><span>{u.email}</span><span>{u.registered}</span><span className={u.status==='Заблокирован'?'danger':'online'}>{u.status}<button onClick={()=>onBlockUser(u.id)}><Ban/>{u.status==='Заблокирован'?'Разблокировать':'Блок'}</button></span></div>)}</div>
}

function AdminFinance({users,payouts,onUpdatePayout,onAddFinance}){
 const [form,setForm]=useState({user_id:users[0]?.id||'',period:'Июнь 2026',source:'Все площадки',amount:''});
 const [filter,setFilter]=useState('Все');
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const add=()=>{onAddFinance(form);set('amount','')};
 const rows=filter==='Все'?payouts:payouts.filter(p=>p.status===filter);
 return <div className="grid-two"><div className="panel transactions"><PanelHead title="Заявки на выплаты" action=""/><div className="tabs compact-tabs">{['Все','Ожидает выплаты','Оплачено','Отклонено'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="mini-list">{rows.map(p=><div className="mini-row finance-request" key={p.id}><span><CreditCard/>{p.artist}<small>{p.card}</small></span><b>{p.amount.toLocaleString('ru')} ₽</b><small className={p.status==='Оплачено'?'paid':p.status==='Отклонено'?'danger':''}>{p.status}</small>{p.status==='Ожидает выплаты'&&<div className="inline-actions"><button className="primary" onClick={()=>onUpdatePayout(p.id,'Оплачено')}>Оплачено</button><button className="secondary danger-btn" onClick={()=>onUpdatePayout(p.id,'Отклонено')}>Отклонить</button></div>}</div>)}{rows.length===0&&<div className="empty-line">Заявок с таким статусом нет.</div>}</div></div><div className="panel transactions"><PanelHead title="Ручное начисление" action=""/><div className="field-row"><label>Кабинет<select value={form.user_id} onChange={e=>set('user_id',e.target.value)}>{users.map(u=><option value={u.id} key={u.id}>{u.artist}</option>)}</select></label><label>Сумма<input value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="32840"/></label></div><div className="field-row"><label>Период<input value={form.period} onChange={e=>set('period',e.target.value)}/></label><label>Источник<input value={form.source} onChange={e=>set('source',e.target.value)}/></label></div><button className="primary" onClick={add}><Plus/>Добавить начисление</button><div className="mini-list finance-balances">{users.map(u=><div className="mini-row" key={u.id}><span><Wallet/>{u.artist}</span><b>{Math.max((u.balance||0)-(u.paid||0),0).toLocaleString('ru')} ₽</b><small>Начислено: {(u.balance||0).toLocaleString('ru')} ₽ · выплачено: {(u.paid||0).toLocaleString('ru')} ₽</small></div>)}</div></div></div>
}

function AdminPromo({requests,releases,onUpdateStatus}){
 const releaseTitle=id=>releases.find(r=>r.id===id)?.title||'Релиз не выбран';
 const statuses=['Новая','В работе','Отправлено редакторам','Выполнено','Отклонено'];
 return <div className="admin-release-grid">{requests.length===0&&<div className="panel empty-state"><Megaphone/><h3>Промо-заявок пока нет</h3><p>Когда артист отправит питчинг, заявка появится здесь.</p></div>}{requests.map(req=><article className="panel admin-release-card" key={req.id}><div className="admin-release-head"><div className="metric-icon"><Megaphone/></div><div><span>{req.artist_name||'Артист'}</span><h3>{releaseTitle(req.release_id)}</h3><p>{req.created_at}</p></div><span className="badge на-модерации">{req.status}</span></div><label>Ручной статус<select value={req.status} onChange={e=>onUpdateStatus(req.id,e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label><div className="admin-comment"><b>Информация о релизе</b><p>{req.release_info}</p></div>{req.focus_track&&<div className="admin-comment"><b>Фокус-трек</b><p>{req.focus_track}</p></div>}<div className="admin-comment"><b>Информация об артисте</b><p>{req.artist_info}</p></div></article>)}</div>
}

function AdminTeam({admins,onAddAdmin,onRemoveAdmin}){
 const [open,setOpen]=useState(false);
 const [form,setForm]=useState({email:'',name:'',password:'admin123',role:'admin'});
 const [error,setError]=useState('');
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const access={owner:'Полный доступ',admin:'Релизы, финансы, кабинеты',moderator:'Релизы и модерация',support:'Поддержка и промо',finance:'Финансы и выплаты'};
 const roleName={owner:'Владелец',admin:'Админ',moderator:'Модератор',support:'Поддержка',finance:'Финансы'};
 const submit=()=>{if(!form.name||!form.email||form.password.length<6){setError('Заполните имя, email и пароль от 6 символов');return}setError('');onAddAdmin(form);setForm({email:'',name:'',password:'admin123',role:'admin'});setOpen(false)};
 return <div><div className="page-title compact"><div><span className="eyebrow">КОМАНДА</span><h1>Администраторы</h1><p>Владелец может добавлять роли для модерации, поддержки и финансов.</p></div><button className="primary" onClick={()=>setOpen(!open)}><Plus/>Добавить администратора</button></div>{open&&<div className="panel admin-form admin-team-form"><PanelHead title="Новый администратор" action=""/>{error&&<div className="auth-error">{error}</div>}<div className="field-row"><label>Имя<input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Алина Исаева"/></label><label>Email<input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="admin@example.com"/></label></div><div className="field-row"><label>Пароль<input value={form.password} onChange={e=>set('password',e.target.value)} placeholder="минимум 6 символов"/></label><label>Роль<select value={form.role} onChange={e=>set('role',e.target.value)}><option value="admin">Админ</option><option value="moderator">Модератор</option><option value="support">Поддержка</option><option value="finance">Финансы</option></select></label></div><div className="role-preview"><ShieldCheck/><div><b>{roleName[form.role]}</b><p>{access[form.role]}</p></div></div><div className="form-actions"><button className="secondary" onClick={()=>setOpen(false)}>Отмена</button><button className="primary" onClick={submit}><Check/>Создать</button></div></div>}<div className="panel admin-table"><div className="tr th"><span>Администратор</span><span>Роль</span><span>Доступ</span><span>Статус</span></div>{admins.map(x=><div className="tr" key={x.id}><span className="admin-name"><i>{x.initials}</i><b>{x.name}</b></span><span>{roleName[x.role]||x.role}</span><span>{access[x.role]||x.access}</span><span className="online">Активен {x.role!=='owner'&&<button onClick={()=>onRemoveAdmin(x.id)}>Удалить</button>}</span></div>)}</div></div>
}

function App(){
 if(location.pathname.includes('/p/'))return <PublicSmartLink/>;
 const [logged,setLogged]=useState(()=>!!localStorage.getItem('im_token'));
 const [currentUser,setCurrentUser]=useState(()=>JSON.parse(localStorage.getItem('im_user')||'{"id":1,"artist":"Luna Ray","role":"artist"}'));
 const [page,setPage]=useState(()=>currentUser.role==='artist'?'Главная':'Админка');const [menu,setMenu]=useState(false);const [releases,setReleases]=useState(demoReleases);
 const [users,setUsers]=useState(demoUsers);const [payouts,setPayouts]=useState(demoPayouts);const [finance,setFinance]=useState({balance:86420.5,accrued:86420.5,paid:0,pending:0,history:[{id:'demo-1',period:'Май 2026',source:'Все площадки',status:'Начислено',amount:32840},{id:'demo-2',period:'Апрель 2026',source:'Все площадки',status:'Начислено',amount:28190},{id:'demo-3',period:'Март 2026',source:'Все площадки',status:'Начислено',amount:25390}]});const [admins,setAdmins]=useState(demoAdmins);const [promoLinks,setPromoLinks]=useState(demoPromoLinks);const [news,setNews]=useState(demoNews);const [promoRequests,setPromoRequests]=useState([]);
 const [selectedRelease,setSelectedRelease]=useState(null);
 const [editingRelease,setEditingRelease]=useState(null);
 const [notifications,setNotifications]=useState([{id:'welcome',channel:'app',subject:'Добро пожаловать',body:'Кабинет Insomnia Market готов к работе.',read:false}]);
 const [toasts,setToasts]=useState([]);
 const [theme,setTheme]=useState(()=>localStorage.getItem('im_theme')||'dark');
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('im_theme',theme)},[theme]);
 useEffect(()=>{if(page!=='Загрузить релиз'&&editingRelease)setEditingRelease(null)},[page,editingRelease]);
 const toggleTheme=()=>setTheme(value=>value==='dark'?'light':'dark');
 const pushToast=(title,text,type='ok')=>{const id=Date.now()+Math.random();setToasts(list=>[...list,{id,title,text,type}]);setTimeout(()=>setToasts(list=>list.filter(x=>x.id!==id)),4200)};
 const pushNotification=(subject,body,channel='app')=>setNotifications(list=>[{id:Date.now()+Math.random(),channel,subject,body,read:false},...list]);
 const readAll=async()=>{setNotifications(list=>list.map(x=>({...x,read:true})));const t=token();if(t&&t!=='demo')try{await api('/notifications/read-all',{method:'PATCH',token:t})}catch{}};
 const setSession=(user,token='demo')=>{localStorage.setItem('im_token',token);localStorage.setItem('im_user',JSON.stringify(user));setCurrentUser(user);setPage(user.role==='artist'?'Главная':'Админка');setLogged(true)};
 const login=async data=>{if(DEMO_MODE){const staff=data.email.includes('owner')||data.email.includes('admin');setSession(staff?{id:10,artist:'Команда Insomnia',role:'owner'}:{id:1,artist:data.artist_name||'Luna Ray',role:'artist'});pushToast('Вход выполнен','Открыт демо-кабинет');return}const endpoint=data.register?'register':'login';const body=data.register?{email:data.email,password:data.password,artist_name:data.artist_name}:{email:data.email,password:data.password};const json=await api(`/auth/${endpoint}`,{method:'POST',body});setSession({id:json.user.id,artist:json.user.artist_name,role:json.user.role,avatar_url:json.user.avatar_url,bio:json.user.bio,city:json.user.city,country:json.user.country,genres:json.user.genres||[],social_links:json.user.social_links||{}},json.token);pushToast('Вход выполнен',`Добро пожаловать, ${json.user.artist_name}`)};
 const token=()=>localStorage.getItem('im_token');
 const logout=async()=>{const t=token();if(t&&t!=='demo')try{await api('/auth/logout',{method:'DELETE',token:t})}catch{}localStorage.removeItem('im_token');localStorage.removeItem('im_user');setLogged(false)};
 const normalizeRelease=(r,i=0)=>({id:r.id,userId:r.user_id,title:r.title,artist:r.artist_name||currentUser.artist||'Luna Ray',type:r.release_type,date:r.release_date||'Без даты',releaseDate:r.release_date,status:r.status,reason:r.rejection_reason,streams:r.streams||0,cover:['neon','midnight','cold'][i%3],upc:r.upc||'',isrc:r.isrc||'',cover_url:r.cover_url,audio_url:r.audio_url,genre:r.genre||'Pop',platforms:r.platforms||[],comment:r.comment||'',contributors:r.contributors||{}});
 useEffect(()=>{if(!logged)return;const t=token();if(t==='demo')return;api('/news').then(setNews).catch(()=>{});api('/notifications',{token:t}).then(rows=>setNotifications(rows.map(x=>({...x,read:!!x.read})))).catch(()=>{});api('/releases',{token:t}).then(rows=>setReleases(rows.map(normalizeRelease))).catch(e=>pushToast('Не удалось загрузить релизы',e.message,'error'));api('/finance',{token:t}).then(fin=>{setFinance({balance:fin.balance||0,accrued:fin.accrued||0,paid:fin.paid||0,pending:fin.pending||0,history:fin.history||[]});setPayouts((fin.payouts||[]).map(p=>({id:p.id,userId:p.user_id,artist:currentUser.artist,amount:p.amount,card:p.card_number,status:p.status,date:p.created_at})))}).catch(()=>{});api('/promo/requests',{token:t}).then(rows=>setPromoRequests(rows)).catch(()=>{});if(currentUser.role!=='artist'){api('/admin/accounts',{token:t}).then(rows=>setUsers(rows.map(u=>({id:u.id,email:u.email,artist:u.artist_name,role:u.role,status:u.active?'Активен':'Заблокирован',registered:u.created_at,balance:u.balance||0,paid:u.paid||0})))).catch(()=>{});api('/admin/payouts',{token:t}).then(rows=>setPayouts(rows.map(p=>({id:p.id,userId:p.user_id,artist:p.artist_name,amount:p.amount,card:p.card_number,status:p.status,date:p.created_at})))).catch(()=>{});api('/admin/users',{token:t}).then(rows=>setAdmins(rows.map(u=>({id:u.id,initials:u.artist_name.split(' ').map(x=>x[0]).join('').slice(0,2),name:u.artist_name,role:u.role,access:'Админка',active:u.active})))).catch(()=>{})}else{api('/smart-links',{token:t}).then(rows=>setPromoLinks(rows.map(normalizeSmartLink))).catch(e=>pushToast('Не удалось загрузить промо-ссылки',e.message,'error'))}},[logged,currentUser.role]);
 const uploadFile=async file=>{const t=token();if(t==='demo'){pushToast('Файл выбран',file.name);return {url:URL.createObjectURL(file)}}const data=new FormData();data.append('file',file);const saved=await api('/uploads',{method:'POST',body:data,form:true,token:t});pushToast('Файл загружен',file.name);return saved};
 const createRelease=async release=>{try{release={...release,userId:currentUser.id,artist:currentUser.artist,genre:release.genre||'Pop',releaseDate:release.release_date,upc:'',isrc:'',platforms:release.platforms||[],comment:release.comment};const t=token();if(t!=='demo'){const saved=await api('/releases',{method:'POST',token:t,body:{title:release.title,release_type:release.release_type,genre:release.genre,language:release.language,release_date:release.release_date,cover_url:release.cover_url,audio_url:release.audio_url,lyrics:release.lyrics,contributors:JSON.stringify(release.contributors||{}),platforms:release.platforms,comment:release.comment}});release=normalizeRelease(saved)}setReleases(list=>[release,...list]);pushToast('Релиз отправлен','Он появился у команды на модерации');pushNotification('Релиз отправлен',`«${release.title}» ожидает ручной проверки.`)}catch(e){pushToast('Ошибка релиза',e.message,'error');throw e}};
 const updateOwnRelease=async(id,release)=>{try{const t=token();let updated={...release,id,userId:currentUser.id,artist:currentUser.artist,status:'На модерации',reason:''};if(t!=='demo'){const saved=await api(`/releases/${id}`,{method:'PATCH',token:t,body:{title:release.title,release_type:release.release_type,genre:release.genre,language:release.language,release_date:release.release_date,cover_url:release.cover_url,audio_url:release.audio_url,lyrics:release.lyrics,contributors:JSON.stringify(release.contributors||{}),platforms:release.platforms,comment:release.comment}});updated=normalizeRelease(saved)}setReleases(list=>list.map(r=>r.id===id?updated:r));setEditingRelease(null);pushToast('Релиз повторно отправлен','Исправленная версия ушла на модерацию')}catch(e){pushToast('Ошибка исправления',e.message,'error');throw e}};
 const moderateRelease=async(id,status,reason='')=>{try{const t=token();if(t!=='demo')await api(`/admin/releases/${id}/moderation`,{method:'PATCH',token:t,body:{status,reason}});setReleases(list=>list.map(r=>r.id===id?{...r,status,reason:status==='Черновик'?reason:'',upc:status==='Принят'&&!r.upc?'463011990'+String(id).padStart(4,'0'):r.upc,isrc:status==='Принят'&&!r.isrc?'RUIIM26'+String(id).padStart(5,'0'):r.isrc}:r));pushToast('Статус обновлён',status);pushNotification('Модерация релиза',`Статус изменён на «${status}».`)}catch(e){pushToast('Ошибка модерации',e.message,'error')}};
 const updateRelease=async(id,patch)=>{try{const t=token();if(t!=='demo'){if('streams'in patch)await api(`/admin/releases/${id}/stats`,{method:'PATCH',token:t,body:{streams:patch.streams}});if('upc'in patch||'isrc'in patch){const old=releases.find(r=>r.id===id)||{};await api(`/admin/releases/${id}/codes`,{method:'PATCH',token:t,body:{upc:patch.upc??old.upc,isrc:patch.isrc??old.isrc}})}}setReleases(list=>list.map(r=>r.id===id?{...r,...patch}:r));pushToast('Релиз сохранён','Данные обновлены')}catch(e){pushToast('Ошибка сохранения',e.message,'error')}};
 const requestPayout=async data=>{try{const amount=Number(data.amount);const card=data.card;const t=token();let item={id:Date.now(),userId:currentUser.id,artist:currentUser.artist,amount,card,status:'Ожидает выплаты',date:'сегодня',holder:data.holder,bank:data.bank};if(t!=='demo'){const saved=await api('/finance/payouts',{method:'POST',token:t,body:{amount,card_number:card}});item={...item,id:saved.id}}setPayouts(list=>[item,...list]);setFinance(f=>({...f,balance:Math.max((f.balance||0)-amount,0),pending:(f.pending||0)+amount}));pushToast('Заявка отправлена','Команда увидит её в админке');pushNotification('Заявка на выплату',`Запрошено ${amount.toLocaleString('ru')} ₽`) }catch(e){pushToast('Ошибка выплаты',e.message,'error')}};
 const updatePayoutStatus=async(id,status)=>{try{const t=token();if(t!=='demo')await api(`/admin/payouts/${id}`,{method:'PATCH',token:t,body:{status}});const payout=payouts.find(p=>p.id===id);setPayouts(list=>list.map(p=>p.id===id?{...p,status}:p));if(status==='Оплачено'&&payout){setUsers(list=>list.map(u=>u.id===payout.userId?{...u,paid:(u.paid||0)+Number(payout.amount||0)}:u))}pushToast(status==='Оплачено'?'Выплата оплачена':'Выплата отклонена','Статус заявки обновлён')}catch(e){pushToast('Ошибка выплаты',e.message,'error')}};
 const blockUser=async id=>{try{const user=users.find(u=>u.id===id);const active=user?.status==='Заблокирован';const t=token();if(t!=='demo')await api(`/admin/accounts/${id}`,{method:'PATCH',token:t,body:{active}});setUsers(list=>list.map(u=>u.id===id?{...u,status:u.status==='Заблокирован'?'Активен':'Заблокирован'}:u));pushToast(active?'Кабинет разблокирован':'Кабинет заблокирован',user?.artist||'Пользователь')}catch(e){pushToast('Ошибка кабинета',e.message,'error')}};
 const addAdmin=async({email,name,password,role})=>{try{if(!email||!name||!password)throw new Error('Заполните имя, email и пароль');const t=token();let admin={id:Date.now(),initials:name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),name,role,access:'Админка',active:true};if(t!=='demo'){const saved=await api('/admin/users',{method:'POST',token:t,body:{email,password,name,role}});admin={...admin,id:saved.id}}setAdmins(list=>[...list,admin]);pushToast('Администратор добавлен',name)}catch(e){pushToast('Ошибка администратора',e.message,'error')}};
 const removeAdmin=async id=>{try{const target=admins.find(a=>a.id===id);const t=token();if(t!=='demo')await api(`/admin/users/${id}`,{method:'DELETE',token:t});setAdmins(list=>list.filter(a=>a.id!==id));pushToast('Администратор удалён',target?.name||'Пользователь')}catch(e){pushToast('Ошибка удаления',e.message,'error')}};
 const createNews=async body=>{try{if(!body.title||!body.body)throw new Error('Заполните заголовок и текст новости');const t=token();let item={id:Date.now(),...body,published_at:'сегодня'};if(t!=='demo')item=await api('/admin/news',{method:'POST',token:t,body});setNews(list=>[item,...list]);pushToast('Новость опубликована',item.title)}catch(e){pushToast('Ошибка новости',e.message,'error')}};
 const updateNews=async(id,body)=>{try{if(!body.title||!body.body)throw new Error('Заполните заголовок и текст новости');const t=token();let item={id,...body,published_at:news.find(n=>n.id===id)?.published_at||'сегодня'};if(t!=='demo')item=await api(`/admin/news/${id}`,{method:'PATCH',token:t,body});setNews(list=>list.map(n=>n.id===id?{...n,...item}:n));pushToast('Новость обновлена',item.title)}catch(e){pushToast('Ошибка новости',e.message,'error')}};
 const deleteNews=async id=>{try{const t=token();if(t!=='demo')await api(`/admin/news/${id}`,{method:'DELETE',token:t});setNews(list=>list.filter(n=>n.id!==id));pushToast('Новость удалена','Материал скрыт из кабинета')}catch(e){pushToast('Ошибка удаления новости',e.message,'error')}};
 const addFinance=async body=>{try{const t=token();if(!body.user_id||!body.amount)throw new Error('Выберите кабинет и сумму');const amount=Number(body.amount);let saved={id:Date.now(),...body,amount,status:'Начислено'};if(t!=='demo')saved=await api('/admin/finance',{method:'POST',token:t,body:{user_id:Number(body.user_id),period:body.period,source:body.source,amount,status:'Начислено'}});setUsers(list=>list.map(u=>u.id===Number(body.user_id)?{...u,balance:(u.balance||0)+amount}:u));if(Number(body.user_id)===currentUser.id)setFinance(f=>({...f,balance:(f.balance||0)+amount,accrued:(f.accrued||0)+amount,history:[{id:saved.id,period:body.period,source:body.source,status:'Начислено',amount},...(f.history||[])]}));pushToast('Начисление добавлено',`${amount.toLocaleString('ru')} ₽`) }catch(e){pushToast('Ошибка начисления',e.message,'error')}};
 const updatePromoStatus=async(id,status)=>{try{const t=token();if(t!=='demo')await api(`/promo/requests/${id}`,{method:'PATCH',token:t,body:{status}});setPromoRequests(list=>list.map(x=>x.id===id?{...x,status}:x));pushToast('Статус промо обновлён',status)}catch(e){pushToast('Ошибка промо-статуса',e.message,'error')}};
 const createPromoLink=async data=>{try{const title=typeof data==='string'?data:data.title;const raw=typeof data==='string'?{slug:makeSlug(data),yandex:'https://music.yandex.ru',vk:'https://vk.com/music',apple:'https://music.apple.com'}:data;const links={};[['Яндекс Музыка','yandex'],['VK Музыка','vk'],['Apple Music','apple'],['Spotify','spotify']].forEach(([name,key])=>{if(raw[key])links[name]=raw[key]});if(!title?.trim())throw new Error('Выберите релиз или укажите название линкса');if(!Object.keys(links).length)throw new Error('Добавьте хотя бы одну ссылку на площадку');Object.entries(links).forEach(([name,url])=>{if(!isValidUrl(url))throw new Error(`${name}: ссылка должна начинаться с https://`)});const t=token();let slug=makeSlug(raw.slug||title);let item=normalizeSmartLink({id:Date.now(),title,slug,url:publicLinkUrl(slug),links});if(t!=='demo'){const saved=await api('/smart-links',{method:'POST',token:t,body:{release_id:Number(raw.release_id)||null,title,slug,links}});item=normalizeSmartLink(saved)}setPromoLinks(list=>[item,...list]);pushToast('Промо-ссылка создана',item.url)}catch(e){pushToast('Ошибка линкса',e.message,'error')}};
 const deletePromoLink=async id=>{try{const t=token();if(t!=='demo')await api(`/smart-links/${id}`,{method:'DELETE',token:t});setPromoLinks(list=>list.filter(x=>x.id!==id));pushToast('Промо-ссылка удалена','Линкс удалён из кабинета и публичной выдачи')}catch(e){pushToast('Ошибка удаления линкса',e.message,'error')}};
 const createPromoRequest=async body=>{try{const t=token();if(t!=='demo')await api('/promo/requests',{method:'POST',token:t,body});pushToast('Промо-заявка отправлена','Команда Insomnia получила заявку');pushNotification('Промо-заявка','Заявка отправлена команде')}catch(e){pushToast('Ошибка промо',e.message,'error');throw e}};
 const sendSupport=async text=>{try{const t=token();if(t==='demo'){pushToast('Сообщение отправлено','Демо-чат обновлён');return}let tickets=[];try{tickets=await api('/support/tickets',{token:t})}catch{}let ticket=tickets[0];if(!ticket)ticket=await api('/support/tickets',{method:'POST',token:t,body:{subject:'Вопрос из кабинета'}});await api(`/support/tickets/${ticket.id}/messages`,{method:'POST',token:t,body:{text}});pushToast('Сообщение отправлено','Поддержка увидит его в тикете')}catch(e){pushToast('Ошибка чата',e.message,'error')}};
 const saveProfile=async body=>{try{const t=token();let updated={...currentUser,artist:body.artist_name,bio:body.bio,city:body.city,country:body.country,genres:body.genres,social_links:body.social_links};if(t!=='demo'){const saved=await api('/me',{method:'PATCH',token:t,body});updated={...currentUser,artist:saved.artist_name,bio:saved.bio,avatar_url:saved.avatar_url,city:saved.city,country:saved.country,genres:saved.genres||[],social_links:saved.social_links||{}}}localStorage.setItem('im_user',JSON.stringify(updated));setCurrentUser(updated);pushToast('Профиль сохранён','Данные артиста обновлены')}catch(e){pushToast('Ошибка профиля',e.message,'error')}};
 const uploadAvatar=async file=>{try{const t=token();let url=URL.createObjectURL(file);if(t!=='demo'){const data=new FormData();data.append('file',file);const saved=await api('/me/avatar',{method:'POST',body:data,form:true,token:t});url=saved.url}const updated={...currentUser,avatar_url:url};localStorage.setItem('im_user',JSON.stringify(updated));setCurrentUser(updated);pushToast('Аватарка загружена',file.name)}catch(e){pushToast('Ошибка аватарки',e.message,'error')}};
 if(!logged)return <Login onLogin={login} theme={theme} onToggleTheme={toggleTheme}/>;
 const artistReleases=releases.filter(r=>currentUser.role!=='artist'||r.userId===currentUser.id);
 const openRelease=release=>{setSelectedRelease(release);setPage('Релиз')};
 const promoFromRelease=release=>{setPage('Промо');pushToast('Релиз выбран',`Заполните промо-заявку для «${release.title}»`)};
 const linkFromRelease=release=>{createPromoLink({release_id:release.id,title:release.title,slug:makeSlug(release.title),yandex:'https://music.yandex.ru',vk:'https://vk.com/music',apple:'https://music.apple.com'});setPage('Промо-ссылки')};
 const fixRelease=release=>{setEditingRelease(release);setPage('Загрузить релиз');pushToast('Исправление релиза',`Поля заполнены данными «${release.title}». После отправки статус снова станет «На модерации».`)};
 const baseSearch=[
   ...artistReleases.map(r=>({id:r.id,type:'Релиз',title:r.title,subtitle:`${r.status} · ${r.artist}`,page:'Релизы'})),
   ...promoLinks.map(l=>({id:l.id,type:'Промо-ссылка',title:l.title,subtitle:l.url,page:'Промо-ссылки'})),
   ...news.map(n=>({id:n.id,type:'Новость',title:n.title,subtitle:n.category,page:currentUser.role==='artist'?'Новости':'Админка'})),
   ...promoRequests.map(p=>({id:p.id,type:'Промо-заявка',title:p.artist_name||'Моя заявка',subtitle:p.release_info,page:currentUser.role==='artist'?'Промо':'Админка'})),
   ...users.map(u=>({id:u.id,type:'Кабинет',title:u.artist,subtitle:u.email,page:'Кабинеты'})),
   {id:'stats',type:'Раздел',title:'Статистика',subtitle:'Прослушивания и площадки',page:'Статистика'},
   {id:'finance',type:'Раздел',title:'Финансы',subtitle:'Баланс и выплаты',page:'Финансы'},
   {id:'promo',type:'Раздел',title:'Промо поддержка',subtitle:'Питчинг релизов',page:'Промо'},
   {id:'support',type:'Раздел',title:'Поддержка',subtitle:'Чат с командой',page:'Поддержка'},
   {id:'news',type:'Раздел',title:'Новости',subtitle:'Гайды и обновления',page:'Новости'},
   {id:'profile',type:'Раздел',title:'Профиль',subtitle:'Аватарка и данные артиста',page:'Профиль'}
 ];
 let content=currentUser.role!=='artist'
   ? page==='Поддержка'?<Support currentUser={currentUser}/>:page==='Новости'?<News isStaff items={news} onCreateNews={createNews} onUpdateNews={updateNews} onDeleteNews={deleteNews}/>:<AdminDashboard section={page} releases={releases} users={users} payouts={payouts} admins={admins} promoRequests={promoRequests} onModerate={moderateRelease} onUpdateRelease={updateRelease} onBlockUser={blockUser} onUpdatePayout={updatePayoutStatus} onAddFinance={addFinance} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin} onUpdatePromoStatus={updatePromoStatus}/>
   : page==='Главная'?<HomePage setPage={setPage} releases={artistReleases} news={news}/>:page==='Релизы'?<Releases releases={artistReleases} setPage={setPage} onOpenRelease={openRelease}/>:page==='Релиз'?<ReleaseDetail release={selectedRelease} setPage={setPage} onPromo={promoFromRelease} onLink={linkFromRelease} onFix={fixRelease}/>:page==='Загрузить релиз'?<UploadRelease key={editingRelease?.id||'new'} setPage={setPage} onCreated={createRelease} onUpdated={updateOwnRelease} onUpload={uploadFile} currentUser={currentUser} initialRelease={editingRelease}/>:page==='Статистика'?<Stats releases={artistReleases}/>:page==='Финансы'?<Finance finance={finance} payouts={payouts} onPayoutRequest={requestPayout} currentUser={currentUser}/>:page==='Новости'?<News items={news}/>:page==='Промо'?<Promo releases={artistReleases} onPromoRequest={createPromoRequest}/>:page==='Промо-ссылки'?<PromoLinks links={promoLinks} onCreateLink={createPromoLink} onDeleteLink={deletePromoLink} releases={artistReleases}/>:page==='Поддержка'?<Support currentUser={currentUser}/>:page==='Профиль'?<Profile currentUser={currentUser} onSaveProfile={saveProfile} onAvatarUpload={uploadAvatar}/>:<HomePage setPage={setPage} releases={artistReleases} news={news}/>;
 return <div className="app"><Sidebar page={page} setPage={setPage} open={menu} setOpen={setMenu} onLogout={logout} currentUser={currentUser}/><main><Topbar title={page} setOpen={setMenu} setPage={setPage} theme={theme} onToggleTheme={toggleTheme} currentUser={currentUser} searchItems={baseSearch} notifications={notifications} onReadAll={readAll} onLogout={logout}/>{content}</main>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<Toasts items={toasts} onClose={id=>setToasts(list=>list.filter(x=>x.id!==id))}/></div>
}

createRoot(document.getElementById('root')).render(<App/>);
