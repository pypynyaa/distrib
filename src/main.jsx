import React, {useEffect, useMemo, useState} from 'react';
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
  {id:10,initials:'АК',name:'Алексей Ковалёв',role:'Владелец',access:'Полный доступ',active:true},
  {id:11,initials:'АИ',name:'Алина Исаева',role:'Поддержка',access:'Чаты, релизы',active:true},
  {id:12,initials:'МС',name:'Мария Соколова',role:'Модератор',access:'Релизы, финансы',active:true}
];

const demoPromoLinks = [
  {id:1,title:'Midnight Echoes',slug:'midnight-echoes',url:'https://pypynyaa.github.io/distrib/p/midnight-echoes',links:['Яндекс Музыка','VK Музыка','Apple Music']}
];

const artistNav = [
  ['Главная',Home],['Релизы',Album],['Статистика',BarChart3],['Финансы',Wallet],
  ['Новости',Newspaper],['Промо',Megaphone],['Промо-ссылки',Link],['Поддержка',MessageCircle]
];

const staffNav = [
  ['Админка',ShieldCheck],['Релизы',Album],['Кабинеты',Users],['Финансы',Wallet],
  ['Поддержка',MessageCircle],['Новости',Newspaper]
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

function Sidebar({page,setPage,open,setOpen,onLogout,currentUser}){
  const isStaff=currentUser.role!=='artist';
  const nav=isStaff?staffNav:artistNav;
  const initials=isStaff?'IM':(currentUser.artist||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return <aside className={open?'open':''}><div className="aside-head"><Logo/><button className="icon mobile" onClick={()=>setOpen(false)}><X/></button></div><nav>{nav.map(([n,I])=><button key={n} className={page===n?'active':''} onClick={()=>{setPage(n);setOpen(false)}}><I/><span>{n}</span>{n==='Поддержка'&&<i>1</i>}</button>)}</nav><div className="promo-mini"><Sparkles/><b>{isStaff?'Ручной контроль':'Нужен буст?'}</b><p>{isStaff?'Релизы, выплаты и кабинеты собраны в админке.':'Расскажи нам о релизе — подберём промо.'}</p><button onClick={()=>setPage(isStaff?'Админка':'Промо')}>{isStaff?'Открыть':'Узнать больше'}</button></div><button className="user-mini"><span>{initials}</span><div><b>{isStaff?'Команда Insomnia':currentUser.artist}</b><small>{isStaff?'Админ': 'Артист'}</small></div><ChevronRight/></button><button className="logout" onClick={onLogout}><LogOut/>Выйти</button></aside>
}

function Topbar({title,setOpen,setPage,theme,onToggleTheme,currentUser}){
  const initials=currentUser.role==='artist'?(currentUser.artist||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase():'IM';
  return <header><button className="icon mobile" onClick={()=>setOpen(true)}><Menu/></button><div><span>INSOMNIA MARKET</span><h2>{title}</h2></div><div className="top-actions"><button className="search"><Search/>Поиск</button><ThemeToggle theme={theme} onToggle={onToggleTheme}/><button className="icon notification"><Bell/><i/></button><button className="avatar" onClick={()=>setPage(currentUser.role==='artist'?'Главная':'Админка')}>{initials}</button></div></header>
}

function HomePage({setPage,releases}){
 return <div className="page fade"><section className="hello"><div><span className="eyebrow"><Sparkles/> ДОБРЫЙ ВЕЧЕР, LUNA</span><h1>Твоя музыка<br/>уже <em>звучит.</em></h1><p>Мы собрали главное за последние 30 дней.</p><button className="primary" onClick={()=>setPage('Загрузить релиз')}><Plus/>Новый релиз</button></div><div className="hero-card"><div className="soundwave">{[2,4,7,3,9,6,4,8,5,10,7,3,6,8,4,2,7,5,9,3].map((n,i)=><i key={i} style={{height:n*10+'%'}}/>)}</div><span>СЛУШАТЕЛЕЙ СЕЙЧАС</span><b>248</b><small><TrendingUp/> +18% к прошлой неделе</small></div></section>
  <section className="metrics"><Metric icon={Headphones} label="Прослушивания" value="128 440" delta="+24,8%"/><Metric icon={UserRound} label="Слушатели" value="42 918" delta="+17,2%"/><Metric icon={BadgeDollarSign} label="Доход" value="₽ 86 420" delta="+12,4%"/><Metric icon={Album} label="Активные релизы" value="12" delta="2 новых"/></section>
  <section className="grid-two"><div className="panel"><PanelHead title="Последние релизы" action="Все релизы" onClick={()=>setPage('Релизы')}/><div className="release-list">{releases.map(r=><div className="release-row" key={r.id}><Cover kind={r.cover}/><div className="release-name"><b>{r.title}</b><span>{r.type} · {r.date}</span></div><Badge status={r.status}/><div className="stream"><b>{r.streams?r.streams.toLocaleString('ru'):'—'}</b><span>прослушиваний</span></div><ChevronRight/></div>)}</div></div>
  <div className="panel news-panel"><PanelHead title="Новости" action="Все новости" onClick={()=>setPage('Новости')}/><article className="featured-news"><span>ГАЙД</span><h3>Как подготовить релиз, который заметят</h3><p>Чек-лист от нашей редакции: от обложки до питчинга.</p><small>18 июня · 6 минут</small></article><article className="news-line"><div className="news-pic purple"/><div><span>ПЛОЩАДКИ</span><b>Новые возможности для артистов ВКонтакте</b><small>14 июня</small></div></article></div></section>
 </div>
}

function Metric({icon:I,label,value,delta}){return <div className="metric"><div className="metric-icon"><I/></div><span>{label}</span><b>{value}</b><small><TrendingUp/>{delta}</small></div>}
function PanelHead({title,action,onClick}){return <div className="panel-head"><h3>{title}</h3><button onClick={onClick}>{action}<ArrowRight/></button></div>}

function Releases({releases,setPage}){
 const [filter,setFilter]=useState('Все');
 const shown=filter==='Все'?releases:releases.filter(r=>r.status===filter);
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">ТВОЙ КАТАЛОГ</span><h1>Релизы</h1><p>Загружай музыку и следи за каждым этапом модерации.</p></div><button className="primary" onClick={()=>setPage('Загрузить релиз')}><UploadCloud/>Загрузить релиз</button></div><div className="tabs">{['Все','На модерации','Принят','Черновик'].map(x=><button className={filter===x?'active':''} onClick={()=>setFilter(x)} key={x}>{x}<i>{x==='Все'?releases.length:releases.filter(r=>r.status===x).length}</i></button>)}</div><div className="release-cards">{shown.map(r=><article key={r.id}><Cover kind={r.cover} large/><div className="release-card-body"><div><span>{r.type}</span><h3>{r.title}</h3><p>{r.artist}</p></div><Badge status={r.status}/>{r.reason&&<div className="reject"><CircleHelp/><div><b>Что нужно исправить</b><p>{r.reason}</p></div></div>}<div className="card-meta"><span><b>{r.streams.toLocaleString('ru')}</b> прослушиваний</span><span>Загружен {r.date}</span></div>{r.status==='Принят'&&<div className="release-codes"><span>UPC <b>{r.upc||'ожидает присвоения'}</b></span><span>ISRC <b>{r.isrc||'ожидает присвоения'}</b></span></div>}<button className="secondary">Открыть релиз<ArrowRight/></button></div></article>)}</div></div>
}

function UploadRelease({setPage,onCreated}){
 const [step,setStep]=useState(1); const [title,setTitle]=useState('');
 const send=async()=>{await onCreated({id:Date.now(),title:title||'Новый релиз',artist:'Luna Ray',type:'Сингл',date:'22 июня 2026',status:'На модерации',streams:0,cover:'neon'});setPage('Релизы')}
 return <div className="page fade upload-page"><button className="back" onClick={()=>setPage('Релизы')}>← Назад к релизам</button><div className="page-title"><div><span className="eyebrow">НОВЫЙ РЕЛИЗ</span><h1>Загрузка музыки</h1><p>Заполни информацию — команда проверит релиз вручную.</p></div></div><div className="steps">{['Основное','Треки','Участники','Площадки'].map((x,i)=><div className={step>=i+1?'active':''} key={x}><i>{step>i+1?<Check/>:i+1}</i><span>{x}</span></div>)}</div><div className="form-card"><h3>{step===1?'Расскажи о релизе':step===2?'Загрузи аудиофайлы':step===3?'Укажи участников':'Выбери площадки'}</h3>{step===1&&<><div className="upload-grid"><button className="cover-drop"><UploadCloud/><b>Загрузить обложку</b><span>3000 × 3000 px, JPG или PNG</span></button><div><label>Название релиза<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название"/></label><label>Тип релиза<select><option>Сингл</option><option>EP</option><option>Альбом</option></select></label><div className="field-row"><label>Жанр<select><option>Pop</option><option>Hip-hop</option><option>Electronic</option></select></label><label>Дата релиза<input type="date" defaultValue="2026-07-10"/></label></div><label>Язык текста<select><option>Русский</option><option>Английский</option><option>Инструментал</option></select></label></div></div></>}{step===2&&<div className="audio-drop"><FileAudio/><b>Перетащи WAV-файлы сюда</b><span>WAV, 16/24 bit, 44.1 kHz или выше</span><button className="secondary">Выбрать файлы</button></div>}{step===3&&<div className="fields"><label>Основной артист<input defaultValue="Luna Ray"/></label><label>Автор музыки<input placeholder="Имя и фамилия"/></label><label>Автор текста<input placeholder="Имя и фамилия"/></label></div>}{step===4&&<div className="platforms">{['Яндекс Музыка','VK Музыка','Звук','Apple Music','Spotify','YouTube Music'].map(x=><label key={x}><input type="checkbox" defaultChecked/><span><Check/></span>{x}</label>)}</div>}<div className="form-actions"><button className="secondary" disabled={step===1} onClick={()=>setStep(step-1)}>Назад</button><button className="primary" onClick={()=>step<4?setStep(step+1):send()}>{step<4?'Продолжить':'Отправить на модерацию'}<ArrowRight/></button></div></div></div>
}

function Stats(){return <div className="page fade"><div className="page-title"><div><span className="eyebrow">АНАЛИТИКА</span><h1>Статистика</h1><p>Данные обновляются командой Insomnia после получения отчётов.</p></div><select className="period"><option>Последние 30 дней</option><option>Последние 90 дней</option></select></div><section className="metrics"><Metric icon={Headphones} label="Прослушивания" value="128 440" delta="+24,8%"/><Metric icon={UserRound} label="Слушатели" value="42 918" delta="+17,2%"/><Metric icon={TrendingUp} label="Сохранения" value="8 204" delta="+31,6%"/></section><div className="grid-two stats-grid"><div className="panel chart"><PanelHead title="Динамика прослушиваний" action=""/><div className="chart-area"><div className="chart-fill"/><svg viewBox="0 0 700 220" preserveAspectRatio="none"><path d="M0 180 C80 160,100 190,170 130 S280 160,350 90 S460 130,520 55 S620 90,700 20" fill="none" stroke="#9b7cff" strokeWidth="5"/></svg>{[0,1,2,3,4,5].map(i=><span key={i} style={{left:(i*19)+'%'}}>{i*5+1} июн</span>)}</div></div><div className="panel"><PanelHead title="Топ площадок" action=""/><div className="platform-list">{[['Яндекс Музыка',46,'58 840'],['VK Музыка',28,'35 964'],['Apple Music',16,'20 550'],['Остальные',10,'13 086']].map(([n,p,v])=><div key={n}><span>{n}</span><b>{v}</b><div><i style={{width:p+'%'}}/></div></div>)}</div></div></div></div>}

function Finance({payouts,onPayoutRequest}){
 const [card,setCard]=useState('');
 const request=()=>{if(card.trim()){onPayoutRequest(card);setCard('')}};
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">БАЛАНС</span><h1>Финансы</h1><p>Начисления обновляются вручную админами после отчётов площадок.</p></div></div><div className="balance-card"><span>Доступно к выплате</span><b>₽ 86 420,50</b><small>Ближайшее обновление · после нового отчёта</small><div className="balance-glow"/></div><div className="grid-two"><div className="panel payout-box"><PanelHead title="Запросить выплату" action=""/><p>Введите номер карты. Заявка появится в админке, после перевода команда отметит выплату как оплаченную.</p><label>Номер карты<input value={card} onChange={e=>setCard(e.target.value)} placeholder="2200 0000 0000 0000"/></label><button className="primary" onClick={request}><CreditCard/>Отправить заявку</button></div><div className="panel transactions"><PanelHead title="Мои заявки" action=""/><div className="mini-list">{payouts.filter(x=>x.userId===1).map(p=><div className="mini-row" key={p.id}><span><CreditCard/>{p.card}</span><b>{p.amount.toLocaleString('ru')} ₽</b><small className={p.status==='Оплачено'?'paid':''}>{p.status}</small></div>)}</div></div></div><div className="panel transactions"><PanelHead title="История начислений" action="Скачать отчёт"/><div className="table"><div className="tr th"><span>Период</span><span>Источник</span><span>Статус</span><span>Сумма</span></div>{[['Май 2026','Все площадки','Начислено','₽ 32 840'],['Апрель 2026','Все площадки','Выплачено','₽ 28 190'],['Март 2026','Все площадки','Выплачено','₽ 25 390']].map(r=><div className="tr" key={r[0]}>{r.map((x,i)=><span key={x} className={i===2?'paid':''}>{x}</span>)}</div>)}</div></div></div>}

function News(){return <div className="page fade"><div className="page-title"><div><span className="eyebrow">INSOMNIA EDITORIAL</span><h1>Новости</h1><p>Гайды, обновления площадок и истории наших артистов.</p></div></div><div className="news-grid">{[['ГАЙД','Как подготовить релиз, который заметят','Чек-лист от нашей редакции: от обложки до питчинга.','violet'],['ИНДУСТРИЯ','Что изменилось в музыкальном продвижении','Разбираем главные тренды этого лета.','cyan'],['ИСТОРИЯ','От демо до первого миллиона прослушиваний','Lissa рассказала о пути своего дебютного сингла.','pink']].map((n,i)=><article className={'news-card '+n[3]} key={n[1]}><div><span>{n[0]}</span><i>0{i+1}</i></div><h3>{n[1]}</h3><p>{n[2]}</p><button>Читать<ArrowRight/></button></article>)}</div></div>}

function Promo({releases}){return <div className="page fade"><section className="promo-hero"><div><span className="eyebrow light"><Sparkles/> ПРОМО-ПОДДЕРЖКА</span><h1>Питчинг релизов<br/><em>для площадок.</em></h1><p>Наша команда отправляет треки редакторам площадок для попадания в плейлисты и на витрины сервисов. Чтобы попасть в рассылку, загрузите релиз минимум за 14 дней до даты выпуска и подготовьте описание.</p><button className="white-btn">Как написать пресс-релиз?<ArrowRight/></button></div><div className="promo-rings"><Megaphone/><i/><i/><i/></div></section><div className="panel pitch-form"><PanelHead title="Заявка на питчинг" action=""/><label>Выберите релиз<select>{releases.map(r=><option key={r.id}>{r.title}</option>)}</select></label><label>Информация о релизе<textarea placeholder="О чём трек, настроение, история создания, референсы"/></label><label>Фокус-трек для EP и альбомов<input placeholder="Название трека"/></label><label>Информация об артисте<textarea placeholder="Кто артист, достижения, ссылки на соцсети"/></label><div className="form-actions"><button className="secondary">Отмена</button><button className="primary">Отправить</button></div></div><div className="promo-options">{[['01','Питчинг','Отправим релиз редакторам площадок и поможем оформить заявку.'],['02','Посевы','Нативные размещения в тематических сообществах.'],['03','Стратегия','Соберём индивидуальный план продвижения под бюджет.']].map(x=><article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p><button>Обсудить<ArrowRight/></button></article>)}</div></div>}

function PromoLinks({links,onCreateLink}){
 const [title,setTitle]=useState('Midnight Echoes');
 const create=()=>onCreateLink(title);
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">SMART LINKS</span><h1>Промо-ссылки</h1><p>Создавайте одну ссылку, где слушатель увидит все площадки релиза.</p></div><button className="primary" onClick={create}><Plus/>Создать линкс</button></div><div className="panel link-builder"><label>Релиз<select value={title} onChange={e=>setTitle(e.target.value)}><option>Midnight Echoes</option><option>Neon Dreams</option><option>Cold Summer</option></select></label></div><div className="link-grid">{links.map(item=><article className="link-card" key={item.id}><div><Link/><span>{item.title}</span></div><h3>{item.url}</h3><div>{item.links.map(x=><i key={x}>{x}</i>)}</div><button className="secondary"><Copy/>Скопировать</button></article>)}</div></div>
}

function Support(){const [messages,setMessages]=useState([{me:false,text:'Привет, Luna! Я Алина из команды поддержки. Чем могу помочь?',time:'18:42'},{me:true,text:'Здравствуйте! Подскажите, всё ли в порядке с релизом Neon Dreams?',time:'18:44'},{me:false,text:'Да, он уже у модератора. Проверка обычно занимает до 2 рабочих дней. Напишем здесь и на почту, когда статус изменится ✨',time:'18:45'}]);const [text,setText]=useState('');const send=()=>{if(text.trim()){setMessages([...messages,{me:true,text,time:'сейчас'}]);setText('')}};return <div className="page fade support"><div className="support-list"><div className="support-title"><h2>Поддержка</h2><button className="icon"><Plus/></button></div><div className="ticket active"><span>A</span><div><b>Алина · Insomnia</b><p>Да, он уже у модератора...</p></div><small>18:45<i/></small></div><div className="ticket"><span>IM</span><div><b>Системные уведомления</b><p>Ваш релиз принят</p></div><small>12 июн</small></div></div><div className="chat"><div className="chat-head"><span>A</span><div><b>Алина</b><small><i/> команда Insomnia · онлайн</small></div><button className="icon"><CircleHelp/></button></div><div className="messages"><div className="date">Сегодня</div>{messages.map((m,i)=><div className={'message '+(m.me?'me':'')} key={i}><p>{m.text}</p><small>{m.time}</small></div>)}</div><div className="composer"><button className="icon"><Plus/></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Напишите сообщение..."/><button className="send" onClick={send}><Send/></button></div></div></div>}

function AdminDashboard({releases,users,payouts,admins,onModerate,onUpdateRelease,onBlockUser,onPayPayout,onAddAdmin,onRemoveAdmin,section='Админка'}){
 const [tab,setTab]=useState(section==='Кабинеты'?'Кабинеты':section==='Финансы'?'Финансы':section==='Релизы'?'Релизы':'Релизы');
 const pending=releases.filter(r=>r.status==='На модерации').length;
 const waiting=payouts.filter(p=>p.status!=='Оплачено').length;
 return <div className="page fade"><div className="page-title"><div><span className="eyebrow">АДМИН-САЙТ</span><h1>Центр управления</h1><p>Все релизы, кабинеты, выплаты и команда — в одном месте.</p></div><div className="admin-kpis"><span>{pending} на модерации</span><span>{waiting} выплат</span><span>{users.length} кабинета</span></div></div><div className="tabs admin-tabs">{['Релизы','Кабинеты','Финансы','Команда'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>{tab==='Релизы'&&<AdminReleases releases={releases} onModerate={onModerate} onUpdateRelease={onUpdateRelease}/>} {tab==='Кабинеты'&&<AdminAccounts users={users} onBlockUser={onBlockUser}/>} {tab==='Финансы'&&<AdminFinance users={users} payouts={payouts} onPayPayout={onPayPayout}/>} {tab==='Команда'&&<AdminTeam admins={admins} onAddAdmin={onAddAdmin} onRemoveAdmin={onRemoveAdmin}/>}</div>
}

function AdminReleases({releases,onModerate,onUpdateRelease}){
 const [reason,setReason]=useState('Не хватает корректной обложки / данных по релизу.');
 return <div className="admin-release-grid">{releases.map(r=><article className="panel admin-release-card" key={r.id}><div className="admin-release-head"><Cover kind={r.cover}/><div><span>{r.artist}</span><h3>{r.title}</h3><p>{r.type} · {r.genre} · дата: {r.releaseDate}</p></div><Badge status={r.status}/></div><div className="release-data"><label>Прослушивания<input type="number" defaultValue={r.streams} onBlur={e=>onUpdateRelease(r.id,{streams:Number(e.target.value)})}/></label><label>UPC<input defaultValue={r.upc} placeholder="Вписать UPC" onBlur={e=>onUpdateRelease(r.id,{upc:e.target.value})}/></label><label>ISRC<input defaultValue={r.isrc} placeholder="Вписать ISRC" onBlur={e=>onUpdateRelease(r.id,{isrc:e.target.value})}/></label></div><div className="admin-comment"><b>Информация релиза</b><p>{r.comment}</p><small>Площадки: {r.platforms.join(', ')}</small></div><label>Причина отклонения<textarea value={reason} onChange={e=>setReason(e.target.value)}/></label><div className="admin-actions"><button className="secondary" onClick={()=>onModerate(r.id,'Черновик',reason)}><X/>Отклонить</button><button className="primary" onClick={()=>onModerate(r.id,'Принят','')}><Check/>Принять релиз</button></div></article>)}</div>
}

function AdminAccounts({users,onBlockUser}){
 return <div className="panel admin-table"><div className="tr th"><span>Кабинет</span><span>Почта</span><span>Регистрация</span><span>Статус</span></div>{users.map(u=><div className="tr" key={u.id}><span className="admin-name"><i>{u.artist.split(' ').map(x=>x[0]).join('').slice(0,2)}</i><b>{u.artist}</b></span><span>{u.email}</span><span>{u.registered}</span><span className={u.status==='Заблокирован'?'danger':'online'}>{u.status}<button onClick={()=>onBlockUser(u.id)}><Ban/>{u.status==='Заблокирован'?'Разблокировать':'Блок'}</button></span></div>)}</div>
}

function AdminFinance({users,payouts,onPayPayout}){
 return <div className="grid-two"><div className="panel transactions"><PanelHead title="Заявки на выплаты" action=""/><div className="mini-list">{payouts.map(p=><div className="mini-row finance-request" key={p.id}><span><CreditCard/>{p.artist}<small>{p.card}</small></span><b>{p.amount.toLocaleString('ru')} ₽</b><small className={p.status==='Оплачено'?'paid':''}>{p.status}</small>{p.status!=='Оплачено'&&<button className="primary" onClick={()=>onPayPayout(p.id)}>Оплачено</button>}</div>)}</div></div><div className="panel transactions"><PanelHead title="Балансы кабинетов" action="Добавить отчёт"/><div className="mini-list">{users.map(u=><div className="mini-row" key={u.id}><span><Wallet/>{u.artist}</span><b>{u.balance.toLocaleString('ru')} ₽</b><small>Выплачено: {u.paid.toLocaleString('ru')} ₽</small></div>)}</div></div></div>
}

function AdminTeam({admins,onAddAdmin,onRemoveAdmin}){
 return <div><div className="page-title compact"><div><span className="eyebrow">КОМАНДА</span><h1>Администраторы</h1><p>Владелец может добавлять и удалять админов.</p></div><button className="primary" onClick={onAddAdmin}><Plus/>Добавить администратора</button></div><div className="panel admin-table"><div className="tr th"><span>Администратор</span><span>Роль</span><span>Доступ</span><span>Статус</span></div>{admins.map((x,i)=><div className="tr" key={x.id}><span className="admin-name"><i>{x.initials}</i><b>{x.name}</b></span><span>{x.role}</span><span>{x.access}</span><span className="online">Активен {i>0&&<button onClick={()=>onRemoveAdmin(x.id)}>Удалить</button>}</span></div>)}</div></div>
}

function App(){
 const [logged,setLogged]=useState(()=>!!localStorage.getItem('im_token'));
 const [currentUser,setCurrentUser]=useState(()=>JSON.parse(localStorage.getItem('im_user')||'{"id":1,"artist":"Luna Ray","role":"artist"}'));
 const [page,setPage]=useState(()=>currentUser.role==='artist'?'Главная':'Админка');const [menu,setMenu]=useState(false);const [releases,setReleases]=useState(demoReleases);
 const [users,setUsers]=useState(demoUsers);const [payouts,setPayouts]=useState(demoPayouts);const [admins,setAdmins]=useState(demoAdmins);const [promoLinks,setPromoLinks]=useState(demoPromoLinks);
 const [theme,setTheme]=useState(()=>localStorage.getItem('im_theme')||'dark');
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('im_theme',theme)},[theme]);
 const toggleTheme=()=>setTheme(value=>value==='dark'?'light':'dark');
 const setSession=(user,token='demo')=>{localStorage.setItem('im_token',token);localStorage.setItem('im_user',JSON.stringify(user));setCurrentUser(user);setPage(user.role==='artist'?'Главная':'Админка');setLogged(true)};
 const login=async data=>{if(DEMO_MODE){const staff=data.email.includes('owner')||data.email.includes('admin');setSession(staff?{id:10,artist:'Команда Insomnia',role:'owner'}:{id:1,artist:data.artist_name||'Luna Ray',role:'artist'});return}const endpoint=data.register?'register':'login';const body=data.register?{email:data.email,password:data.password,artist_name:data.artist_name}:{email:data.email,password:data.password};try{const res=await fetch(`${API}/auth/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const json=await res.json();if(!res.ok)throw new Error(json.detail||'Не удалось войти');setSession({id:json.user.id,artist:json.user.artist_name,role:json.user.role},json.token)}catch(e){if(!data.register){const staff=data.email.includes('owner')||data.email.includes('admin');setSession(staff?{id:10,artist:'Команда Insomnia',role:'owner'}:{id:1,artist:'Luna Ray',role:'artist'});return}throw e}};
 const logout=()=>{localStorage.removeItem('im_token');localStorage.removeItem('im_user');setLogged(false)};
 useEffect(()=>{if(!logged)return;const token=localStorage.getItem('im_token');if(token==='demo')return;fetch(`${API}/releases`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():Promise.reject()).then(rows=>setReleases(rows.map((r,i)=>({id:r.id,title:r.title,artist:r.artist_name||'Luna Ray',type:r.release_type,date:r.release_date||'Без даты',status:r.status,reason:r.rejection_reason,streams:r.streams,cover:['neon','midnight','cold'][i%3]})))).catch(()=>{})},[logged]);
 const createRelease=async release=>{release={...release,userId:currentUser.id,artist:currentUser.artist,genre:'Pop',releaseDate:'2026-07-10',upc:'',isrc:'',platforms:['Яндекс Музыка','VK Музыка'],comment:'Новый релиз отправлен на ручную модерацию.'};const token=localStorage.getItem('im_token');if(token!=='demo'){try{const res=await fetch(`${API}/releases`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({title:release.title,release_type:release.type,genre:'Pop',language:'Русский',release_date:'2026-07-10'})});if(res.ok){const saved=await res.json();release={...release,id:saved.id}}}catch{}}setReleases(list=>[release,...list])};
 const moderateRelease=(id,status,reason='')=>setReleases(list=>list.map(r=>r.id===id?{...r,status,reason:status==='Черновик'?reason:'',upc:status==='Принят'&&!r.upc?'463011990'+String(id).padStart(4,'0'):r.upc,isrc:status==='Принят'&&!r.isrc?'RUIIM26'+String(id).padStart(5,'0'):r.isrc}:r));
 const updateRelease=(id,patch)=>setReleases(list=>list.map(r=>r.id===id?{...r,...patch}:r));
 const requestPayout=card=>setPayouts(list=>[{id:Date.now(),userId:1,artist:'Luna Ray',amount:86420.5,card,status:'Ожидает выплаты',date:'сегодня'},...list]);
 const payPayout=id=>setPayouts(list=>list.map(p=>p.id===id?{...p,status:'Оплачено'}:p));
 const blockUser=id=>setUsers(list=>list.map(u=>u.id===id?{...u,status:u.status==='Заблокирован'?'Активен':'Заблокирован'}:u));
 const addAdmin=()=>setAdmins(list=>[...list,{id:Date.now(),initials:'НA',name:'Новый админ',role:'Админ',access:'Релизы, финансы',active:true}]);
 const removeAdmin=id=>setAdmins(list=>list.filter(a=>a.id!==id));
 const createPromoLink=title=>setPromoLinks(list=>[{id:Date.now(),title,slug:title.toLowerCase().replaceAll(' ','-'),url:`https://pypynyaa.github.io/distrib/p/${title.toLowerCase().replaceAll(' ','-')}`,links:['Яндекс Музыка','VK Музыка','Apple Music']},...list]);
 if(!logged)return <Login onLogin={login} theme={theme} onToggleTheme={toggleTheme}/>;
 const artistReleases=releases.filter(r=>currentUser.role!=='artist'||r.userId===currentUser.id);
 let content=currentUser.role!=='artist'&&['Админка','Кабинеты','Финансы','Команда','Релизы'].includes(page)
   ? <AdminDashboard section={page} releases={releases} users={users} payouts={payouts} admins={admins} onModerate={moderateRelease} onUpdateRelease={updateRelease} onBlockUser={blockUser} onPayPayout={payPayout} onAddAdmin={addAdmin} onRemoveAdmin={removeAdmin}/>
   : page==='Главная'?<HomePage setPage={setPage} releases={artistReleases}/>:page==='Релизы'?<Releases releases={artistReleases} setPage={setPage}/>:page==='Загрузить релиз'?<UploadRelease setPage={setPage} onCreated={createRelease}/>:page==='Статистика'?<Stats/>:page==='Финансы'?<Finance payouts={payouts} onPayoutRequest={requestPayout}/>:page==='Новости'?<News/>:page==='Промо'?<Promo releases={artistReleases}/>:page==='Промо-ссылки'?<PromoLinks links={promoLinks} onCreateLink={createPromoLink}/>:page==='Поддержка'?<Support/>:<HomePage setPage={setPage} releases={artistReleases}/>;
 return <div className="app"><Sidebar page={page} setPage={setPage} open={menu} setOpen={setMenu} onLogout={logout} currentUser={currentUser}/><main><Topbar title={page} setOpen={setMenu} setPage={setPage} theme={theme} onToggleTheme={toggleTheme} currentUser={currentUser}/>{content}</main>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>);
