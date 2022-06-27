
const MINE = -1; 
const BOARD_BACKGROUND = '#bbb'
const BORDER_COLOR = '#aaa';
const CELL_BORDER_WIDTH = 1;
const BOARD_BORDER_WIDTH = 1;
const FONT_STYLE = '15px Arial';
const QUESTION_MARK = '?';
const CLOSED_CELL_COLOR = '#ddd';
const OPEN_CELL_COLOR = '#eee';
const DEFAULT_CELL_SIZE = 30;
const DEFAULT_BOARD_WIDTH = 10;
const DEFAULT_BOARD_HEIGHT = 10; 
const DEFAULT_MAX_MINES = 10;

var board; 

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

}

class BoardData {

    constructor(boardData) {
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
   
    initialize() {
        this.setMines();
        
        for (var i = 0; i < this.width; i++)
            for (var j = 0; j < this.height; j++)
                this.initializeCell(i, j);
    }

    initializeCell(x, y) {
        if (! this.cells[x][y].hasMine() ){
            var counter = 0;

            // Count mines around 
            for (var i = -1; i <= 1; i++) 
                for (var j = -1; j <= 1; j++)
                    if ( (x + i >= 0) && 
                         (y + j >= 0) && 
                         (x + i < this.width) && 
                         (y + j < this.height) )
                        counter += this.cells[x + i][y + j].hasMine() ? 1 : 0;
            this.cells[x][y].value = counter;
        }
    }

    setMines() {
        for (var i = 0; i < this.maxMines; i++) {
            while (true) {
                var col = Math.floor(Math.random() * this.width);
                var row = Math.floor(Math.random() * this.height);
                if (! this.cells[col][row].hasMine() ) {
                    this.cells[col][row].value = MINE;
                    break;
                }    
            }               
        }
    }

}

class Board {

    constructor(boardData, canvasElement) {
        this.initialized = false;
        this.data = new BoardData(boardData);

        if (boardData && boardData.cellSize)
            this.cellSize = boardData.cellSize;

        this.canvas = canvasElement;
        this.context = this.canvas.getContext("2d");
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        this.canvas.addEventListener("click", onClickHandler);             
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
        this.context.fillStyle = BOARD_BACKGROUND;
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
        this.context.beginPath();
        this.context.strokeStyle = '#999';
        this.context.moveTo( cellRect.x1, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y1);
        this.context.stroke();        

        this.context.beginPath();
        this.context.strokeStyle = '#fff';
        this.context.moveTo( cellRect.x1, cellRect.y2 - CELL_BORDER_WIDTH);
        this.context.lineTo( cellRect.x1, cellRect.y1);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y1);
        this.context.stroke();
    }

    drawCellArea(cellRect, fillStyle, cellHasGrains) {
        this.context.fillStyle = fillStyle;
        if (cellHasGrains) {
            this.context.fillRect(  cellRect.x1 + 1, 
                                    cellRect.y1 + 1, 
                                    cellRect.x2 - cellRect.x1 - 2 - CELL_BORDER_WIDTH,
                                    cellRect.y2 - cellRect.y1 - 2 - CELL_BORDER_WIDTH);
        } else {
            this.context.fillRect(  cellRect.x1, 
                                    cellRect.y1, 
                                    cellRect.x2 - cellRect.x1 - CELL_BORDER_WIDTH, 
                                    cellRect.y2 - cellRect.y1 - CELL_BORDER_WIDTH);
        }
    }

    drawCellValue(col, row, cellRect) {
        this.context.font = FONT_STYLE;
        this.context.textAlign = 'center';
        this.context.fillStyle = 'black';
        var x = cellRect.x1 + (cellRect.x2 - cellRect.x1) / 2;
        var y = cellRect.y1 + (cellRect.y2 - cellRect.y1) / 2;
        if (this.data.cells[col][row].marked)
            this.context.fillText(QUESTION_MARK, x, y);
        else
            this.context.fillText(this.data.cells[col][row].value, x, y);
    }

    handleClick(e) {
        var r = this.getCellByCoord(e.offsetX, e.offsetY);
        if (r.col >= 0 && r.row >= 0 && r.col < this.data.width && r.row < this.data.height) {
            if (! this.initialized)
                this.data.initialize();
            var cell = this.data.cells[r.col][r.row];
            if (! cell.opened) {
                cell.opened = true;
                this.drawCell(r.col, r.row);
            }
        }
    } 

}

function onClickHandler(e) {
    board.handleClick(e);
}

window.onload = function () {
    
    // Create board
    var canvasElement = document.getElementById("board");
    if (canvasElement) { 
        board = new Board( {width: DEFAULT_BOARD_WIDTH, 
                                height: DEFAULT_BOARD_HEIGHT, 
                                mines: DEFAULT_MAX_MINES, 
                                cellSize: DEFAULT_CELL_SIZE }, canvasElement);
        board.drawBoard(); 
    } 

}