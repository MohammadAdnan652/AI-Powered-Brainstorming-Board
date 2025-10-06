const localAI = require('./local-ai');
require('dotenv').config();

function safeSplitLines(s){ return (s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean); }

async function suggestIdeas(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text is required and must be a string');
  }

  console.log('Generating suggestions using local AI for:', text);
  try {
    const suggestions = await localAI.suggestIdeas(text);
    console.log('Generated suggestions:', suggestions);
    
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      return suggestions.slice(0, 3);
    }
    
    return [
      'Consider implementing automated testing',
      'Research industry best practices',
      'Develop systematic evaluation methods'
    ];
  } catch (error) {
    console.error('Error generating suggestions:', error);
    // Return fallback suggestions instead of throwing
    return [
      'Consider different approaches',
      'Analyze potential improvements',
      'Research similar solutions'
    ];
  }
}

async function cluster(cards) {
  try {
    return await localAI.cluster(cards);
  } catch (error) {
    console.error('Error clustering cards:', error);
    return [{ label: 'All Items', ids: cards.map(c => c.id) }];
  }
}

async function summarize(board) {
  try {
    return await localAI.summarize(board);
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      themes: ['Innovation', 'Efficiency', 'Quality'],
      topIdeas: board.columns.flatMap(c => c.cards).slice(0, 5).map(x => x.text || ''),
      nextSteps: ['Review and analyze', 'Create action plan', 'Schedule follow-up']
    };
  }
}

async function mood(text) {
  const t = (text || '').toLowerCase();
  if (/good|great|love|happy|excited|improve|enhance|success/.test(t)) return 'positive';
  if (/bad|angry|hate|sad|problem|fail|error|issue/.test(t)) return 'negative';
  return 'neutral';
}

async function search(query, cards) {
  try {
    const queryLower = (query || '').toLowerCase();
    return cards
      .filter(c => (c.text || '').toLowerCase().includes(queryLower))
      .map(c => ({ id: c.id, text: c.text }));
  } catch (error) {
    console.error('Error searching cards:', error);
    return [];
  }
}

module.exports = { suggestIdeas, cluster, summarize, mood, search };
