import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';

interface ChessBoardProps {
  position: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => Promise<boolean>;
  boardOrientation?: 'white' | 'black';
  isDraggablePiece?: (piece: { piece: string; sourceSquare: Square }) => boolean;
  customBoardStyle?: React.CSSProperties;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  position,
  onPieceDrop,
  boardOrientation = 'white',
  isDraggablePiece,
  customBoardStyle = {},
}) => {
  // Wrapper to handle async callback for react-chessboard
  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    // Call async function but return true immediately to allow the visual move
    onPieceDrop(sourceSquare, targetSquare).then((success) => {
      // If the move was invalid, the store will revert the position
      if (!success) {
        console.log('Invalid move attempted');
      }
    });
    // Return true to allow the piece to move visually
    // The actual game state is managed by the store
    return true;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      aspectRatio: '1',
      ...customBoardStyle,
    }}>
      <Chessboard
        position={position}
        onPieceDrop={handlePieceDrop}
        boardOrientation={boardOrientation}
        isDraggablePiece={isDraggablePiece}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
      />
    </div>
  );
};

export default ChessBoard;
