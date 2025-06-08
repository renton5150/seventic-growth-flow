
import { analyzeRequest } from './requestAnalysis';
import { generateSummary } from './activitySummary';
import { suggestAssignments } from './assignmentSuggestion';
import { findSimilarities } from './similarityFinder';
import { sendChatMessage } from './chatService';
export * from './types';
export * from './chatService';

const AnthropicService = {
  analyzeRequest,
  generateSummary,
  suggestAssignments,
  findSimilarities,
  sendChatMessage
};

export default AnthropicService;
