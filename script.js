
const MINE = -1; 
const GAME_IN_PROGRESS = 0;
const GAME_LOST = -1;
const GAME_WON = 1;

const FONT_STYLE = '15px Arial';
const QUESTION_MARK = '?';
const MINE_SYMBOL = '∗'; // &#8727;

const BOARD_BORDER_WIDTH = 1;
const CELL_BORDER_WIDTH = 1;

const DEFAULT_CELL_SIZE = 30;
const DEFAULT_BOARD_WIDTH = 8;
const DEFAULT_BOARD_HEIGHT = 8; 
const DEFAULT_MAX_MINES = 10;

const BORDER_COLOR = '#999';
const CELL_DARK_GRAIN = '#ccc';
const CELL_LIGHT_GRAIN = '#fff';
const CLOSED_CELL_COLOR = '#ddd';
const OPEN_CELL_COLOR = '#eee';
const QUESTION_MARK_COLOR = '#555';
const CELL_VALUE_COLOR = '#222';
const MINE_COLOR = 'maroon';

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

    mark() {
        this.marked = true;
    }

    unmark() {
        this.marked = false;
    }

    clear() {
        this.opened = false;
        this.marked = false;
        this.value = undefined;
    }

}

class BoardData {

    constructor(width, height, maxMines) {
        this.initialized = false;
        this.markedCells = 0;

        if (width)
            this.width = width;
        else
            this.width = DEFAULT_BOARD_WIDTH;    

        if (height)
            this.height = height;
        else
            this.height = DEFAULT_BOARD_HEIGHT;    

        if (maxMines)
            this.maxMines = maxMines;
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

    clear() {
        for (var i = 0; i < this.width; i++) 
            for(var j = 0; j < this.height; j++) 
                this.cells[i][j].clear();
        this.initialized = false;
    }

    mark(a, b) {
        var cell;
        if (typeof a == "object")
            cell = a;
        else
            cell = this.cells[a][b];
        cell.mark();
        this.markedCells += 1;
    }

    unmark(a, b) {
        var cell;
        if (typeof a == "object")
            cell = a;
        else
            cell = this.cells[a][b];
        cell.unmark();
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

class BoardPainter {

    constructor(initData, canvasElement, boardData) {
        this.boardData = boardData;

        if (initData && initData.board && initData.board.cellSize)
            this.cellSize = initData.board.cellSize;

        this.drawConstants = {};

        /* var goOn = initData && initData.board && initData.board.drawConstants;

        if (goOn && initData.board.drawConstants.cellBorderWidth)
            this.drawConstants.cellBorderWidth = initData.board.drawConstants.cellBorderWidth;
        else
            this.drawConstants.cellBorderWidth = CELL_BORDER_WIDTH;
        */

        this.initializeCanvas(canvasElement, initData.eventHandlers);
    }

    initializeCanvas(canvasElement, eventHandlers) {
        this.canvas = canvasElement;
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;

        this.context = this.canvas.getContext("2d");
        this.context.font = FONT_STYLE;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
    }

    get boardWidth() {
        return this.boardData.width * this.cellSize + (this.boardData.width - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2; // TO DO
    }

    get boardHeight() {
        return this.boardData.height * this.cellSize + (this.boardData.height - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2; // TO DO
    }

    getCellRect(x, y) {
        var result = {x1: 0, y1: 0, x2: 0, y2: 0};
        result.x1 = BOARD_BORDER_WIDTH + x * (this.cellSize + CELL_BORDER_WIDTH); // TO DO
        result.x2 = result.x1 + this.cellSize - 1;
        result.y1 = BOARD_BORDER_WIDTH + y * (this.cellSize + CELL_BORDER_WIDTH); // TO DO 
        result.y2 = result.y1 + this.cellSize - 1;
        return result;
    }

    getCellByCoord(x, y) {
        var result = {col: -1, row: -1};
        result.col = Math.floor( (x - BOARD_BORDER_WIDTH) / (this.cellSize + CELL_BORDER_WIDTH) ); // TO DO
        result.row = Math.floor( (y - BOARD_BORDER_WIDTH) / (this.cellSize + CELL_BORDER_WIDTH) ); // TO DO
        return result;
    }

    draw(forceDrawCellValue) {
        this.context.fillStyle = BORDER_COLOR; // TO DO
        this.context.fillRect(0, 0, this.boardWidth, this.boardHeight);

        for (var i = 0; i < this.boardData.width; i++)
            for(var j = 0; j < this.boardData.height; j++)
                this.drawCell(i, j, forceDrawCellValue);
    }

    drawCell(col, row, forceDrawCellValue) {
        if (col < 0 || col >= this.boardData.width || row < 0 || row >= this.boardData.height)
            return;

        if (this.boardData.cells[col][row].opened)
            this.drawOpenedCell(col, row);
        else
            this.drawClosedCell(col, row, forceDrawCellValue);        
    }

    drawClosedCell(col, row, forceDrawCellValue) {
        var rect = this.getCellRect(col, row);
        this.drawCellBorder(rect);
        this.drawCellArea(rect, CLOSED_CELL_COLOR, true);
        this.drawCellGrains(rect);
        if (typeof forceDrawCellValue == "boolean" && forceDrawCellValue)
            this.drawCellValue(col, row, rect);
        else    
            if (this.boardData.cells[col][row].marked)
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
        this.context.strokeStyle = BORDER_COLOR; // TO DO
        this.context.moveTo(cellRect.x1, cellRect.y2);
        this.context.lineTo(cellRect.x2, cellRect.y2);
        this.context.lineTo(cellRect.x2, cellRect.y1);
        this.context.stroke();
    }

    drawCellGrains(cellRect) {
        this.context.beginPath();
        this.context.strokeStyle = CELL_DARK_GRAIN; // TO DO
        this.context.moveTo( cellRect.x1, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y1);
        this.context.stroke();    

        this.context.beginPath();
        this.context.strokeStyle = CELL_LIGHT_GRAIN; // TO DO
        this.context.moveTo( cellRect.x1 + 1, cellRect.y2 - CELL_BORDER_WIDTH); // TO DO
        this.context.lineTo( cellRect.x1 + 1, cellRect.y1 + 1);
        this.context.lineTo( cellRect.x2 - CELL_BORDER_WIDTH, cellRect.y1 + 1); // TO DO
        this.context.stroke();
    }

    drawCellArea(cellRect, fillStyle, cellHasGrains) {
        this.context.fillStyle = fillStyle;
        if (cellHasGrains) {
            this.context.fillRect(  cellRect.x1 + 1, 
                                    cellRect.y1 + 1, 
                                    cellRect.x2 - cellRect.x1 - 1 - CELL_BORDER_WIDTH,  // TO DO
                                    cellRect.y2 - cellRect.y1 - 1 - CELL_BORDER_WIDTH); // TO DO
        } else {
            this.context.fillRect(  cellRect.x1, 
                                    cellRect.y1, 
                                    cellRect.x2 - cellRect.x1 - CELL_BORDER_WIDTH,      // TO DO
                                    cellRect.y2 - cellRect.y1 - CELL_BORDER_WIDTH);     // TO DO
        }
    }

    drawCellValue(col, row, cellRect) {
        var x = cellRect.x1 + (cellRect.x2 - cellRect.x1) / 2;
        var y = cellRect.y1 + (cellRect.y2 - cellRect.y1) / 2;        

        var textToDraw = " ";
        if (this.boardData.cells[col][row].marked) {
            this.context.fillStyle = QUESTION_MARK_COLOR; // TO DO
            textToDraw = QUESTION_MARK;
        } else   
            if (this.boardData.cells[col][row].hasMine()) {
                this.context.fillStyle = MINE_COLOR; // TO DO
                textToDraw = MINE_SYMBOL;
            } else {    
                this.context.fillStyle = CELL_VALUE_COLOR; // TO DO
                if (this.boardData.cells[col][row].value == 0)
                    textToDraw = " ";
                else    
                    textToDraw = this.boardData.cells[col][row].value;
                }    

        this.context.fillText(textToDraw, x, y);      
    }

}

class Game {

    constructor(initData) {
        this.isUpdating = false;
        this.isGameInProgress = false;
        this.boardData = new BoardData(initData.board.width, initData.board.height, initData.board.maxMines);
        this.boardPainter = new BoardPainter(initData, initData.canvasElement, this.boardData);
        this.setCanvasEventHandlers(initData);
        this.intervalID = 0;
 
        this.controls = {
            description: {},
            notification: {},
            time: {},
            markedCells: {}
        };
        this.controls.description = initData.controls.description;
        this.controls.time = initData.controls.time;
        this.controls.markedCells = initData.controls.markedCells;
        this.controls.notification = initData.controls.notification;
        this.controls.button = initData.controls.button;
        
        if (typeof this.controls.description == "object")
            this.controls.description.innerHTML = initData.gameDescription;
    
    }

    setCanvasEventHandlers() {
        var _this = this;
        this.boardPainter.canvas.addEventListener("click", function(e) { _this.handleLeftClick(e); } );    
        this.boardPainter.canvas.addEventListener("contextmenu", function(e) { _this.handleRightClick(e);} );     
    }

    start(restart) {
        if (restart)
            this.boardData.clear();
        this.isGameInProgress = true;
        this.startTime = Date.now();
        var _this = this; 
        this.intervalID = window.setInterval( function() {_this.updateControls(); }, 1000);
        this.boardPainter.draw();
        this.controls.notification.innerHTML = "";
        this.controls.button.value = "Сбросить";
        this.controls.button.addEventListener("click", cancelGame, {once: true});
    }

    cancel() {
        this.stopTiming();        
        this.isGameInProgress = false;
        this.controls.notification.classList.remove("won");
        this.controls.notification.classList.add("lost");
        this.controls.notification.innerHTML = "Остановлено по команде";
        if (this.boardData.initialized)
            this.boardPainter.draw(true);
        this.controls.button.value = "Новая игра";  
        this.controls.button.addEventListener("click", startNewGame, {once: true});      
    }

    win() {
        this.stopTiming();
        this.isGameInProgress = false;
        this.controls.notification.classList.remove("lost");
        this.controls.notification.classList.add("won");
        this.controls.notification.innerHTML = "Ура, победа!";
        this.controls.button.value = "Новая игра";
        this.controls.button.removeEventListener("click", cancelGame);      
        this.controls.button.addEventListener("click", startNewGame, {once: true});      
    }

    lose() {
        this.stopTiming();
        this.isGameInProgress = false;
        this.controls.notification.classList.remove("won");
        this.controls.notification.classList.add("lost");
        this.controls.notification.innerHTML = "Ой, ошибка... Попробуйте снова!";
        this.boardPainter.draw(true);
        this.controls.button.value = "Новая игра";        
        this.controls.button.removeEventListener("click", cancelGame);      
        this.controls.button.addEventListener("click", startNewGame, {once: true});        
    }

    stopTiming() {
        window.clearInterval(this.intervalID);
        this.updateControls();
    }

    startUpdate() {
        this.isUpdating = true;
    }

    endUpdate() {
        this.isUpdating = false;
    }

    checkGameStatus() {
        var openCells = 0;
        var foundMines = 0;
        var result = GAME_IN_PROGRESS;

        for(var i = 0; i < this.boardData.width; i++)
            for(var j = 0; j < this.boardData.height; j++) {
                var cell = this.boardData.cells[i][j]; 
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

        if (result != GAME_LOST && foundMines == this.boardData.maxMines && openCells == (this.boardData.width * this.boardData.height - foundMines) )
            result = GAME_WON;
        
        return result;    
    }

    openCellsAround(col, row) {
        for (var i = -1; i <= 1; i++)
          for (var j = -1; j<= 1; j++)
            if ( this.boardData.checkNeighborCellIndex(col, row, i, j))
                if (!this.boardData.cells[col + i][row + j].opened) {
                    this.boardData.cells[col + i][row + j].open();
                    this.boardPainter.drawCell(col + i, row + j);
                    if (this.boardData.cells[col + i][row + j].value == 0)
                        this.openCellsAround(col + i, row + j);
                } 
    }

    handleLeftClick(e) {
        if (! this.isUpdating) {
            this.startUpdate();
            try {
                var cellData = this.boardPainter.getCellByCoord(e.offsetX, e.offsetY);
                if (cellData.col >= 0 && cellData.row >= 0 &&
                    cellData.col < this.boardData.width && cellData.row < this.boardData.height) {
        
                    if (! this.boardData.initialized)
                        this.boardData.initialize({col: cellData.col, row: cellData.row});
            
                    this.handleLeftClickOnCell(cellData.col, cellData.row);

                    switch (this.checkGameStatus()) {
                        case GAME_WON:
                            this.win();
                            break;
                        case GAME_LOST:
                            this.lose();
                            break;
                    }
                }    
            } catch(e) {
                throw e;
            } finally {
                this.endUpdate();
            }  
        }
    }

    handleRightClick(e) {
        if (! this.isUpdating) {
            this.startUpdate();
            try {
                e.preventDefault();  

                var cellData = this.boardPainter.getCellByCoord(e.offsetX, e.offsetY);

                if (cellData.col >= 0 && cellData.row >= 0 && 
                    cellData.col < this.boardData.width && cellData.row < this.boardData.height) {

                    if (! this.boardData.initialized)
                        this.boardData.initialize({col: cellData.col, row: cellData.row});
                    
                    this.handleRightClickOnCell(cellData.col, cellData.row);  

                    switch(this.checkGameStatus()) {
                        case GAME_WON:
                            this.win();
                            break;
                        case GAME_LOST:
                            this.lose();
                            break;
                    }                    
                }    
            } catch(e) {
                throw e;
            } finally {
                this.endUpdate();
            }  
        }    
    }

    handleLeftClickOnCell(col, row) {
        var cell = this.boardData.cells[col][row];
        if (cell.marked)
            cell.removeMark();
        if (! cell.opened) {
            cell.open();
            if (cell.hasMine() ) {
                // boom !
                this.lose();
                this.boardPainter.drawCell(col, row);
            } else {
                this.boardPainter.drawCell(col, row);
                if (cell.value == 0)
                    this.openCellsAround(col, row);
            } 
        }    
    }

    handleRightClickOnCell(col, row) {
        var cell = this.boardData.cells[col][row];
        if (! cell.opened) { 
            if (! cell.marked) {
                this.boardData.mark(cell);
            } else {
                this.boardData.unmark(cell);
            }        
            this.boardPainter.drawCell(col, row);
        }        
    }

    updateControls() {
         var timeDifference = Math.floor( (Date.now() - this.startTime) / 1000 );
         var hours = Math.floor(timeDifference / 3600);
         var minutes = Math.floor( (timeDifference - hours * 3600) / 60);
         var seconds = Math.floor( timeDifference - hours * 3600 - minutes * 60);
         this.controls.time.innerHTML = 
            (hours < 10 ? ("0" + hours) : hours) + ":" + 
            (minutes < 10 ? ("0" + minutes) : minutes) + ":" + 
            (seconds < 10 ? ("0" + seconds) : seconds); 
         this.controls.markedCells.innerHTML = this.boardData.markedCells + " / " + this.boardData.maxMines; 
    }

}

function cancelGame() {
    game.cancel();
}

function startNewGame() {
    game.start(true);
}
