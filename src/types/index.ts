import { Chess, Square, Move } from 'chess.js';

// Chess Game Types
export interface GameState {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  moveHistory: Move[];
}

// Coaching Memory Types
export interface CoachingMemory {
  strategicThemes: string[];
  priorAdvice: string[];
  tacticalFocus: string[];
  positionEvolution: {
    turn: number;
    fen: string;
    evaluation: string;
  }[];
  lastUpdated: number;
}

// Coaching Analysis Types
export interface CoachingAnalysis {
  bestMove: string;
  explanation: string;
  opponentResponseTree: OpponentResponse[];
  tacticalAlerts: string[];
  memoryUpdate: Partial<CoachingMemory>;
  positionEvaluation: string;
  recommendedContinuation: string[];
}

export interface OpponentResponse {
  move: string;
  evaluation: string;
  probability: string;
  continuation: string[];
}

// Engine Types
export interface EngineMove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface EngineEvaluation {
  move: EngineMove;
  score: number;
  depth: number;
}

export interface EngineMessage {
  type: 'move' | 'evaluation' | 'ready' | 'error';
  data?: EngineMove | EngineEvaluation | string;
}

// User Types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
}

export interface UserGameData {
  userId: string;
  gameId: string;
  fen: string;
  pgn: string;
  memory: CoachingMemory;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  isAnalyzing: boolean;
  isEngineThinking: boolean;
  error: string | null;
  notification: string | null;
}

// API Types
export interface GeminiRequest {
  fen: string;
  moveHistory: Move[];
  memory: CoachingMemory;
  lastMove?: Move;
}

export interface GeminiResponse {
  analysis: CoachingAnalysis;
  success: boolean;
  error?: string;
}

// Store Types
export type ChessInstance = Chess;

export interface GameStore {
  game: ChessInstance;
  gameState: GameState;
  memory: CoachingMemory;
  currentAnalysis: CoachingAnalysis | null;
  uiState: UIState;
  
  // Actions
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resetGame: () => void;
  loadGame: (fen: string, pgn: string, memory: CoachingMemory) => void;
  updateMemory: (update: Partial<CoachingMemory>) => void;
  setAnalysis: (analysis: CoachingAnalysis | null) => void;
  setUIState: (update: Partial<UIState>) => void;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
}
