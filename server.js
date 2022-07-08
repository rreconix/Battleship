const connectionId = Math.floor(Math.random() * 90000 + 10000);


let areas = document.getElementsByClassName("area");

const peer = new Peer(connectionId)
let connection

function send(data) {
    if (connection)
        connection.send(data);
}

let myTurn = true;
let otherShipsPlaced = false;
let myShipsPlaced = false;
let gameOver = false

const boardOptions = document.getElementById("board-options");
const turn = document.getElementById("turn");



let opponentGrid = [];

peer.on('connection', conn => {
    conn.on('data', data => {
        if(data.type == "color"){
            areas[data.index].children[0].classList.add("peer" + data.value)
        }
        else if(data.type == "turn"){
            document.getElementById("turn").textContent = "YOUR TURN";
            myTurn = !myTurn
        }
        else if(data.type == "winstate"){
            alert("YOU LOSE")
            gameOver = true
        }
        else if(data.type == "answer"){
            otherShipsPlaced = true
            opponentGrid = data.value
            console.log(opponentGrid)
        }
    })
    
    conn.on('open', () => {
        if(!connection){
            turn.textContent = "YOUR TURN"
            boardOptions.style.display = "flex"
            connection = peer.connect(conn.peer)
        }
    })

})


const boatLengths = [5, 4, 3, 3, 2];

function generateBoard(size){
    const parent = document.createElement("div")
    parent.id = "board-grid"

    for(let i = 0; i < size * size; i++){
        const childCell = document.createElement("div")
        const childChildCell = document.createElement("div")
        childChildCell.className = "small"
        childCell.className = "area"
        childCell.appendChild(childChildCell)
        parent.appendChild(childCell)
    }

    return parent
}

function notBordering(list, numOfShip){
}

function isValid(list, number){
    if(
        list.every(num => (num < 100 && num > -1)) &&
        list.every(num => !areas[num].classList.contains("ship")) &&
        (
            Math.floor(list[0] / 10) == Math.floor(list[list.length] / 10) ||
            list[0] % 10 == list[list.length-1] % 10
        )
    ){
        return true
    }
    else{
        return false
    }
}

function generateList(index, length){
    const items = [1,-1, 10, -10]
    const randomDirection = items[Math.floor(Math.random()*items.length)];
    let indexes = [index];
    
    for(let i = 1; i < length; i++){
        indexes.push(index + (i * randomDirection))
    }

    return indexes
}

function getIndexes(index, length, number){
    let counter = 0;
    let list;
    do {
        counter++
        if(counter >= 300){
            console.warn("Max call stack.")
            return "stop"
        }
        list = generateList(index, length);
    } while (!isValid(list, number));

    return list
}


const home_page = document.getElementById("home-page")
const game = document.getElementById("game")
const game_container = document.getElementById("game-container");

function randomIndex(){
    const num = Math.floor(Math.random() * 99);

    if(areas[num].classList.contains("ship")){
        return randomIndex()
    }
    else return num
}

function reloadGame(){
    console.log("Reloading...")
    togglePages()
    start()
    return
}

async function createBoats(){
    for(let i = 0; i < boatLengths.length; i++){
        const length = boatLengths[i];
        const index = randomIndex();
        const indexes = getIndexes(index, length, i);//array

        if(indexes == "stop"){
            reloadGame()
        }
        highlightIndexes(indexes, i)
    }
}

function highlightIndexes(indexes, number){

    for(const index of indexes){
        const square = areas[index];
        try{
            square.classList.add("ship", "ship-"+number)
        }
        catch{
            return
        }
    }

}



async function createBoard(){
    const size = 10
    const board = generateBoard(size)
    areas = board.children
    game_container.style.setProperty("--columns", size)
    
    
    game_container.innerHTML = ""
    game_container.appendChild(board)
    createBoats()
    document.getElementById("gameId").textContent = "ID: " + connectionId
}


function checkWin(){
    if(opponentGrid.length == 0){
        gameOver = true
        send({type: "winstate"})
        alert("YOU WIN")
    }
}

function checkHit(index){
    return new Promise(resolve => {
        if(opponentGrid.includes(index)){
            const indexAt = opponentGrid.indexOf(index);
            opponentGrid.splice(indexAt, 1);
    
            checkWin()
            resolve("Hit")
        }
        else{
            resolve("Miss")
        }
    })
}

function initGame(){
    [...areas].forEach((area, index) => {
        area.addEventListener("click", () => {
            if(myTurn && myShipsPlaced && otherShipsPlaced && !gameOver){
                if(
                    area.className == "area" ||
                    area.classList.contains("ship") ||
                    area.classList.contains("peerMiss") || 
                    area.classList.contains("peerHit")
                ){
                    myTurn = !myTurn
                    document.getElementById("turn").textContent = "";

                    checkHit(index).then(msg => {
                        const smallElement = area.children[0];
                        smallElement.classList.add("client" + msg)

                        send({type: "color", index: index, value: msg})
                    })

                    send({type: "turn"})
                }
            }
        })
    })
}

function togglePages(){
    game.classList.toggle("hidden")
    home_page.classList.toggle("hidden")

}

function start(){
    createBoard().then(initGame())
    togglePages()
}

async function setGame(){
    boardOptions.style.display = 'none';
    
    turn.style.display = 'block';
    
    let grid = [];
    [...areas].forEach((ele, index) => {
        if(ele.classList.contains("ship")){
            grid.push(index)
        }
    })
    myShipsPlaced = true
    send({ type: "answer", value: grid })
    
}

document.getElementById("return").addEventListener("click", start)
document.getElementById("reload").addEventListener("click", reloadGame)
document.getElementById("start").addEventListener("click", setGame)


document.getElementById("create-game").addEventListener("click", start)

document.getElementById("connectButton").addEventListener("click", () => {
    const id = document.getElementById("inputId").value
    if(id.length == 5){
        connect(id)
    }
})

function connect(id) {//html onclick
    connection = peer.connect(id);
    myTurn = false;
    boardOptions.style.display = "flex"
    start();
}
