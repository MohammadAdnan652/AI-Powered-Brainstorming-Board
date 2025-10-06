import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCpu, FiList, FiActivity, FiLoader } from 'react-icons/fi'

export default function AiPanel({ board }){
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [clusters, setClusters] = useState([])
  const [currentAction, setCurrentAction] = useState(null)

  async function cluster(){
    try {
      setLoading(true)
      setCurrentAction('cluster')
      const all = board.columns.flatMap(c=>c.cards.map(card=>({ id: card.id, text: card.text })))
      const r = await fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: all })
      })
      const j = await r.json()
      setClusters(j.clusters || [])
    } catch(e) {
      console.error('Clustering failed:', e)
    } finally {
      setLoading(false)
      setCurrentAction(null)
    }
  }

  async function summarize(){
    try {
      setLoading(true)
      setCurrentAction('summarize')
      const r = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board })
      })
      const j = await r.json()
      if (j.summary) {
        const summaryText = [
          `Key Themes: ${j.summary.themes.join(', ')}`,
          '\nTop Ideas:',
          ...j.summary.topIdeas.map(idea => `- ${idea}`),
          '\nNext Steps:',
          ...j.summary.nextSteps.map(step => `- ${step}`)
        ].join('\n');
        setSummary(summaryText)
      } else {
        setSummary('Could not generate summary. Please try again.')
      }
    } catch(e) {
      console.error('Summary failed:', e)
      setSummary('Failed to generate summary. Please check if the server is running.')
    } finally {
      setLoading(false)
      setCurrentAction(null)
    }
  }

  return (
    <motion.aside 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="ai-panel w-80 bg-gradient-to-br from-purple-900/10 to-blue-900/10 p-6 rounded-2xl backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <FiCpu className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
      </motion.div>
      
      <motion.div 
        className="summary mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FiList className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-medium text-white">Summary</h4>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 min-h-[100px] text-sm text-gray-300">
          {summary || 'No summary yet. Click "Summarize" to analyze your board.'}
        </div>
      </motion.div>

      <AnimatePresence>
        {clusters.length > 0 && (
          <motion.div 
            className="clusters mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FiActivity className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-white">Clusters</h4>
            </div>
            <div className="space-y-3">
              {clusters.map((cluster, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-4"
                >
                  <div className="text-xs font-medium text-blue-400 mb-2">Cluster {i + 1}</div>
                  <div className="text-sm text-gray-300">{cluster.join(', ')}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="actions flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={cluster}
          disabled={loading}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2
            ${currentAction === 'cluster' 
              ? 'bg-purple-600/20 text-purple-400' 
              : 'bg-white/5 hover:bg-white/10 text-white'} 
            disabled:opacity-50 transition-all duration-200`}
        >
          {loading && currentAction === 'cluster' ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <FiActivity className="w-4 h-4" />
          )}
          {loading && currentAction === 'cluster' ? 'Clustering...' : 'Cluster'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={summarize}
          disabled={loading}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2
            ${currentAction === 'summarize'
              ? 'bg-blue-600/20 text-blue-400'
              : 'bg-white/5 hover:bg-white/10 text-white'}
            disabled:opacity-50 transition-all duration-200`}
        >
          {loading && currentAction === 'summarize' ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <FiList className="w-4 h-4" />
          )}
          {loading && currentAction === 'summarize' ? 'Analyzing...' : 'Summarize'}
        </motion.button>
      </div>
    </motion.aside>
  )
}
