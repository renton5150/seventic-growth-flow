
import { analyzeRequest } from './requestAnalysis';
import { generateSummary } from './activitySummary';
import { suggestAssignments } from './assignmentSuggestion';
import { findSimilarities } from './similarityFinder';
export * from './types';

const AnthropicService = {
  analyzeRequest,
  generateSummary,
  suggestAssignments,
  findSimilarities
};

export default AnthropicService;
