import React from 'react'
import api from '../api'
import { motion, AnimatePresence } from 'framer-motion'

export default function SuggestModal({ card, onClose, onAddSuggestion }){
  const [suggestions, setSuggestions] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(()=>{
    let mounted = true;
    
    async function load(){
      try {
        if (!card.text.trim()) {
          setSuggestions(['Please enter some text first to get suggestions.']);
          return;
        }

        const r = await api.post('/suggest', { text: card.text })
        
        if (mounted) {
          if (Array.isArray(r.data.suggestions)) {
            setSuggestions(r.data.suggestions);
          } else if (typeof r.data === 'string') {
            setSuggestions([r.data]);
          } else {
            throw new Error('Invalid response format');
          }
        }
      } catch (e) {
        console.error('Failed to get suggestions:', e);
        if (mounted) {
          setSuggestions([
            'Failed to get suggestions. Please try again.',
            'If the problem persists, please check the server logs.'
          ]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    load();
    return () => { mounted = false; }
  }, [card])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white text-gray-900 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-700">AI Suggestions</h3>
          
          <div className="space-y-3">
            {loading ? (
              <motion.div
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                className="text-gray-500 p-3"
              >
                Loading suggestions...
              </motion.div>
            ) : (
              <AnimatePresence>
                {suggestions.map((s,i)=>(
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: i * 0.1 }}
                    className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors duration-200"
                  >
                    <p className="mb-3 text-gray-700">{s}</p>
                    <button
                      onClick={()=>{ onAddSuggestion(s); onClose() }}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add to card
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}