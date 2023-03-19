const MAX_NUM = 2048;
const HEIGHT = 4;
const WIDTH = 4;
let TRANSITION_TIME = 200;
const MERGE_TIME = 100;
const grid = [];

let updates = [];
let INPUT_ENABLED = true;
let CONTINUE_ENABLED = false;
let touchStart = {x: 0, y: 0};
let touchEnd = {x: null, y: null};
let swipeDistance;

let tilePositions;
const gameBox = document.getElementsByClassName("game-2048")[0];
let renderGrid = undefined;
let gameScreen = undefined;
let restartButton = undefined;

initGame();

function initGame() {
    initGameBoxElements();

    for (let i = 0; i < HEIGHT; i++)
        grid.push(Array(WIDTH).fill(null));

    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++)
            renderGrid.append(document.createElement("div"));
        
    tilePositions = document.querySelectorAll(".grid-2048 > div");
    document.addEventListener("keydown", disableArrowScroll);
    document.addEventListener("keydown", keyHandler);
    
    renderGrid.addEventListener("touchstart", swipeHandler);
    renderGrid.addEventListener("touchmove", swipeHandler);
    renderGrid.addEventListener("touchend", swipeHandler);
    window.addEventListener("resize", resizeHandler);
    resizeHandler();
    restartButton.addEventListener("click", restartHandler);
    spawnRandom();
    spawnRandom();
    // spawnSpecial();
    render();
}

function initGameBoxElements() {
    restartButton = document.createElement("button");
    restartButton.className = "restart-button";
    restartButton.type = "button";
    restartButton.tabIndex = "0";
    restartButton.textContent = "New Game"
    gameBox.append(restartButton);

    renderGrid = document.createElement("section");
    renderGrid.className = "grid-2048";
    renderGrid.tabIndex = "0";
    gameBox.append(renderGrid);

    gameScreen = document.createElement("section");
    gameScreen.className = "game-screen hidden";
    gameScreen.append(document.createElement("header"));
    gameScreenButton = document.createElement("button");
    gameScreenButton.type = "button";
    gameScreenButton.tabIndex = "0";
    gameScreen.append(gameScreenButton);
    renderGrid.append(gameScreen);
}

function resizeHandler() {
    let gridStyle = window.getComputedStyle(renderGrid);
    renderGrid.style.height = gridStyle.width;
    renderGrid.style.fontSize = parseFloat(gridStyle.width) * (16/705) + "px";
    renderGrid.classList.add("transition-off");
    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++) {
            let tiles = document.getElementsByClassName(`tile-position-${i}-${j}`);
            if (tiles.length) {
                setTilePos(tiles[0], i, j);
                setTileSize(tiles[0], i, j);
            }
        }
    renderGrid.classList.remove("transition-off");
    swipeDistance = tilePositions[0].getBoundingClientRect().width * 1.2;
    TRANSITION_TIME = Math.min(Math.max(parseFloat(gridStyle.width) * (200/705), 120), 200);
    renderGrid.style.transition = `top ${TRANSITION_TIME/1000}s linear, left ${TRANSITION_TIME/1000}s linear, transform 0.1s linear`;
}

function restartHandler() {
    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++)
            grid[i][j] = null;
    let tiles = renderGrid.querySelectorAll(".tile");
    for (let tile of tiles) tile.remove();
    spawnRandom();
    spawnRandom();
    render();
    CONTINUE_ENABLED = false;
    INPUT_ENABLED = true;
    gameScreen.classList.add("hidden");
    gameScreen.style.opacity = 0;
}

function continueHandler() {
    CONTINUE_ENABLED = true;
    INPUT_ENABLED = true;
    gameScreen.classList.remove("won");
    gameScreen.classList.add("hidden");
    gameScreen.style.opacity = 0;
}

function disableArrowScroll(e) {
    if (e && e.keyCode > 36 && e.keyCode < 41)
        e.preventDefault();
}

function swipeHandler(e) {
    if (e.type === "touchstart") {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
        touchEnd.x = e.touches[0].clientX;
        touchEnd.y = e.touches[0].clientY;
    } else if (e.type === "touchmove") {
        e.preventDefault();
        touchEnd.x = e.touches[0].clientX;
        touchEnd.y = e.touches[0].clientY;
        if (!INPUT_ENABLED || !check()) return;

        let xDiff = touchEnd.x - touchStart.x;
        let yDiff = touchEnd.y - touchStart.y;
        if (xDiff**2 + yDiff**2 < swipeDistance**2) return;
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                shiftRight();
            } else {
                shiftLeft();
            }                       
        } else {
            if (yDiff > 0) {
                shiftDown();
            } else { 
                shiftUp();
            }                                                                 
        }

        spawnRandom();
        render();
        INPUT_ENABLED = false;
        setTimeout(() => {
            INPUT_ENABLED = true;
            touchStart.x = touchEnd.x
            touchStart.y = touchEnd.y
        }, TRANSITION_TIME + 10);
    }
}

function keyHandler(e) {
    if (!INPUT_ENABLED || !check()) return;
    if (e && e.keyCode > 36 && e.keyCode < 41) {
        switch (e.keyCode) { 
            case 37: 
                shiftLeft();
                break; 
            case 38: 
                shiftUp();
                break; 
            case 39: 
                shiftRight(); 
                break; 
            case 40: 
                shiftDown();
                break; 
        }
        spawnRandom();
        render();
        INPUT_ENABLED = false;
        setTimeout(() => {INPUT_ENABLED = true;}, TRANSITION_TIME + 10);
    }
}

function shiftRight() {
    // shift right and merge when hit matching block
    for (let i = 0; i < HEIGHT; i++) {
        let k = WIDTH-1;
        // cannot consider any block >= wall for merging
        let wall = WIDTH;
        for (let j = WIDTH-1; j >= 0; j--) {
            if (grid[i][j] !== null) {
                let temp = grid[i][j];
                grid[i][j] = null;
                if (k + 1 < wall && temp === grid[i][k+1]) {
                    grid[i][k+1] += temp;
                    wall = k + 1;
                    updates.push({type: "merge", from: {row: i, col: j}, to: {row: i, col: k}, target: {row: i, col: k+1}});
                } else {
                    grid[i][k] = temp;
                    updates.push({type: "move", from: {row: i, col: j}, to: {row: i, col: k}});
                    k--;
                }
            }
        }
    }
}

function shiftLeft() {
    // shift left and merge when hit matching block
    for (let i = 0; i < HEIGHT; i++) {
        let k = 0;
        // cannot consider any block <= wall for merging
        let wall = -1;
        for (let j = 0; j < WIDTH; j++) {
            if (grid[i][j] !== null) {
                let temp = grid[i][j];
                grid[i][j] = null;
                if (k - 1 > wall && temp === grid[i][k-1]) {
                    grid[i][k-1] += temp;
                    updates.push({type: "merge", from: {row: i, col: j}, to: {row: i, col: k}, target: {row: i, col: k-1}});
                    wall = k - 1;
                } else {
                    grid[i][k] = temp;
                    updates.push({type: "move", from: {row: i, col: j}, to: {row: i, col: k}});
                    k++;
                }
            }
        }
    }
}

function shiftUp() {
    // shift up and merge when hit matching block
    for (let j = 0; j < WIDTH; j++) {
        let k = 0;
        // cannot consider any block <= wall for merging
        let wall = -1;
        for (let i = 0; i < HEIGHT; i++) {
            if (grid[i][j] !== null) {
                let temp = grid[i][j];
                grid[i][j] = null;
                if (k - 1 > wall && temp === grid[k-1][j]) {
                    grid[k-1][j] += temp;
                    updates.push({type: "merge", from: {row: i, col: j}, to: {row: k, col: j}, target: {row: k-1, col: j}});
                    wall = k - 1;
                } else {
                    grid[k][j] = temp;
                    updates.push({type: "move", from: {row: i, col: j}, to: {row: k, col: j}});
                    k++;
                }
            }
        }
    }
}

function shiftDown() {
    // shift down and merge when hit matching block
    for (let j = 0; j < WIDTH; j++) {
        let k = HEIGHT-1;
        // cannot consider any block >= wall for merging
        let wall = HEIGHT;
        for (let i = HEIGHT-1; i >= 0; i--) {
            if (grid[i][j] !== null) {
                let temp = grid[i][j];
                grid[i][j] = null;
                if (k + 1 < wall && temp === grid[k+1][j]) {
                    grid[k+1][j] += temp;
                    updates.push({type: "merge", from: {row: i, col: j}, to: {row: k, col: j}, target: {row: k+1, col: j}});
                    wall = k + 1;
                } else {
                    grid[k][j] = temp;
                    updates.push({type: "move", from: {row: i, col: j}, to: {row: k, col: j}});
                    k--;
                }
            }
        }
    }
}

function spawnRandom() {
    let emptyCells = [];
    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++)
            if (grid[i][j] === null) emptyCells.push([i, j]);
    if (emptyCells.length === 0) return;

    let randNum = (getRandomInt(0,1) ? 2 : 4);
    let idx = emptyCells[getRandomInt(0, emptyCells.length-1)];
    grid[idx[0]][idx[1]] = randNum;
    updates.push({type: "new", num: randNum, to: {row: idx[0], col: idx[1]}});
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render() {
    for (let update of updates) {
        if (update.type === "move") {
            let tile = renderGrid.querySelector(`.tile-position-${update.from.row}-${update.from.col}`);
            setTilePos(tile, update.to.row, update.to.col);
        } else if (update.type === "merge") {
            let tile = renderGrid.querySelector(`.tile-position-${update.from.row}-${update.from.col}`);
            tile.style.zIndex = "0";
            setTilePos(tile, update.target.row, update.target.col);
            setTimeout(() => {
                tile.remove();
                let mergedTile = renderGrid.querySelector(`.tile-position-${update.target.row}-${update.target.col}`);
                let num = parseInt(mergedTile.innerHTML);
                mergedTile.innerHTML = (2 * num).toString();
                mergedTile.classList.remove(`tile-${num}`);
                mergedTile.classList.add(`tile-${2*num}`);
                mergedTile.classList.add("tile-merged");
                setTimeout(() => {mergedTile.classList.remove("tile-merged");}, MERGE_TIME);
            }, TRANSITION_TIME);
        } else if (update.type === "new") {
            let newTile = createTile(update.num, update.to.row, update.to.col);
            newTile.classList.add("tile-new");
            renderGrid.append(newTile);
            setTimeout(() => { newTile.classList.remove("tile-new");}, TRANSITION_TIME);
        }
    }
    updates = [];
}

function createTile(number, row, col) {
    let tile = document.createElement("div");
    tile.style.position = "absolute";
    tile.innerHTML = number.toString();
    tile.className = `tile tile-${number} tile-position-${row}-${col}`;

    let gridPos = renderGrid.getBoundingClientRect();
    let tilePos = tilePositions[row * WIDTH + col].getBoundingClientRect();
    tile.style.top = (tilePos.y - gridPos.y) + "px";
    tile.style.left = (tilePos.x - gridPos.x) + "px";
    tile.style.width = tilePos.width + "px";
    tile.style.height = tilePos.height + "px";
    return tile;
}

function setTilePos(tile, row, col) {
    let gridPos = renderGrid.getBoundingClientRect();
    let tilePos = tilePositions[row * WIDTH + col].getBoundingClientRect();
    tile.style.top = (tilePos.y - gridPos.y) + "px";
    tile.style.left = (tilePos.x - gridPos.x) + "px";
    tile.className = `tile tile-${tile.innerHTML} tile-position-${row}-${col}`;
}

function setTileSize(tile, row, col) {
    let tilePos = tilePositions[row * WIDTH + col].getBoundingClientRect();
    tile.style.width = tilePos.width + "px";
    tile.style.height = tilePos.height + "px";
}

function check() {
    let maxNum = 0;
    let canMove = false;
    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++) {
            if (grid[i][j] === null) {
                canMove = true;
                continue;
            }
            maxNum = Math.max(maxNum, grid[i][j]);
            if (i-1 >= 0 && grid[i-1][j] === grid[i][j]) canMove = true;
            if (i+1 < HEIGHT && grid[i+1][j] === grid[i][j]) canMove = true;
            if (j-1 >= 0 && grid[i][j-1] === grid[i][j]) canMove = true;
            if (j+1 < WIDTH && grid[i][j+1] === grid[i][j]) canMove = true;
        }
    
    if ((maxNum === MAX_NUM && !CONTINUE_ENABLED) || !canMove) {
        INPUT_ENABLED = false;
        gameScreen.classList.remove("hidden");
        setTimeout(() => {gameScreen.style.opacity = 1;}, 100);
        let text = document.querySelector(".game-screen > header");
        let button = document.querySelector(".game-screen > button");

        if (maxNum === MAX_NUM && !CONTINUE_ENABLED) {
            gameScreen.classList.add("won");
            text.innerHTML = "You win!";
            button.innerHTML = "Keep going";
            button.onclick = continueHandler;
        } else {
            text.innerHTML = "Game over!";
            button.innerHTML = "Try again";
            button.onclick = restartHandler;
        }

        return false;
    }

    return true;
}

function spawnSpecial() {
    for (let i = 0; i < HEIGHT; i++)
        for (let j = 0; j < WIDTH; j++) {
            grid[i][j] = 2**(i*WIDTH + j + 1);
            updates.push({type: "new", num: 2**(i*WIDTH + j + 1), to: {row: i, col: j}});
        }
}