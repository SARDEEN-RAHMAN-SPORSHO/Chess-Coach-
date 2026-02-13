import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';

interface ChessBoardProps {
  position: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
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
  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      aspectRatio: '1',
      ...customBoardStyle,
    }}>
      <Chessboard
        position={position}
        onPieceDrop={onPieceDrop}
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
