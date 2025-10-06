const nlp = require('compromise');
function extractKeywords(text) {
  const doc = nlp(text);
  const topics = doc.topics().json();
  const nouns = doc.nouns().json();
  const verbs = doc.verbs().json();
  
  return {
    topics: topics.map(t => t.text),
    nouns: nouns.map(n => n.text),
    verbs: verbs.map(v => v.text)
  };
}

// Generate variations based on patterns
function generateVariations(text) {
  const doc = nlp(text);
  const keywords = extractKeywords(text);
  const suggestions = [];

  // Get the main topic/concept
  const mainTopic = keywords.topics[0] || keywords.nouns[0] || '';
  
  // Get key actions with fallbacks
  const defaultActions = ['improve', 'optimize', 'enhance', 'streamline', 'automate'];
  const actions = keywords.verbs.length > 0 ? keywords.verbs : defaultActions;
  
  // Get key objects/concepts with fallbacks
  const defaultConcepts = ['process', 'system', 'workflow', 'implementation'];
  const concepts = [...new Set([...keywords.topics, ...keywords.nouns])].length > 0 
    ? [...new Set([...keywords.topics, ...keywords.nouns])]
    : defaultConcepts;

  // Pattern 1: Improvement suggestions
  if (mainTopic) {
    suggestions.push(`Consider implementing automated ${mainTopic} testing`);
    suggestions.push(`Research industry best practices for ${mainTopic}`);
  }

  // Pattern 2: Action-oriented suggestions with context
  actions.forEach(action => {
    const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
    if (randomConcept) {
      suggestions.push(`${action.charAt(0).toUpperCase() + action.slice(1)} ${randomConcept} through systematic evaluation`);
    }
  });

  // Pattern 3: Strategic suggestions
  concepts.forEach(concept => {
    suggestions.push(`Develop a comprehensive strategy for ${concept} management`);
    suggestions.push(`Establish metrics to measure ${concept} performance`);
  });

  // If we couldn't generate good suggestions, provide generic ones
  if (suggestions.length === 0) {
    return [
      'Consider implementing automated testing procedures',
      'Research industry best practices and standards',
      'Develop a comprehensive evaluation strategy'
    ];
  }

  // Return unique, randomized suggestions
  return [...new Set(suggestions)]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(s => s.trim())
    .filter(Boolean);
}

// Simple keyword-based clustering
function textClustering(texts) {
  const clusters = new Map();
  
  texts.forEach((text, index) => {
    const keywords = extractKeywords(text);
    const mainTopic = keywords.topics[0] || keywords.nouns[0] || 'Other';
    
    if (!clusters.has(mainTopic)) {
      clusters.set(mainTopic, { items: [], label: mainTopic });
    }
    clusters.get(mainTopic).items.push(text);
  });

  return Array.from(clusters.values());
}

// Generate a summary
function generateSummary(texts) {
  const allKeywords = texts.map(text => extractKeywords(text));
  
  // Find common themes with improved relevance
  const themes = new Map();
  const verbs = new Map();
  const nouns = new Map();

  allKeywords.forEach(kw => {
    // Track themes/topics
    kw.topics.forEach(topic => {
      themes.set(topic, (themes.get(topic) || 0) + 1);
    });
    // Track key verbs
    kw.verbs.forEach(verb => {
      verbs.set(verb, (verbs.get(verb) || 0) + 1);
    });
    // Track key nouns
    kw.nouns.forEach(noun => {
      nouns.set(noun, (nouns.get(noun) || 0) + 1);
    });
  });

  // Get top themes combining topics and frequently used nouns
  const sortedThemes = [...Array.from(themes.entries()), ...Array.from(nouns.entries())]
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme)
    .filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
    .slice(0, 4);

  // Score ideas based on keyword richness and verb usage
  const topIdeas = texts
    .filter(text => text && text.trim()) // Filter out empty texts
    .map(text => {
      const kw = extractKeywords(text);
      return {
        text,
        score: (
          kw.topics.length * 2 + // Topics are most important
          kw.nouns.length + // Nouns add substance
          kw.verbs.length * 1.5 // Action verbs are valuable
        )
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.text)
    .slice(0, 4);

  // Generate dynamic next steps based on themes and verbs
  const commonVerbs = Array.from(verbs.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([verb]) => verb)
    .slice(0, 3);

  const nextSteps = [
    `Analyze and expand on ${sortedThemes[0] || 'key themes'}`,
    commonVerbs[0] ? `${commonVerbs[0].charAt(0).toUpperCase() + commonVerbs[0].slice(1)} the prioritized ideas` : 'Prioritize top ideas',
    `Create detailed action plans for implementation`,
    `Schedule follow-up reviews and track progress`
  ];

  return {
    themes: sortedThemes,
    topIdeas,
    nextSteps
  };
}

// Main API functions
async function suggestIdeas(text) {
  try {
    console.log('Generating suggestions for:', text);
    const suggestions = generateVariations(text);
    console.log('Generated suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    console.error('Error details:', error.stack);
    return [
      'Consider different approaches',
      'Analyze potential improvements',
      'Research similar solutions'
    ];
  }
}

async function cluster(cards) {
  try {
    const texts = cards.map(c => c.text || '');
    const clusters = await textClustering(texts);
    return clusters.map(c => ({
      label: c.label,
      ids: cards.filter(card => c.items.includes(card.text)).map(card => card.id)
    }));
  } catch (error) {
    console.error('Error clustering cards:', error);
    return [{ label: 'All Items', ids: cards.map(c => c.id) }];
  }
}

async function summarize(board) {
  try {
    const texts = board.columns.flatMap(c => c.cards.map(card => card.text || ''));
    return generateSummary(texts);
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      themes: ['Theme 1', 'Theme 2', 'Theme 3'],
      topIdeas: board.columns.flatMap(c => c.cards).slice(0, 5).map(x => x.text || ''),
      nextSteps: ['Review ideas', 'Create action items', 'Schedule follow-up']
    };
  }
}

module.exports = { suggestIdeas, cluster, summarize };