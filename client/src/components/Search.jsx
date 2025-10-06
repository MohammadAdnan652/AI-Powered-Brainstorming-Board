import React, { useState } from 'react'
import api from '../api'

export default function Search({ board }){
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  async function search(q){
    if(!q.trim()){ setResults([]); return }
    setLoading(true)
    try{
      const allCards = board.columns.flatMap(c=>c.cards.map(card=>({ id: card.id, text: card.text })))
      const r = await api.post('/search', { query: q, cards: allCards })
      setResults(r.data.results || [])
    }catch(e){
      // fallback to client search
      const matches = board.columns.flatMap(c=>c.cards)
        .filter(c=>c.text.toLowerCase().includes(q.toLowerCase()))
        .map(c=>({ id: c.id, text: c.text }))
      setResults(matches)
    }finally{ setLoading(false) }
  }

  return (
    <div className="search-panel">
      <input
        type="text"
        placeholder="Search ideas..."
        value={query}
        onChange={e=>{ setQuery(e.target.value); search(e.target.value) }}
        className="w-full px-3 py-2 rounded bg-opacity-10 bg-white text-white placeholder-gray-400"
      />
      <div className="results mt-2 max-h-[140px] overflow-auto">
        {loading && <div className="text-gray-400">Searching...</div>}
        {results.map(r=>(
          <div
            key={r.id}
            onClick={()=>highlightCard(r.id)}
            className="result p-2 rounded hover:bg-opacity-10 hover:bg-white cursor-pointer text-sm"
          >
            {r.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function highlightCard(id){
  // remove previous highlights
  document.querySelectorAll('.card').forEach(c=>c.style.boxShadow='')
  const card = document.querySelector(`[data-card-id="${id}"]`)
  if(!card) return
  card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  card.style.boxShadow = '0 0 0 2px #6ea8fe'
  setTimeout(()=>{ card.style.boxShadow = '' }, 2000)
}