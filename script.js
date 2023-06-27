
const MINE = -1;

const GAME_IN_PROGRESS = 0;
const GAME_LOST = -1;
const GAME_WON  = 1;

const FONT_STYLE    = '15px Arial';
const QUESTION_MARK = '?';
const MINE_SYMBOL   = '∗'; // &#8727;

const BOARD_BORDER_WIDTH = 1;
const CELL_BORDER_WIDTH  = 1;

const DEFAULT_CELL_SIZE    = 30;
const DEFAULT_BOARD_WIDTH  = 8;
const DEFAULT_BOARD_HEIGHT = 8; 
const DEFAULT_MAX_MINES    = 10;

const BORDER_COLOR           = '#999';
const CELL_DARK_GRAIN_COLOR  = '#ccc';
const CELL_LIGHT_GRAIN_COLOR = '#fff';
const CLOSED_CELL_AREA_COLOR = '#ddd';
const OPEN_CELL_AREA_COLOR   = '#eee';
const QUESTION_MARK_COLOR    = '#555';
const CELL_VALUE_COLOR       = '#222';
const MINE_SYMBOL_COLOR      = 'maroon';

const LABEL_NEW_GAME        = "Новая игра";
const LABEL_CANCEL          = "Сбросить";
const MSG_GAME_WON          = "Ура, победа!";
const MSG_GAME_LOST         = "Ой, ошибка... Попробуйте еще раз";
const MSG_GAME_CANCELLED    = "Игра остановлена по требованию";

var CURRENT_USER_ID = -1;

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

            this.initializeCanvas(canvasElement, initData.eventHandlers);
    }

    initializeCanvas(canvasElement, eventHandlers) {
        // Save reference to canvas and set canvas size
        this.canvas = canvasElement;
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;

        // Initialize context
        this.context = this.canvas.getContext("2d");
        this.context.font = FONT_STYLE;
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
    }

    get boardWidth() {
        return this.boardData.width * this.cellSize + (this.boardData.width - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2;
    }

    get boardHeight() {
        return this.boardData.height * this.cellSize + (this.boardData.height - 1) * CELL_BORDER_WIDTH + BOARD_BORDER_WIDTH * 2;
    }

    getCellRect(col, row) {
        var result = {x1: 0, y1: 0, x2: 0, y2: 0};
        result.x1 = BOARD_BORDER_WIDTH + col * (this.cellSize + CELL_BORDER_WIDTH);
        result.x2 = result.x1 + this.cellSize - 1;
        result.y1 = BOARD_BORDER_WIDTH + row * (this.cellSize + CELL_BORDER_WIDTH); 
        result.y2 = result.y1 + this.cellSize - 1;
        return result;
    }

    getCellDataByCoord(x, y) {
        var result = {col: -1, row: -1};
        result.col = Math.floor( (x - BOARD_BORDER_WIDTH) / (this.cellSize + CELL_BORDER_WIDTH) );
        result.row = Math.floor( (y - BOARD_BORDER_WIDTH) / (this.cellSize + CELL_BORDER_WIDTH) );
        return result;
    }

    draw(forceDrawCellValue) {
        this.context.fillStyle = BORDER_COLOR;
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
        this.drawCellArea(rect, CLOSED_CELL_AREA_COLOR, true);
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
        this.drawCellArea(rect, OPEN_CELL_AREA_COLOR, false);
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
        this.context.strokeStyle = CELL_DARK_GRAIN_COLOR;
        this.context.moveTo( cellRect.x1, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y2);
        this.context.lineTo( cellRect.x2, cellRect.y1);
        this.context.stroke();    

        this.context.beginPath();
        this.context.strokeStyle = CELL_LIGHT_GRAIN_COLOR;
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
        if (this.boardData.cells[col][row].marked) {
            this.context.fillStyle = QUESTION_MARK_COLOR;
            textToDraw = QUESTION_MARK;
        } else   
            if (this.boardData.cells[col][row].hasMine()) {
                this.context.fillStyle = MINE_SYMBOL_COLOR;
                textToDraw = MINE_SYMBOL;
            } else {    
                this.context.fillStyle = CELL_VALUE_COLOR;
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
            time: {},
            markedCells: {},
            notification: {},
            notificationClasses: {}
        };
        this.controls.description = initData.controls.description;
        this.controls.time = initData.controls.time;
        this.controls.markedCells = initData.controls.markedCells;
        this.controls.notification = initData.controls.notification;
        this.controls.button = initData.controls.button;
        
        if (typeof this.controls.description == "object")
            this.controls.description.innerHTML = initData.gameDescription;
    
        this.controls.notificationClasses.lost = initData.controls.notificationClasses.lost;
        this.controls.notificationClasses.won = initData.controls.notificationClasses.won;

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
        this.controls.button.value = LABEL_CANCEL;
        this.controls.button.addEventListener("click", cancelGame, {once: true});
    }

    cancel() {
        this.stopTiming();        
        this.isGameInProgress = false;
        this.controls.notification.classList.remove(this.controls.notificationClasses.won);
        this.controls.notification.classList.add(this.controls.notificationClasses.lost);
        this.controls.notification.innerHTML = MSG_GAME_CANCELLED;
        if (this.boardData.initialized)
            this.boardPainter.draw(true);
        this.controls.button.value = LABEL_NEW_GAME;  
        this.controls.button.addEventListener("click", startNewGame, {once: true});      
    }

    win() {
        this.stopTiming();
        this.isGameInProgress = false;
        this.controls.notification.classList.remove(this.controls.notificationClasses.lost);
        this.controls.notification.classList.add(this.controls.notificationClasses.won);
        this.controls.notification.innerHTML = MSG_GAME_WON;
        this.controls.button.value = LABEL_NEW_GAME;
        this.controls.button.removeEventListener("click", cancelGame);      
        this.controls.button.addEventListener("click", startNewGame, {once: true});      
    }

    lose() {
        this.stopTiming();
        this.isGameInProgress = false;
        this.controls.notification.classList.remove(this.controls.notificationClasses.won);
        this.controls.notification.classList.add(this.controls.notificationClasses.lost);
        this.controls.notification.innerHTML = MSG_GAME_LOST;
        this.boardPainter.draw(true);
        this.controls.button.value = LABEL_NEW_GAME;        
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
                var cellData = this.boardPainter.getCellDataByCoord(e.offsetX, e.offsetY);
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

                var cellData = this.boardPainter.getCellDataByCoord(e.offsetX, e.offsetY);

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

function getParameters() {

    var result = {};
    var urlParams = new URLSearchParams(document.location.search);

    var param = urlParams.get("mode");
    if (param && param.toLocaleLowerCase() == "direct-games") {
        // Direct Games
        result = {
            board: {
                width: 7,
                height: 7,
                cellSize: 40,
                maxMines: 6 
            },    
            canvasElement: document.getElementById("board"),
            controls: {
                time: document.getElementById("time-elapsed"),
                markedCells: document.getElementById("marked-cells"),
                description: document.getElementById("description"), 
                notification: document.getElementById("notification"),
                button: document.getElementById("button"),
                notificationClasses: {
                    lost: "lost",
                    won:  "won"
                }
            },
            gameDescription: "<p>Чтобы открыть клетку &mdash; нажмите её.<br/>" + 
                             "Чтобы пометить клетку заминированной &mdash; нажмите и удерживайте её.</p>" +
                             "<p>Игра закончится, когда все клетки с минами помечены, а остальные открыты.</p>"
        };
    } else {
        // Web games
        result = {
            board: {
                width: 10,
                height: 10,
                cellSize: 30,
                maxMines: 8 
            },    
            canvasElement: document.getElementById("board"),
            controls: {
                time: document.getElementById("time-elapsed"),
                markedCells: document.getElementById("marked-cells"),
                description: document.getElementById("description"), 
                notification: document.getElementById("notification"),
                button: document.getElementById("button"),
                notificationClasses: {
                    lost: "lost",
                    won:  "won"
                }
            },
            gameDescription: "<p>Чтобы открыть клетку &mdash; щёлкните её.<br/>" + 
                             "Чтобы пометить клетку заминированной &mdash; щёлкните её правой кнопкой.</p>" +
                             "<p>Игра закончится, когда все клетки с минами помечены, а остальные открыты.</p>"
        };
    }   

    return result;
}


window.onload = function () {
   
    
    // document.addEventListener('visibilitychange', visibilityChangeHandler);


    getCurrentUserID();
    
    var initData = getParameters();
    game = new Game(initData);
    game.start();

    

    // Удалите комментарий со следующих строк ниже
    if (vkBridge)
        vkBridge.send("VKWebAppInit", {})
        .then(data => {console.log("success!"); console.log(data.result); } )
        .catch(error => {console.log("error!");  console.log(error); } );

    if (vkBridge) {
        vkBridge.subscribe(eventHandler);
    }    

    let h = document.getElementById("additionalTitle");
    if (h) 
      h.innerHTML = " — через туннель"; 



    // document.getElementById("test-button-1").addEventListener("click", showAd1);
    document.getElementById("test-call-method").addEventListener("click", testCallMethod);
    document.getElementById("btn1").addEventListener("click", testGetMethods);
    // document.getElementById("test-check-hash-go").addEventListener("click", checkHashJump);
    // document.getElementById("test-check-hash").addEventListener("click", checkHash);
    // document.getElementById("test-button-1").addEventListener("click", sendMessageFromGroup);
    // document.getElementById("test-button-2").addEventListener("click", addToFavorites /* showAd2 */ );   
    // document.getElementById("test-button-3").addEventListener("click", emulateFailure);
    // document.getElementById("test-button-4").addEventListener("click", sendWallPost /* test4 */);    
    // document.getElementById("test-button-5").addEventListener("click", testPurchase); 
    // document.getElementById("test-button-5err").addEventListener("click", testPurchaseErr);    
    // //document.getElementById("test-button-6").addEventListener("click", testSubscription); 
    // //document.getElementById("test-button-6err").addEventListener("click", testSubscriptionErr);   
    // //document.getElementById("test-button-7").addEventListener("click", testSubscriptionCancel); 
    // //document.getElementById("test-button-7err").addEventListener("click", testSubscriptionCancelErr);
    // //document.getElementById("test-button-8").addEventListener("click", testSubscriptionResume); 
    // //document.getElementById("test-button-8err").addEventListener("click", testSubscriptionResumeErr); 
    // document.getElementById("test-button-9").addEventListener("click", requestPermissions);   
    // document.getElementById("test-button-misc").addEventListener("click", testMisc);  
    // document.getElementById("test-button-get-permissions").addEventListener("click", getPermissions);
    // document.getElementById("test-button-allow-notifications").addEventListener("click", testAllowNotifications);
    // document.getElementById("test-button-deny-notifications").addEventListener("click", testDenyNotifications);
}

function testGetMethods() {

    vkBridge.send("VKWebAppGetUserInfo", { user_id: "1"})
    .then( (data) => {
      console.log(data);
      result.innerHTML = 'Success! Data: \n' + JSON.stringify(data);
    })
    .catch( (err) => {
      console.log(err);  
      result.innerHTML = 'Error! Data: \n' + JSON.stringify(err);
    });

}

function testCallMethod() {
    let edit = document.getElementById('edit1');
    let result = document.getElementById('resultsOfCall');
    let methodName = edit.value.trim();

    console.log('Calling ' + methodName);
    result.innerHTML = 'Calling ' + methodName;
    vkBridge.send(methodName, {})
      .then( (data) => {
        result.innerHTML = 'Success! Data: \n' + JSON.stringify(data);
      })
      .catch( (err) => {
        result.innerHTML = 'Error! Data: \n' + JSON.stringify(err);
      });
}

function checkHash() {
    let span = document.getElementById('test-info');
    if (window) {
        console.log('Вызов window.location из iframe', window.location);
        if (window.location)
            span.innerHTML = 'Hash: ' + window.location.hash;
        else     
            span.innerHTML = 'Hash: window.location is undefined';
    }
    else {
        span.innerHTML = 'Hash: window == undefined';
        console.log('Вызов window.location из iframe. window == undefined');
    }
}

function checkHashJump() {
    let span = document.getElementById('edit1');
    if (span.value != '') {
        window.location.hash = '#' + span.value;
        console.log("Установлен hash " + window.location.hash);
    } else {
        console.log('Cannot jump. span.value is empty');
    }
}

function visibilityChangeHandler() {
    // Проверяем, скрыта ли страница
    if (document.hidden) { 
      my_audio.pause(); // Останавливаем воспроизведение аудио 
    } else {
      my_audio.play(); // Запускаем воспроизведение
    }
  }

function getCurrentUserID() {
    const regex = /&viewer_id=([0-9]*)/;
    let result = window.location.search.match(regex);
    if (result) {
        CURRENT_USER_ID = result.length > 1 ? result[1] : -1;
    } else {
        CURRENT_USER_ID = undefined;
    }
}

function getPermissions() {
  vkBridge.send("VKWebAppCheckAllowedScopes",  {scopes: 'notify,friends,wall,market' })
    .then( (data) => {
        console.log('VKWebAppCheckAllowedScopes response', data);
    })
    .catch ( (e) => {
        console.log('VKWebAppCheckAllowedScopes ошибка', e);
    })
}

function testAllowNotifications() {
    vkBridge.send("VKWebAppAllowNotifications")
      .then( (data) => {
          console.log('VKWebAppAllowNotifications response', data);
      })
      .catch ( (e) => {
          console.log('VKWebAppAllowNotifications ошибка', e);
      })
}

function testDenyNotifications() {
    vkBridge.send("VKWebAppDenyNotifications")
      .then( (data) => {
          console.log('VKWebAppDenyNotifications response', data);
      })
      .catch ( (e) => {
          console.log('VKWebAppDenyNotifications ошибка', e);
      })
}


function requestPermissions() {

    ACCESS_TOKEN = 'vk1.a.27t4n95QrCsV-fOTw43yEuioegDBgdRBC4oj7Cpfp7fFpp9vYqHeKdYf8RbsbIOq9sR0zYkxA-ueDd1MBoPSY3DxE3KhiCeQ6THRayf7SFyQdbpHA3kbgWP0ofQOZauRVxvx6ovwyBu8OCJfZiSu79Rkn2WK02u6YW_DXLp2kqyiHbAYvaXZnViKSfTkh21g';
    const requestAPIHelper = new RequestAPIHelper(8216869, ACCESS_TOKEN, "photos");

    requestAPIHelper.trySendRequest('friends.getAppUsers', 'friends', {v: '5.131'})
      .then( (data) => { 
        console.log('trySendRequest then(data):', data);
        //Обработка данных пользователя, 
        // полученных в ответе на запрос к API.
      })
      .catch( (err) => {
        // Обработка ошибки, 
        // полученной в ответе на API-запрос. 
        console.log('trySendRequest catch(err):', err);
    }) 


    const AppID = 8216869;
    var r = false;

    console.log('Calling VKWebAppCheckAllowedScopes...');
    vkBridge.send('VKWebAppCheckAllowedScopes', {
        app_id: AppID,
        scopes: "friends,docs"
    })
    .then( (data) => {
        console.log('then(data): ', data);

        console.log('Calling VKWebAppGetAuthToken ...');  
        vkBridge.send('VKWebAppGetAuthToken', {
          app_id: AppID,
          scope: 'friends'
        })
        .then( (data) => {
          console.log('then(data):', data)
        })
        .catch( (err) => {
          console.log('catch(err):', err);
        })

    })
    .catch( (err) => {
        console.log(".catch(err): ", err);
        r = false;
    });

}

function sendMessageFromGroup(e) {
  console.log('Event: ', e);
  vkBridge.send('VKWebAppAllowMessagesFromGroup', {
    group_id: 216317416,
    key: '743784474' 
  })
  .then( (data) => {
    console.log('Result. .then(): ', data);
  })
  .catch( (e) => {
    console.log('Result. .catch(): ', e);
  })

}

function testMisc(e) {
    console.log('Message test started')
    var element = document.getElementById('test-results');

    const GROUP_ID = 216317505; // 215806856;

    vkBridge.send('VKWebAppAllowMessagesFromGroup', 
       { group_id: GROUP_ID, key: 'test-key-1'})
    .then( data => { 
        console.log(data);
        console.log('Message test result: .then()', data);
        console.log('Message test is over');  
    })
    .catch (error => {
        console.log(error);
        console.log('Message test result: .catch()', error);
        console.log('Message test is over');
    } );
}

function addToFavorites() {
  vkBridge.send("VKWebAppAddToFavorites")
    .then( (data) => { 
      console.log("Then: Success", data);
    })
    .catch( (error) => { 
      console.log("Catch: Error", error);
    });    
}

function test4() {
     vkBridge.send('VKWebAppShowSurvey', /* {test_mode: true} */ )
     .then( (data) => {
       console.log('Show.then( data ): ', data);
     })
     .catch( (error) => {
       console.log('Show.catch( error ):  ', error);
     })


}

function sendWallPost() {
    console.log('Posting on a wall... ')
    vkBridge.send('VKWebAppShowWallPostBox', {
        message: 'Это тестовая запись. А это [https://vk.com/app816869|ссылка в ней]',
        attachment: 'https://vk.com/app8216869',
        owner_id: CURRENT_USER_ID  // 743784474 // 4498528
    })
    .then( data => {
        console.log('ShowWallPost  then(data): ', data);
    })
    .catch( e => {
        console.log('ShowWallPost catch(e): ', e);
    })

}

function showAd1() {
    vkBridge.send("VKWebAppCheckNativeAds", {ad_format:"reward"})
        .then(data => 
                { console.log("Check: promise->then");
                  console.log(data); 
                  if (data.result) {
                    let label = document.createElement("span");
                    label.innerHTML = "Посмотрите ролик, чтобы прокачать героя";
                    let btn = document.createElement("input");
                    btn.type = "button";
                    btn.value = "Посмотреть";
                    btn.addEventListener("click", fooButtonClick);
                    document.getElementById("my-form").appendChild(label);
                    document.getElementById("my-form").appendChild(btn);
                  } else {
                    console.log("No ad materials have been loaded.");
                  }     
                })
        .catch(error => 
                { console.log("promise->error"); console.log(error); }
            );

}

function fooButtonClick() {
    vkBridge.send("VKWebAppShowNativeAds", {ad_format:"reward"})
        .then(data => { 
            console.log("Show: promise->then");
            console.log(data);
            if (data.result)
                console.log("Реклама была показана");
            else
                console.log("Ошибка");
        })
        .catch(error => {console.log(error); });
}

var weHaveSomethingPreLoaded = false;

function eventHandler(e) {
    console.log(e.detail.type);
    const { type, data } = e.detail;
    switch(type) {
        case "VKWebAppViewHide":
            my_audio.pause(); // Останавливаем воспроизведение аудио 
            break;
        case "VKWebAppViewRestore": 
            my_audio.play(); // Запускаем воспроизведение
            break;    
        case "VKWebAppCheckNativeAdsResult":
            console.log("Запрос прошел.");
            if (data.result)
                console.log("Предзагруженные материалы есть");
            else
                console.log("Рекламы нет");     
            console.log(e);
            break;
        case "VKWebAppCheckNativeAdsFailed":
            console.log("Ошибка!")      
            console.log(data.error_type, data.error_data);     
            console.log("Ошибка: " + data.error_type, data.error_data);
            console.log(e); 
            break;
        default:
            console.log(e);
        }
}

function showAd2() {
    /* if (weHaveSomethingPreLoaded) {
        weHaveSomethingPreLoaded = false;
        vkBridge.send("VKWebAppShowNativeAds", {"ad_format": "reward"});
    } */

    // Проверяем, добавлена ли игра на главный экран
    vkBridge.send('VKWebAppAddToHomeScreenInfo')
      .then( (data) => {
        if (! data.is_added_to_home_screen) { // Если не добавлена,
            vkBridge.send('VKWebAppAddToHomeScreen') //  то добавляем
              .then( (data) => {
                if (data.result) {
                  alert('Добавлена!');
                } else {
                  alert('Не добавлена!');
                }
            })
            .catch( (e) => { alert('Ошибка добавления! ' + e);})    
        } else {
            alert('Игра уже добавлена');
        }

      })
      .catch( (e) => { alert('Ошибка проверки! ' + e); });  
}

function emulateFailure() {

    console.log('Sending a request ...');
    vkBridge.send('VKWebAppShowRequestBox', {
        uid: 4498528,  // 743784474
        requestKey: 12345,
        message: 'Пожалуйста, отправь мне кирку с длинной ручкой в игре Пещера Горного Короля.',
        attachment: 'https://vk.com/app8216869'
    })

    // vkBridge.send("VKWebAppCheckNativeAds", {"ad_format": "adadasd"});

    /* vkBridge.send('VKWebAppCheckSurvey',  {test_mode: true} )
      .then( (data) => {
        console.log('Check.then( data ): ', data);
      })
      .catch( (error) => {
        console.log('Check.catch( error ):  ', error);
      }) */

    /* var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "do?action=feed", true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Response
      var response = this.responseText; 
      console.log(response);
   }
};
xhttp.send(); */
}

function testPurchase() {

   console.log('Send VKWebAppShowInviteBox w requestKey = key-12345');

    vkBridge.send('VKWebAppShowInviteBox', {requestKey: 'key-12345'})
      .then( (data) => {
        console.log('.then() result: ', data);
      })
      .catch( (e) => {
        console.log('.catch() result: ', e);
      })
    /*
    vkBridge.send('VKWebAppShowOrderBox', 
    { 
      type: 'item',
      item: 'item1' // 'sale_item_dom_1',
    })
    .then( (data) => { 
        console.log('Test purchase. Success:', data); 
    } ) 
    .catch( (e) => { console.log('Test purchase. Error:', e); } )
    */
}

function testPurchaseErr() {

    var elem = document.getElementById('spanSubscriptionID');
    var value = elem.value;

    var obj;
    if (value < 0)
      obj = undefined;
    else 
      obj = {
        user_result: value
      }  

    console.log('Sending (obj): ', obj);

    vkBridge.send('VKWebAppShowLeaderBoardBox', obj)
    .then( (data) => {
        console.log('.then( data ): ', data);
    })
    .catch( (e) => {
        console.log('.catch( e ): ', e);
    })


    // vkBridge.send('VKWebAppAddToProfile', {ttl: 0})
    //  .then( (data) => { console.log('Test purchase. Success:', data); }) 
    //  .catch( (e) => { console.log('Test purchase. Error:', e); });

    /* 
    vkBridge.send('VKWebAppShowOrderBox', 
    { 
      type: 'item',
      item: 'sale_item_err1_1',
    })
    .then( (data) => { console.log('Test purchase. Success:', data); } ) 
    .catch( (e) => { console.log('Test purchase. Error:', e); } ) */
}

function testSubscription(){

    const SUBSCRIPTION_TO_BUY = 'sale_item_subscription_1';

    console.log(`Buying a subscription: '${SUBSCRIPTION_TO_BUY}'...`);
    
    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'create',
      item: SUBSCRIPTION_TO_BUY,
    })
    .then( (data) => { 
        console.log('Buying subscription. Success:', data);
        let elem = document.getElementById('spanSubscriptionID');
        elem.value = data.subscriptionId; 
    }) 
    .catch( (e) => { 
        console.log('Buying subscription. Error:', e);
    })
}

function testSubscriptionErr(){
    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'create',
      item: 'sale_item_subscription_err_1',
    })
    .then( (data) => { console.log('Test subscription. Success:', data); } ) 
    .catch( (e) => { console.log('Test subscription. Error:', e); } )
}

function testSubscriptionCancel(){
    let elem = document.getElementById('spanSubscriptionID');
    let subscriptionId = elem.value;
    
    console.log('Cancelling the subscription: ' + subscriptionId);

    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'cancel',
      subscription_id: subscriptionId
    })
    .then( (data) => { 
        console.log('Cancelling subscription. Success:', data); 
    }) 
    .catch( (e) => {
        console.log('Cancelling subscription. Error:', e);
    });
}

function testSubscriptionCancelErr(){
    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'cancel',
      item: 'sale_item_subscription_err_1',
    })
    .then( (data) => { console.log('Test subscription cancelling. Success:', data); } ) 
    .catch( (e) => { console.log('Test subscription cancelling. Error:', e); } )
}

function testSubscriptionResume(){
    let elem = document.getElementById('spanSubscriptionID');
    let subscriptionId = elem.value;
    console.log('Resuming the subscription: ' + subscriptionId);
    
    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'resume',
      // item: 'sale_item_subscription_2',
      subscription_id: subscriptionId
    })
    .then( (data) => { 
        console.log('Resuming subscription. Success:', data); 
    }) 
    .catch( (e) => { 
        console.log('Resuming subscription. Error:', e);
    });
}

function testSubscriptionResumeErr(){
    vkBridge.send('VKWebAppShowSubscriptionBox', 
    { 
      action: 'resume',
      item: 'sale_item_subscription_err_1',
    })
    .then( (data) => { console.log('Test subscription cancelling. Success:', data); } ) 
    .catch( (e) => { console.log('Test subscription cancelling. Error:', e); } )
}

class RequestAPIHelper {

    constructor(appId, accessToken, allowedScopes) {
      this.appId = appId; // ID игры
      this.accessToken = accessToken; // access_token, полученный при старте
      this.scopes = allowedScopes; // Map-объект с правами доступа, переданными при старте 
    }
  
    // Вызов API-метода
    async trySendRequest(method, scope, params) {
  
      // Служебная функция для выполнения API-запроса  
      const sendApiRequest = (method, params) => {
        return vkBridge.send('VKWebAppCallAPIMethod', {
          method: method, // Имя вызываемого метода
          request_id: '123', // Порядковый номер запроса
          params: params, // Параметры вызова
        })
      };
  
      // Проверяем, поддерживает ли библиотека 
      // событие VKWebAppCheckAllowedScopes 
      if (bridge.supports('VKWebAppCheckAllowedScopes') && !this.scopes.has(scope)) {
        try {
  
          const allowedScopes = await vkBridge.send('VKWebAppCheckAllowedScopes', {
            app_id: this.appId,
            scopes: scope,
          });
  
          this.scopes.set(
            scope,
            allowedScopes.some( (item) => {
              return item.scope === scope && item.allowed
            })
          );
        } catch (e) {
          console.error(e); // Событие не поддерживается
        }
      }
  
      // Если нужных прав нет ...
      if (!this.scopes.get(scope)) {
        try {
          // ... то запрашиваем их
  
          const authTokenData = await vkBridge.send('VKWebAppGetAuthToken', {
            app_id: this.appId,
            scope: scope,
          });
  
          this.accessToken = authTokenData.access_token; // Получаем access_token
          this.scopes.set(scope, true); // Сохраняем права в список прав
  
        } catch (e) {
          console.error(e); // Ошибка при запросе прав
        }
  
        // Вызываем API-метод
        params['access_token'] = this.accessToken;
        return sendApiRequest(method, params);
  
      } else {
        // Если нужные права есть,
        // то вызываем API-метод
        return sendApiRequest(method, params);
      }
    }
  }