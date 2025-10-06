import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLogIn, FiDownload, FiUser } from 'react-icons/fi'

export default function Toolbar({ onLogin, user, onExport }){
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin() {
    if (!name) return;
    setIsLoading(true);
    try {
      await onLogin(name);
      setName('');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <header className="toolbar">
      <motion.div 
        className="brand text-lg font-semibold tracking-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        AI Brainstorm Board
      </motion.div>
      
      <div className="controls">
        <AnimatePresence>
          {!user && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Enter username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white bg-opacity-5 border border-white border-opacity-10 text-white placeholder-gray-400 focus:outline-none focus:border-opacity-20 focus:ring-1 focus:ring-white focus:ring-opacity-20 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={isLoading || !name}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <FiLogIn className="w-4 h-4" />
                {isLoading ? 'Logging in...' : 'Login'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-300"
          >
            <FiUser className="w-4 h-4" />
            {user ? `Signed in as ${user.username}` : 'Not signed in'}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 text-white transition-all duration-200"
          >
            <FiDownload className="w-4 h-4" />
            Export MD
          </motion.button>
        </div>
      </div>
    </header>
  )
}
