class BrainVitaGame {
    constructor() {
        this.board = [];
        this.selectedPeg = null;
        this.moveCount = 0;
        this.pegCount = 32;
        this.moveHistory = [];
        this.initializeBoard();
        this.renderBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        // Create 7x7 board
        this.board = Array(7).fill().map(() => Array(7).fill(0));
        
        // Fill the board according to Brain Vita layout
        // 0 = invalid position, 1 = empty hole, 2 = peg
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                // Invalid positions (corners) - REMOVE THESE
                if ((i < 2 && j < 2) || (i < 2 && j > 4) || 
                    (i > 4 && j < 2) || (i > 4 && j > 4)) {
                    this.board[i][j] = 0;
                } else {
                    this.board[i][j] = 2; // Start with pegs
                }
            }
        }
        
        // Center hole is empty initially
        this.board[3][3] = 1;
        this.pegCount = 32;
        this.moveCount = 0;
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.board[i][j] === 2) {
                    const peg = document.createElement('div');
                    peg.className = 'peg';
                    cell.appendChild(peg);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('board').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col);
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undoMove();
        });
    }

    handleCellClick(row, col) {
        // If clicking on an invalid position
        if (this.board[row][col] === 0) return;
        
        // If clicking on a peg
        if (this.board[row][col] === 2) {
            // Deselect if clicking on already selected peg
            if (this.selectedPeg && 
                this.selectedPeg.row === row && 
                this.selectedPeg.col === col) {
                this.deselectPeg();
                return;
            }
            
            // Select this peg
            this.selectPeg(row, col);
            return;
        }
        
        // If clicking on an empty hole
        if (this.board[row][col] === 1 && this.selectedPeg) {
            // Check if move is valid
            if (this.isValidMove(this.selectedPeg.row, this.selectedPeg.col, row, col)) {
                this.makeMove(this.selectedPeg.row, this.selectedPeg.col, row, col);
                this.deselectPeg();
                
                // Check for win condition
                if (this.pegCount === 1 && this.board[3][3] === 2) {
                    alert("Congratulations! You solved the puzzle!");
                } else if (!this.hasValidMoves()) {
                    alert("Game Over! No more moves available.");
                }
            } else {
                this.deselectPeg();
            }
        }
    }

    selectPeg(row, col) {
        this.deselectPeg();
        this.selectedPeg = { row, col };
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.querySelector('.peg').classList.add('selected');
    }

    deselectPeg() {
        if (this.selectedPeg) {
            const cell = document.querySelector(
                `.cell[data-row="${this.selectedPeg.row}"][data-col="${this.selectedPeg.col}"]`
            );
            if (cell && cell.querySelector('.peg')) {
                cell.querySelector('.peg').classList.remove('selected');
            }
            this.selectedPeg = null;
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Check if move is horizontal or vertical
        const isHorizontal = (fromRow === toRow);
        const isVertical = (fromCol === toCol);
        
        if (!isHorizontal && !isVertical) return false;
        
        // Check if move is exactly two spaces
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        if (!((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2))) {
            return false;
        }
        
        // Check if middle position has a peg
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        
        if (this.board[midRow][midCol] !== 2) return false;
        
        // Move is valid
        return true;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        // Save current state for undo
        this.moveHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            moveCount: this.moveCount,
            pegCount: this.pegCount
        });
        
        // Move the peg
        this.board[fromRow][fromCol] = 1; // From position becomes empty
        this.board[toRow][toCol] = 2;     // To position gets the peg
        
        // Remove the jumped peg
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        this.board[midRow][midCol] = 1;
        
        // Update counts
        this.moveCount++;
        this.pegCount--;
        
        // Re-render the board
        this.renderBoard();
    }

    hasValidMoves() {
        // Check all pegs for possible moves
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (this.board[i][j] === 2) { // If there's a peg
                    // Check up
                    if (i >= 2 && this.isValidMove(i, j, i-2, j)) return true;
                    // Check down
                    if (i <= 4 && this.isValidMove(i, j, i+2, j)) return true;
                    // Check left
                    if (j >= 2 && this.isValidMove(i, j, i, j-2)) return true;
                    // Check right
                    if (j <= 4 && this.isValidMove(i, j, i, j+2)) return true;
                }
            }
        }
        return false;
    }

    resetGame() {
        this.selectedPeg = null;
        this.moveHistory = [];
        this.initializeBoard();
        this.renderBoard();
    }
    undoMove() {
        if (this.moveHistory.length === 0) {
            alert("No moves to undo!");
            return;
        }
        
        // Get the last move
        const lastState = this.moveHistory.pop();
        
        // Restore the board state
        this.board = lastState.board;
        this.moveCount = lastState.moveCount;
        this.pegCount = lastState.pegCount;
        
        // Deselect any selected peg
        this.deselectPeg();
        
        // Re-render the board
        this.renderBoard();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BrainVitaGame();
});