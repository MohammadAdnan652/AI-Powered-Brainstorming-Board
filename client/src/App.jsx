import React, { useEffect, useState } from 'react'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import AiPanel from './components/AiPanel'
import api from './api'

export default function App(){
  const [user, setUser] = useState(null)
  const [board, setBoard] = useState({ columns: [ { id: 'col-1', title: 'To Do', cards: [] }, { id: 'col-2', title: 'In Progress', cards: [] }, { id: 'col-3', title: 'Done', cards: [] } ] })

  useEffect(()=>{
    const draft = localStorage.getItem('brainboard:draft')
    if(draft) setBoard(JSON.parse(draft))
  }, [])

  async function login(username){
    const r = await api.post('/auth/login', { username })
    setUser(r.data)
    // fetch board
    const b = await api.get('/board?userId=' + encodeURIComponent(r.data.userId))
    // merge simple: prefer local draft cards
    const local = JSON.parse(localStorage.getItem('brainboard:draft') || 'null')
    if(local) setBoard(local)
    else setBoard(b.data)
  }

  async function save(boardState){
    try {
      console.log('Saving board state:', boardState);
      setBoard(boardState);
      localStorage.setItem('brainboard:draft', JSON.stringify(boardState));
      if(user) {
        await api.post('/board', { userId: user.userId, board: boardState });
      }
    } catch (error) {
      console.error('Error saving board:', error);
    }
  }

  return (
    <div className="app">
      <Toolbar onLogin={login} user={user} onExport={()=>{ const md = exportMarkdown(board,user); download('board.md', md) }} />
      <div className="main">
        <Board board={board} onChange={save} />
        <AiPanel board={board} />
      </div>
    </div>
  )
}

function exportMarkdown(board, user){
  let md = `# Board export - ${user?.username || ''}\n\n`
  board.columns.forEach(col=>{ md += `## ${col.title}\n\n`; col.cards.forEach(card=> md += `- ${card.text.replace(/\n/g,' ')}\n`); md += '\n' })
  return md
}

function download(name, text){ const blob = new Blob([text], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url) }
