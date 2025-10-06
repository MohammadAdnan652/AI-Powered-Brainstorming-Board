import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiAirplay } from 'react-icons/fi'
import SuggestModal from './SuggestModal'

export default function Board({ board, onChange }){
  const [suggestCard, setSuggestCard] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletingCard, setDeletingCard] = useState(null)

    // Handle drag events
  function onDragStart(result) {
    document.body.style.cursor = 'grabbing';
    const draggedElement = document.querySelector(`[data-card-id="${result.draggableId}"]`);
    if (draggedElement) {
      draggedElement.style.opacity = '0.9';
      draggedElement.style.transform = 'scale(1.02)';
    }
  }

  function onDragEnd(result) {
    document.body.style.cursor = '';
    const draggedElement = document.querySelector(`[data-card-id="${result.draggableId}"]`);
    if (draggedElement) {
      draggedElement.style.opacity = '';
      draggedElement.style.transform = '';
    }

    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    // Don't do anything if dropped in the same spot
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Create new board state immutably
    const newBoard = {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: [...col.cards]
      }))
    };

    const srcCol = newBoard.columns.find(c => c.id === source.droppableId);
    const dstCol = newBoard.columns.find(c => c.id === destination.droppableId);
    const [moved] = srcCol.cards.splice(source.index, 1);
    dstCol.cards.splice(destination.index, 0, moved);

    onChange(newBoard);
  }

  return (
    <div className="board flex-1 flex gap-4 p-4 overflow-x-auto">
      <DragDropContext 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {board.columns.map(col=> (
          <Droppable droppableId={col.id} key={col.id}>
            {(provided)=> (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="column min-w-[320px] bg-gradient-to-b from-blue-50 to-blue-100 p-4 rounded-xl shadow-lg"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-700">{col.title}</h3>
                {col.cards.map((card, idx)=> (
                  <Draggable draggableId={card.id} index={idx} key={card.id}>
                    {(prov)=> (
                      <motion.div
                        animate={deletingCard === card.id ? { 
                          scale: 0,
                          opacity: 0,
                          height: 0,
                          marginBottom: 0
                        } : {
                          scale: 1,
                          opacity: 1,
                          height: 'auto',
                          marginBottom: '0.75rem'
                        }}
                        transition={{ duration: 0.3 }}
                        className="card bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        data-card-id={card.id}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <textarea
                            value={card.text || ''}
                            onChange={(e) => {
                              const newBoard = {
                                ...board,
                                columns: board.columns.map(col => ({
                                  ...col,
                                  cards: col.cards.map(c =>
                                    c.id === card.id ? { ...c, text: e.target.value } : c
                                  )
                                }))
                              };
                              onChange(newBoard);
                            }}
                            className="w-full border-0 resize-none focus:ring-0 text-gray-700 text-sm"
                            rows={2}
                            placeholder="Enter your idea here..."
                          />
                          <div className="flex gap-2 mt-3">
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: '#FEE2E2' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteConfirm(card)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 border border-red-200 shadow-sm"
                              aria-label="Delete card"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: '#EFF6FF' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={()=>setSuggestCard(card)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-blue-50 text-blue-600 transition-all duration-200 border border-blue-100"
                            >
                              <FiAirplay className="w-4 h-4" />
                              Suggest
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={()=>{ 
                    const newBoard = {
                      ...board,
                      columns: board.columns.map(c => 
                        c.id === col.id 
                          ? {...c, cards: [...c.cards, { id: 'card-'+Date.now(), text: '' }]}
                          : c
                      )
                    };
                    onChange(newBoard);
                  }}
                  className="w-full py-2.5 rounded-lg bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-600 transition-colors duration-200 shadow-sm hover:shadow"
                >
                  + Add Card
                </motion.button>
              </motion.div>
            )}
          </Droppable>
        ))}
      </DragDropContext>

      {suggestCard && (
        <SuggestModal
          card={suggestCard}
          onClose={()=>setSuggestCard(null)}
          onAddSuggestion={(text)=>{
            suggestCard.text += '\n' + text
            onChange(board)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Delete Card?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              {deleteConfirm.text.substring(0, 100)}{deleteConfirm.text.length > 100 ? '...' : ''}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setDeletingCard(deleteConfirm.id);
                  setTimeout(() => {
                    const updatedColumns = board.columns.map(column => ({
                      ...column,
                      cards: column.cards.filter(c => c.id !== deleteConfirm.id)
                    }));
                    onChange({...board, columns: updatedColumns});
                    setDeleteConfirm(null);
                    setDeletingCard(null);
                  }, 300);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
