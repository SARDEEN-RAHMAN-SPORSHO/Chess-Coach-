import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import type { User } from '../types';

export class AuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      return this.mapFirebaseUser(firebaseUser, displayName);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? this.mapFirebaseUser(firebaseUser) : null);
    });
  }

  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    return firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser, displayName?: string): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: displayName || firebaseUser.displayName || undefined,
      createdAt: Date.now(),
    };
  }

  private handleAuthError(error: any): Error {
    const errorCode = error.code;
    let message = 'Authentication error';

    switch (errorCode) {
      case 'auth/email-already-in-use':
        message = 'Email already in use';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operation not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'User account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'User not found';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      default:
        message = error.message || 'Authentication failed';
    }

    return new Error(message);
  }
}

// Singleton instance
let authInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authInstance) {
    authInstance = new AuthService();
  }
  return authInstance;
};
