
const MINE = -1; 
const GAME_IN_PROGRESS = 0;
const GAME_LOST = -1;
const GAME_WON = 1;

const BOARD_BORDER_WIDTH = 1;
const CELL_BORDER_WIDTH = 1;

const BORDER_COLOR = '#999';
const CELL_DARK_GRAIN = '#ccc';
const CELL_LIGHT_GRAIN = '#fff';
const CLOSED_CELL_COLOR = '#ddd';
const OPEN_CELL_COLOR = '#eee';
const QUESTION_MARK_COLOR = '#555';
const CELL_VALUE_COLOR = '#222';
const MINE_COLOR = 'maroon';

const FONT_STYLE = '15px Arial';
const QUESTION_MARK = '?';
const MINE_SYMBOL = '🞼'; // &#128956; &#x1F7BC;

const DEFAULT_CELL_SIZE = 30;
const DEFAULT_BOARD_WIDTH = 8;
const DEFAULT_BOARD_HEIGHT = 8; 
const DEFAULT_MAX_MINES = 6;

var board; 
var game;

class Cell {

    constructor (value, opened) {

        this.value = value;
        this.marked = false;

        if (opened != undefined)
            this.opened = opened;
        else
            this.opened = false;    
    }

    hasMine() {
        return this.value == MINE;
    }

    open() {
        this.opened = true;
    }

    setMark() {
        this.marked = true;
    }

    removeMark() {
        this.marked = false;
    }
}

class BoardData {

    constructor(boardData) {
        this.initialized = false;
        this.markedCells = 0;

        if (boardData && boardData.width)
            this.width = boardData.width;
        else
            this.width = DEFAULT_BOARD_WIDTH;    

        if (boardData && boardData.height)
            this.height = boardData.height;
        else
            this.height = DEFAULT_BOARD_HEIGHT;    

        if (boardData && boardData.mines)
            this.maxMines = boardData.mines;
        else
            this.maxMines = DEFAULT_MAX_MINES;    

        this.cells = new Array(this.width);
        for (var i = 0; i < this.width; i++) {
            this.cells[i] = new Array(this.height);
            for(var j = 0; j < this.height; j++)
                this.cells[i][j] = new Cell();
        }
    }
   
    initialize(excludeCell) {
        this.setMines(excludeCell);
        
        for (var i = 0; i < this.width; i++)
            for (var j = 0; j < this.height; j++)
                this.initializeCell(i, j);

        this.initialized = true;        
    }

    initializeCell(col, row) {
        if (! this.cells[col][row].hasMine() ){
            var counter = 0;

            // Count mines around 
            for (var i = -1; i <= 1; i++) 
                for (var j = -1; j <= 1; j++) {
                    if (this.checkNeighborCellIndex(col, row, i, j))
                        if (this.cells[col + i][row + j].hasMine()) 
                            counter += 1;
                }
            
            this.cells[col][row].value = counter;
        }
    }

    setMines(excludeCell) {
        for (var i = 0; i < this.maxMines; i++) {
            while (true) {
                var col = Math.floor(Math.random() * this.width);
                var row = Math.floor(Math.random() * this.height);
                if (col != excludeCell.col || row != excludeCell.row) {
                   if (! this.cells[col][row].hasMine() ) {
                        this.cells[col][row].value = MINE;
                        break;
                    }    
                }
            }               
        }
    }

    markCell(a, b) {
        var cell;
        if (typeof a == "object")
            cell = a;
        else
            cell = this.cells[a][b];
        cell.setMark();
        this.markedCells += 1;
    }

    unmarkCell(a, b) {
        var cell;
        if (typeof a == "object")
            cell = a;
        else
            cell = this.cells[a][b];
        cell.removeMark();
        this.markedCells -= 1;
    }

    checkNeighborCellIndex(col, row, incHorizontal, incVertical) {
        return ( !(incHorizontal == 0 && incVertical == 0) &&
                  (col + incHorizontal) >= 0 &&
                  (row + incVertical) >= 0 &&
                  (col + incHorizontal) < this.width &&
                  (row + incVertical) < this.height );
    }
}

class Board {

    constructor(boardData, canvasElement) {
        this.isProcessing = false;
        this.data = new BoardData(boardData);

        if (boardData && boardData.cellSize)
            this.cellSize = boardData.cellSize;

        this.canvas = canvasElement;
        this.initializeCanvas();
        this.initializeContext();
    }

    initializeCanvas(canvasElement) {
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        this.canvas.addEventListener("click", onClickHandler);    
        this.canvas.addEventListener("contextmenu", onContextMenu);         
    }

    initializeContext() {
        this.context = this.canvas.getContext("2d");
        this.context.font = FONT_STYLE;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
    }

    startUpdate() {
        this.isProcessing = true;
    }

    endUpdate() {
        this.isProcessing = false;
    }

    get boardWidth() {
        return this.data.width * this.cellSize + (this.data.width - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2;
    }

    get boardHeight() {
        return this.data.height * this.cellSize + (this.data.height - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2;
    }

    getCellRect(x, y) {
        var result = {x1: 0, y1: 0, x2: 0, y2: 0};
        result.x1 = BOARD_BORDER_WIDTH + x * (this.cellSize + CELL_BORDER_WIDTH);
        result.x2 = result.x1 + this.cellSize - 1;
        result.y1 = BOARD_BORDER_WIDTH + y * (this.cellSize + CELL_BORDER_WIDTH);  
        result.y2 = result.y1 + this.cellSize - 1;
        return result;
    }

    getCellByCoord(x, y) {
        var result = {col: -1, row: -1};
        result.col = Math.floor( (x - BOARD_BORDER_WIDTH) / this.cellSize);
        result.row = Math.floor( (y - BOARD_BORDER_WIDTH) / this.cellSize);
        return result;
    }

    drawBoard() {
        this.context.fillStyle = BORDER_COLOR;
        this.context.fillRect(0, 0, this.boardWidth, this.boardHeight);

        for (var i = 0; i < this.data.width; i++)
            for(var j = 0; j < this.data.height; j++)
                this.drawCell(i, j);
    }

    drawCell(col, row) {
        if (col < 0 || col >= this.data.width || row < 0 || row >= this.data.height)
            return;

        if (this.data.cells[col][row].opened)
            this.drawOpenedCell(col, row);
        else
            this.drawClosedCell(col, row);        
    }

    drawClosedCell(col, row) {
        var rect = this.getCellRect(col, row);
        this.drawCellBorder(rect);
        this.drawCellArea(rect, CLOSED_CELL_COLOR, true);
        this.drawCellGrains(rect);
        if (this.data.cells[col][row].marked)
            this.drawCellValue(col, row, rect);
    }

    drawOpenedCell(col, row) {
        var rect = this.getCellRect(col, row);
        this.drawCellBorder(rect);
        this.drawCellArea(rect, OPEN_CELL_COLOR, false);
        this.drawCellValue(col, row, rect);
    }

    drawCellBorder(cellRect) {
        this.context.beginPath();
        this.context.strokeStyle = BORDER_COLOR;
        this.context.moveTo(cellRect.x1, cellRect.y2);
        this.context.lineTo(cellRect.x2, cellRect.y2);
        this.context.lineTo(cellRect.x2, cellRect.y1);
        this.context.stroke();
    }

    drawCellGrains(cellRect) {
        /* this.context.beginPath();
        this.context.strokeStyle = CELL_DARK_GRAIN;
        this.context.moveTo( cellRect.x1 + 1, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y1 - 1);
        this.context.stroke(); */   
        this.context.beginPath();
        this.context.strokeStyle = CELL_DARK_GRAIN;
        this.context.moveTo( cellRect.x1, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y1);
        this.context.stroke();    

        this.context.beginPath();
        this.context.strokeStyle = CELL_LIGHT_GRAIN;
        this.context.moveTo( cellRect.x1 + 1, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x1 + 1, cellRect.y1 + 1);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y1 + 1);
        this.context.stroke();
    }

    drawCellArea(cellRect, fillStyle, cellHasGrains) {
        this.context.fillStyle = fillStyle;
        if (cellHasGrains) {
            this.context.fillRect(  cellRect.x1 + 1, 
                                    cellRect.y1 + 1, 
                                    cellRect.x2 - cellRect.x1 - 1 - CELL_BORDER_WIDTH,
                                    cellRect.y2 - cellRect.y1 - 1 - CELL_BORDER_WIDTH);
        } else {
            this.context.fillRect(  cellRect.x1, 
                                    cellRect.y1, 
                                    cellRect.x2 - cellRect.x1 - CELL_BORDER_WIDTH, 
                                    cellRect.y2 - cellRect.y1 - CELL_BORDER_WIDTH);
        }
    }

    drawCellValue(col, row, cellRect) {
        var x = cellRect.x1 + (cellRect.x2 - cellRect.x1) / 2;
        var y = cellRect.y1 + (cellRect.y2 - cellRect.y1) / 2;        

        var textToDraw = " ";
        if (this.data.cells[col][row].marked) {
            this.context.fillStyle = QUESTION_MARK_COLOR;
            textToDraw = QUESTION_MARK;
        } else   
            if (this.data.cells[col][row].hasMine()) {
                this.context.fillStyle = MINE_COLOR;
                textToDraw = MINE_SYMBOL;
            } else {    
                this.context.fillStyle = CELL_VALUE_COLOR;
                if (this.data.cells[col][row].value == 0)
                    textToDraw = " ";
                else    
                    textToDraw = this.data.cells[col][row].value;
                }    

        this.context.fillText(textToDraw, x, y);      
    }

    openCellsAround(col, row) {
        for (var i = -1; i <= 1; i++)
          for (var j = -1; j<= 1; j++)
            if ( this.data.checkNeighborCellIndex(col, row, i, j))
                if (!this.data.cells[col + i][row + j].opened) {
                    this.data.cells[col + i][row + j].open();
                    this.drawCell(col + i, row + j);
                    if (this.data.cells[col + i][row + j].value == 0)
                        this.openCellsAround(col + i, row + j);
                } 
    }

    checkGameStatus() {
        var openCells = 0;
        var foundMines = 0;
        var result = GAME_IN_PROGRESS;

        for(var i = 0; i < this.data.width; i++)
            for(var j = 0; j < this.data.height; j++) {
                var cell = this.data.cells[i][j]; 
                if (cell.hasMine()) {
                    if (cell.opened) {
                        result = GAME_LOST;
                        break;
                    } else {
                        foundMines += cell.marked ? 1 : 0;
                    }    
                } else {
                    openCells += cell.opened ? 1 : 0;    
                }
            }

        if (result != GAME_LOST && foundMines == this.data.maxMines && openCells == (this.data.width * this.data.height - foundMines) )
            result = GAME_WON;
        
        return result;    
    }

    handleClick(e) {
        if (! this.isProcessing) {
            this.startUpdate();
            try {
                var r = this.getCellByCoord(e.offsetX, e.offsetY);
                if (r.col >= 0 && r.row >= 0 && r.col < this.data.width && r.row < this.data.height) {
                    if (! this.data.initialized)
                        this.data.initialize({col: r.col, row: r.row});
                    this.handleLeftClickOnCell(r.col, r.row);

                    var r = this.checkGameStatus();
                    if (r == GAME_WON)
                        alert("You've won! Congrats!");
                    else 
                        if (r == GAME_LOST)
                            alert("Oopps, you failed. Game is over, sorry. Try again!");

                }
            }  catch(e) {
                throw e;
            }
            finally {
                this.endUpdate();
            }    
        }
    } 

    handleContextMenu(e) {
        if (! this.isProcessing) {
            e.preventDefault();
            this.startUpdate();
            try {
                var r = this.getCellByCoord(e.offsetX, e.offsetY);
                if (r.col >= 0 && r.row >= 0 && r.col < this.data.width && r.row < this.data.height) {
                    if (! this.data.initialized)
                        this.data.initialize({col: r.col, row: r.row});
                    this.handleRightClickOnCell(r.col, r.row);  
                    var r = this.checkGameStatus();
                    if (r == GAME_WON)
                        alert("You've won! Congrats!");
                    else 
                        if (r == GAME_LOST)
                            alert("Oopps, you failed. Game is over, sorry. Try again!");  
                }
            }  catch(e) {
                throw e;
            }
            finally {
                this.endUpdate();
            }    
        }
    } 

    handleLeftClickOnCell(col, row) {
        var cell = this.data.cells[col][row];
        if (! cell.opened) {
            cell.open();
            if (cell.hasMine() ) {
                // boom !
                // finishGame();
                console.log('Game over! col: ' + col + ", row: " + row);
                this.drawCell(col, row, true);
            } else {
                this.drawCell(col, row);
                if (cell.value == 0)
                    this.openCellsAround(col, row);
            } 
        }    
    }

    handleRightClickOnCell(col, row) {
        var cell = this.data.cells[col][row];
        if (! cell.opened) { 
            if (! cell.marked) {
                this.data.markCell(cell);
            } else {
                this.data.removeMark(cell);
            }        
            this.drawCell(col, row);
        }
    }

}

/* 
boardData = { width: , height: , cellSize: }
controls = {time: , foundMines, message: }
*/


class Game {

    constructor(boardData, canvas, controls) {
        // this.board = new Board(boardData, canvas);
        this.controls = {
            time: {},
            markedCells: {}
        };
        this.controls.time = controls.time;
        this.controls.markedCells = controls.markedCells;
    }

    start() {
        this.startTime = Date.now();
        window.setInterval(updateControls, 1000);
    }

    cancel() {}

    win() {}

    lose() {
    }

    updateControls() {
         var timeDifference = Date.now() - this.startTime;
         var seconds = Math.floor(timeDifference / 1000);
         var minutes = Math.floor(seconds/60);
         var hours = Math.floor(minutes/60);
         var s = String("{0:n(2)}:{1:n(2)}:{2:n(2)}");
         this.controls.time.innerHTML = s.format(hours, minutes, seconds); 
         this.controls.markedCells.innerHTML = board.data.markedCells + "/" + board.data.maxMines; 
    }



}

function onClickHandler(e) {
    board.handleClick(e);
}

function onContextMenu(e) {
    board.handleContextMenu(e);
}

function updateControls(e){
    game.updateControls();
}

window.onload = function () {
    
    // Create board
    var canvasElement = document.getElementById("board");
    if (canvasElement) { 
        board = new Board( {width: DEFAULT_BOARD_WIDTH, 
                            height: DEFAULT_BOARD_HEIGHT, 
                            mines: DEFAULT_MAX_MINES, 
                            cellSize: DEFAULT_CELL_SIZE }, canvasElement);

        var controls = {};
        controls.time = document.getElementById("time-elapsed");
        controls.markedCells = document.getElementById("marked-cells");
        game = new Game("", canvasElement, controls);   
        game.start();

        board.drawBoard(); 
    } 

}