import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserGameData, CoachingMemory } from '../types';

const GAMES_COLLECTION = 'games';

export class DatabaseService {
  async saveGame(gameData: Omit<UserGameData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const gameRef = doc(db, GAMES_COLLECTION, gameData.gameId);
      
      await setDoc(gameRef, {
        ...gameData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving game:', error);
      throw new Error('Failed to save game');
    }
  }

  async updateGame(
    gameId: string,
    updates: Partial<Pick<UserGameData, 'fen' | 'pgn' | 'memory' | 'isActive'>>
  ): Promise<void> {
    try {
      const gameRef = doc(db, GAMES_COLLECTION, gameId);
      
      await updateDoc(gameRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error('Failed to update game');
    }
  }

  async getGame(gameId: string): Promise<UserGameData | null> {
    try {
      const gameRef = doc(db, GAMES_COLLECTION, gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        return null;
      }

      const data = gameSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      } as UserGameData;
    } catch (error) {
      console.error('Error getting game:', error);
      throw new Error('Failed to retrieve game');
    }
  }

  async getUserGames(userId: string, activeOnly: boolean = false): Promise<UserGameData[]> {
    try {
      const gamesRef = collection(db, GAMES_COLLECTION);
      let q = query(
        gamesRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );

      if (activeOnly) {
        q = query(
          gamesRef,
          where('userId', '==', userId),
          where('isActive', '==', true),
          orderBy('updatedAt', 'desc'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const games: UserGameData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        games.push({
          ...data,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          updatedAt: data.updatedAt?.toMillis() || Date.now(),
        } as UserGameData);
      });

      return games;
    } catch (error) {
      console.error('Error getting user games:', error);
      throw new Error('Failed to retrieve games');
    }
  }

  async getActiveGame(userId: string): Promise<UserGameData | null> {
    try {
      const gamesRef = collection(db, GAMES_COLLECTION);
      const q = query(
        gamesRef,
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const data = querySnapshot.docs[0].data();
      return {
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      } as UserGameData;
    } catch (error) {
      console.error('Error getting active game:', error);
      return null;
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    try {
      const gameRef = doc(db, GAMES_COLLECTION, gameId);
      await deleteDoc(gameRef);
    } catch (error) {
      console.error('Error deleting game:', error);
      throw new Error('Failed to delete game');
    }
  }

  async createNewGame(userId: string): Promise<string> {
    const gameId = `${userId}_${Date.now()}`;
    const initialMemory: CoachingMemory = {
      strategicThemes: [],
      priorAdvice: [],
      tacticalFocus: [],
      positionEvolution: [],
      lastUpdated: Date.now(),
    };

    await this.saveGame({
      userId,
      gameId,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      memory: initialMemory,
      isActive: true,
    });

    return gameId;
  }

  generateGameId(userId: string): string {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export const getDatabaseService = (): DatabaseService => {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
};
