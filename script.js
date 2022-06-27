
const MINE = -1; 
const BOARD_BACKGROUND = 'green'
const BORDER_COLOR = 'violet';
const CELL_BORDER_WIDTH = 1;
const BOARD_BORDER_WIDTH = 1;
const FONT_STYLE = '15px sans-serif';
const QUESTION_MARK = '?';
const CLOSED_CELL_COLOR = '#ccc';
const OPEN_CELL_COLOR = '#eee';
const DEFAULT_CELL_SIZE = 30;
const DEFAULT_BOARD_WIDTH = 10;
const DEFAULT_BOARD_HEIGHT = 10; 
const DEFAULT_MAX_MINES = 10;


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
                var x = Math.random() * this.width;
                var y = Math.random() * this.height;
                if (! this.callHasMine(x, y) ) {
                    this.cells[x][y].value = MINE;
                    break;
                }    
            }               
        }
    }
}

class Board {

    constructor(boardData, canvasElement) {
        this.data = new BoardData(boardData);

        if (boardData && boardData.cellSize)
            this.cellSize = boardData.cellSize;

        this.canvas = canvasElement;
        this.context = this.canvas.getContext("2d");
        this.canvas.addEventListener("click", this.onClickHandler);      
    }

    drawBoard() {
        this.context.fillStyle = BOARD_BACKGROUND;
        this.context.fillRect(0, 0, this.data.width * this.cellSize + (this.data.width - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2, this.data.height * this.cellSize + (this.data.height - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2);

        for (var i = 0; i < this.data.width; i++)
            for(var j = 0; j < this.data.height; j++)
                this.drawCell(i, j);
    }

    drawCell(x, y) {
        if (x < 0 || x >= this.data.width || y < 0 || y >= this.data.height)
            return;

        if (this.data.cells[x][y].opened)
            this.drawOpenedCell(x, y);
        else
            this.drawClosedCell(x, y);        
    }

    drawClosedCell(x, y) {
        this.drawCellBorder(x, y);
        //this.drawCellGrains(x, y);
        //this.drawCellArea(x, y, CLOSED_CELL_COLOR, GRAIN_SIZE);
    }

    drawOpenedCell(x, y) {
        this.drawCellBorder(x, y);
        this.drawCellArea(x, y, OPEN_CELL_COLOR, 0);
        this.drawCellValue(x, y);
    }

    getCellRect(x, y) {
        var result = {x1: 0, y1: 0, x2: 0, y2: 0};
        result.x1 = BOARD_BORDER_WIDTH + x * (this.cellSize + CELL_BORDER_WIDTH);
        result.x2 = result.x1 + this.cellSize - 1;
        result.y1 = BOARD_BORDER_WIDTH + y * (this.cellSize + CELL_BORDER_WIDTH);  
        result.y2 = result.y1 + this.cellSize - 1;
        return result;
    }

    drawCellBorder(x, y) {
        this.context.beginPath();
        this.context.strokeStyle = BORDER_COLOR;
        var rect = this.getCellRect(x, y);
        this.context.moveTo(rect.x1, rect.y2);
        this.context.lineTo(rect.x2, rect.y2);
        this.context.lineTo(rect.x2, rect.y1);
        this.context.stroke();
    }

    drawCellGrains(x, y) {
        this.context.beginPath();
        this.context.strokeStyle = 'red';
        this.context.moveTo( x * this.cellSize, (y + 1) * this.cellSize - BORDER_WIDTH - 1);
        this.context.lineTo( (x + 1) * this.cellSize - BORDER_WIDTH - 1, (y + 1) * this.cellSize - BORDER_WIDTH - 1);
        this.context.lineTo( (x + 1) * this.cellSize - BORDER_WIDTH - 1, y * this.cellSize - BORDER_WIDTH - 1);
        this.context.stroke();        

        this.context.beginPath();
        this.context.strokeStyle = '#fff';
        this.context.moveTo(x * this.cellSize, (y + 1) * this.cellSize - BORDER_WIDTH - 1);
        this.context.lineTo(x * this.cellSize, y * this.cellSize);
        this.context.lineTo( (x + 1) * this.cellSize - BORDER_WIDTH - 1, y * this.cellSize);
        this.context.stroke();
    }

    drawCellArea(x, y, fillStyle, grainSize) {
        this.context.fillStyle = fillStyle;
        this.context.fillRect( x * this.cellSize + grainSize, y * this.cellSize + grainSize, this.cellSize - grainSize,this.cellSize - grainSize);
    }

    drawCellValue(x, y) {
        x_coord = (x + 0.5) * this.cellSize;
        y_coord = (y + 0.5) * this.cellSize;
        if (this.data.cell[x][j].marked)
            this.context.fillText(QUESTION_MARK, x_coord, y_coord);
        else
            this.context.fillText(this.data.cell[x][j].value, x_coord, y_coord);
    }

    onClickHandler(e) {
        console.log('OnClick event...');
        console.log(e);
    }

}

window.onload = function () {
    
    // Create board
    var canvasElement = document.getElementById("board");
    if (canvasElement) {
        var board = new Board( {width: DEFAULT_BOARD_WIDTH, 
                                height: DEFAULT_BOARD_HEIGHT, 
                                mines: DEFAULT_MAX_MINES, 
                                cellSize: DEFAULT_CELL_SIZE }, canvasElement);
        board.drawBoard(); 
    } 

}