let state = { userId: null, username: null, board: null };
let saveTimer = null;
const DEFAULT_BOARD = { columns: [ { id: 'col-1', title: 'To Do', cards: [] }, { id: 'col-2', title: 'In Progress', cards: [] }, { id: 'col-3', title: 'Done', cards: [] } ] };
const LOCAL_KEY = 'brainboard:draft';

async function api(path, method='GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  return res.json();
}

document.getElementById('loginBtn').onclick = async ()=>{
  const username = document.getElementById('username').value.trim();
  if(!username) return alert('enter username');
  const r = await api('/auth/login','POST',{ username });
  state.userId = r.userId; state.username = r.username;
  document.getElementById('userStatus').textContent = 'Signed in as ' + state.username;
  // fetch server board and merge local draft
  const serverBoard = await api('/board?userId=' + encodeURIComponent(state.userId));
  const local = loadLocalDraft();
  if(local){
    // simple merge: prefer local cards (append any missing columns/cards)
    const merged = mergeBoards(serverBoard, local);
    state.board = merged;
    renderBoard();
    await saveBoard();
    clearLocalDraft();
  } else {
    state.board = serverBoard;
    renderBoard();
  }
};

// show user in header input when logged in
function setLoggedInUI(){
  const input = document.getElementById('username');
  if(state.username) input.value = state.username;
}

async function loadBoard(){
  if(!state.userId) {
    // no user: load from local draft or default
    const local = loadLocalDraft();
    state.board = local || state.board;
    renderBoard();
    return;
  }
  const r = await api('/board?userId=' + encodeURIComponent(state.userId));
  state.board = r;
  renderBoard();
}

function renderBoard(){
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  state.board.columns.forEach(col=>{
    const colEl = document.createElement('div'); colEl.className='column'; colEl.dataset.colId = col.id;
    const h = document.createElement('h3'); h.textContent = col.title; colEl.appendChild(h);
    const list = document.createElement('div'); list.className='list';
    col.cards.forEach(card=>{
      const c = document.createElement('div'); c.className='card'; c.dataset.cardId=card.id;
      const ta = document.createElement('textarea'); ta.value = card.text || ''; ta.rows=2;
      ta.onchange = ()=>{ card.text = ta.value; scheduleSave(); };
      const del = document.createElement('button'); del.textContent='Delete'; del.onclick=()=>{ col.cards = col.cards.filter(x=>x.id!==card.id); renderBoard(); saveBoard(); };
      const actionWrap = document.createElement('div'); actionWrap.className='card-actions';
      const sug = document.createElement('button'); sug.textContent='Suggest'; sug.onclick=()=>{ suggestForCard(card); };
      const mood = document.createElement('button'); mood.textContent='Mood'; mood.onclick=()=>{ analyzeMood(card); };
      actionWrap.appendChild(del); actionWrap.appendChild(sug); actionWrap.appendChild(mood);
      c.appendChild(ta); c.appendChild(actionWrap);
      list.appendChild(c);
    });
    colEl.appendChild(list);
    const addBtn = document.createElement('button'); addBtn.textContent='Add Card'; addBtn.onclick=()=>{ col.cards.push({ id: 'card-'+Date.now(), text: 'New idea' }); renderBoard(); saveBoard(); };
    colEl.appendChild(addBtn);
    boardEl.appendChild(colEl);
    new Sortable(list, { group: 'shared', animation: 150, onAdd: saveFromDom, onUpdate: saveFromDom });
  });
  setLoggedInUI();
}

function saveFromDom(){
  // rebuild state.board from DOM ordering
  const cols = Array.from(document.querySelectorAll('.column'));
  cols.forEach(colEl=>{
    const colId = colEl.dataset.colId;
    const col = state.board.columns.find(c=>c.id===colId);
    const cards = Array.from(colEl.querySelectorAll('.card')).map(cardEl=>{
      const id = cardEl.dataset.cardId;
      const ta = cardEl.querySelector('textarea');
      return { id, text: ta.value };
    });
    col.cards = cards;
  });
  scheduleSave();
}

async function saveBoard(){
  if(!state.userId){
    // save locally as draft
    saveLocalDraft(state.board);
    updateSaveStatus('Draft saved locally');
    return;
  }
  updateSaveStatus('Saving...');
  await api('/board','POST',{ userId: state.userId, board: state.board });
  updateSaveStatus('All changes saved');
}

function scheduleSave(){
  if (saveTimer) clearTimeout(saveTimer);
  updateSaveStatus('Saving...');
  saveTimer = setTimeout(()=>{ saveBoard(); saveTimer = null; }, 600);
}

function saveLocalDraft(board){ localStorage.setItem(LOCAL_KEY, JSON.stringify(board)); }
function loadLocalDraft(){ try{ const s = localStorage.getItem(LOCAL_KEY); return s ? JSON.parse(s) : null }catch(e){return null} }
function clearLocalDraft(){ localStorage.removeItem(LOCAL_KEY); }

function mergeBoards(server, local){
  if(!server || !server.columns) return local;
  if(!local || !local.columns) return server;
  // preserve server column titles but merge cards: keep unique card ids, prefer local card text
  const merged = { columns: server.columns.map(sc=>({ id: sc.id, title: sc.title, cards: [] })) };
  // index server cards
  const all = {};
  server.columns.forEach(c=> c.cards.forEach(card=> all[card.id]=card));
  local.columns.forEach(c=> c.cards.forEach(card=> all[card.id]=card));
  // fill merged by local column mapping if exists else append to first
  server.columns.forEach(sc=>{
    const localCol = (local.columns.find(lc=>lc.title===sc.title) || sc);
    merged.columns.find(x=>x.id===sc.id).cards = (localCol.cards || []).map(card=> all[card.id] || card);
  });
  return merged;
}

document.getElementById('addCardBtn').onclick = ()=>{
  const first = state.board.columns[0]; first.cards.push({ id: 'card-'+Date.now(), text: 'New idea' }); renderBoard(); saveBoard();
};

document.getElementById('clusterBtn').onclick = async ()=>{
  const allCards = state.board.columns.flatMap(c=>c.cards.map(card=>({ id: card.id, text: card.text })));
  const r = await api('/cluster','POST',{ cards: allCards });
  const log = document.getElementById('suggestionsLog'); log.innerHTML='';
  r.clusters.forEach(cl=>{ const el = document.createElement('div'); el.textContent = cl.label + ': ' + cl.ids.join(', '); log.appendChild(el); });
  try{ highlightClusters(r); }catch(e){}
};

document.getElementById('summarizeBtn').onclick = async ()=>{
  const r = await api('/summarize','POST',{ board: state.board });
  const s = r.summary;
  const out = document.getElementById('summary');
  if(typeof s === 'string') out.textContent = s;
  else out.textContent = JSON.stringify(s, null, 2);
};

async function suggestForCard(card){
  const log = document.getElementById('suggestionsLog');
  const loading = document.createElement('div'); loading.textContent = 'Loading suggestions...'; log.prepend(loading);
  try{
    const r = await api('/suggest','POST',{ text: card.text });
    loading.remove();
    openSuggestionModal(r.suggestions || r, card);
  }catch(e){ loading.textContent = 'Failed to get suggestions'; }
}

async function analyzeMood(card){
  // simple UI hook - server endpoint /api/mood not yet implemented; will fallback to client mock
  const log = document.getElementById('suggestionsLog');
  const loading = document.createElement('div'); loading.textContent = 'Analyzing mood...'; log.prepend(loading);
  try{
    const r = await api('/mood','POST',{ text: card.text });
    loading.remove();
    const el = document.createElement('div'); el.textContent = `Mood: ${r.mood}`;
    log.prepend(el);
  }catch(e){ loading.textContent = 'Mood analysis not available'; setTimeout(()=>loading.remove(), 1200); }
}

document.getElementById('exportMdBtn').onclick = ()=>{
  const md = exportMarkdown();
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = (state.username||'board') + '.md'; document.body.appendChild(a); a.click(); a.remove();
}

function exportMarkdown(){
  let md = `# Board export - ${state.username || ''}\n\n`;
  state.board.columns.forEach(col=>{
    md += `## ${col.title}\n\n`;
    col.cards.forEach(card=>{ md += `- ${card.text.replace(/\n/g,' ')}\n`; });
    md += '\n';
  });
  return md;
}

// suggestion modal helper
function openSuggestionModal(suggestions, card){
  const modal = document.getElementById('suggestionModal');
  const list = document.getElementById('suggestionList'); list.innerHTML='';
  suggestions.forEach(s=>{
    const it = document.createElement('div'); it.className='suggestion-item';
    const p = document.createElement('div'); p.textContent = s; it.appendChild(p);
    const actions = document.createElement('div'); actions.style.textAlign='right';
    const add = document.createElement('button'); add.className='btn'; add.textContent='Add to card'; add.onclick = ()=>{ card.text += '\n' + s; renderBoard(); scheduleSave(); };
    actions.appendChild(add); it.appendChild(actions);
    list.appendChild(it);
  });
  modal.style.display='flex';
}
document.getElementById('closeSuggestionModal').onclick = ()=>{ document.getElementById('suggestionModal').style.display='none'; }

// search UI wiring
document.getElementById('searchInput').oninput = async (e)=>{
  const q = e.target.value.trim();
  const results = document.getElementById('searchResults'); results.innerHTML='';
  if(!q) return;
  const allCards = state.board.columns.flatMap(c=>c.cards.map(card=>({ id: card.id, text: card.text })));
  try{
    const r = await api('/search','POST',{ query: q, cards: allCards });
    // show server results (if available)
    const list = r.results || r;
    if(list && list.length){
      list.forEach(it=>{ const el = document.createElement('div'); el.textContent = it.text; el.className='search-result'; el.style.padding='6px'; el.style.cursor='pointer'; el.onclick = ()=>{ jumpToCard(it.id); }; results.appendChild(el); });
      return;
    }
    // fallback to client filter if server returned nothing
    clientSearch(allCards, q, results);
  }catch(e){ results.textContent = 'Search not available'; }
}

function clientSearch(allCards, q, resultsEl){
  const ql = q.toLowerCase();
  const found = allCards.filter(c=> (c.text||'').toLowerCase().includes(ql));
  if(!found.length){ resultsEl.textContent = 'No local matches'; return; }
  found.forEach(it=>{ const el = document.createElement('div'); el.textContent = it.text; el.className='search-result'; el.style.padding='6px'; el.style.cursor='pointer'; el.onclick = ()=>{ jumpToCard(it.id); }; resultsEl.appendChild(el); });
}

function jumpToCard(cardId){
  // clear previous highlights
  document.querySelectorAll('.card').forEach(c=> c.style.boxShadow = '');
  const el = document.querySelector(`.card[data-card-id="${cardId}"]`);
  if(!el) return;
  // highlight and scroll
  el.style.boxShadow = '0 8px 24px rgba(110,168,254,0.28)';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // briefly remove highlight after 2s
  setTimeout(()=>{ el.style.boxShadow = ''; }, 2000);
}

// simple cluster visualization: highlight cards in clusters
function highlightClusters(clusterResp){
  // clear previous
  document.querySelectorAll('.card').forEach(c=> c.style.border = '');
  const colors = ['#ffd3a5','#c9f7f5','#ffd6f0','#e2f0cb'];
  clusterResp.clusters?.forEach((cl, idx)=>{
    cl.ids.forEach(id=>{
      const el = document.querySelector(`.card[data-card-id="${id}"]`);
      if(el) el.style.border = `3px solid ${colors[idx % colors.length]}`;
    });
  });
}

// initial empty board
state.board = DEFAULT_BOARD;
// load board from local draft or server
loadBoard();

function updateSaveStatus(txt){
  const el = document.getElementById('saveStatus'); if(!el) return;
  el.textContent = txt;
  if(txt === 'All changes saved' || txt === 'Draft saved locally'){
    setTimeout(()=>{ if(el.textContent === txt) el.textContent = 'No changes'; }, 1400);
  }
}
