const connectionId = Math.floor(Math.random() * 900000 + 100000);


let grid_one;
let grid_two;

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
        if(data.type == "placeTile"){
            grid_one[data.index].children[0].classList.add(data.value)
        }
        else if(data.type == "turn"){
            turn.textContent = "YOUR TURN";
            myTurn = !myTurn
        }
        else if(data.type == "winstate"){
            alert("YOU LOSE")
            gameOver = true
        }
        else if(data.type == "grid"){
            otherShipsPlaced = true
            opponentGrid = data.value
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




// function isValid(list, number){
//     if(
//         list.every(num => (num < 100 && num > -1)) &&
//         list.every(num => !areas[num].classList.contains("ship")) &&
//         (
//             Math.floor(list[0] / 10) == Math.floor(list[list.length] / 10) ||
//             list[0] % 10 == list[list.length-1] % 10
//         )
//     ){
//         return true
//     }
//     else{
//         return false
//     }
// }

// function generateList(index, length){
//     const items = [1,-1, 10, -10]
//     const randomDirection = items[Math.floor(Math.random()*items.length)];
//     let indexes = [index];
    
//     for(let i = 1; i < length; i++){
//         indexes.push(index + (i * randomDirection))
//     }

//     return indexes
// }

// function getIndexes(index, length, number){
//     let counter = 0;
//     let list;
//     do {
//         counter++
//         if(counter >= 300){
//             console.warn("Max call stack.")
//             return "stop"
//         }
//         list = generateList(index, length);
//     } while (!isValid(list, number));

//     return list
// }


const home_page = document.getElementById("home-page")
const game = document.getElementById("game")
const game_container = document.getElementById("game-container");

// function randomIndex(){
//     const num = Math.floor(Math.random() * 99);

//     if(areas[num].classList.contains("ship")){
//         return randomIndex()
//     }
//     else return num
// }



// async function createBoats(){
//     for(let i = 0; i < boatLengths.length; i++){
//         const length = boatLengths[i];
//         const index = randomIndex();
//         const indexes = getIndexes(index, length, i);//array

//         if(indexes == "stop"){
//             reloadGame()
//         }
//         highlightIndexes(indexes, i)
//     }
// }

// function highlightIndexes(indexes, number){

//     for(const index of indexes){
//         const square = areas[index];
//         try{
//             square.classList.add("ship", "ship-"+number)
//         }
//         catch{
//             return
//         }
//     }

// }

function generateBoard(size){
    const parent = document.createElement("div")
    parent.className = "board-grid"

    for(let i = 0; i < size * size; i++){
        const childCell = document.createElement("div")
        childCell.className = "area"

        const childChildCell = document.createElement("div")
        childChildCell.className = "small"

        childCell.appendChild(childChildCell)
        parent.appendChild(childCell)
    }

    return parent
}

function createShips(){
    const ship_container = document.createElement("div");
    ship_container.id = "ship_container";

    for(const length of boatLengths){
        const ship = document.createElement("div");
        ship.textContent = length;
        ship.className = "ship";

        ship_container.appendChild(ship)
    }

    return ship_container
}

async function createBoard(){

    const size = 10
    const board = generateBoard(size)

    const ship_dock = createShips()

    game_container.style.setProperty("--columns", size)
    
    game_container.innerHTML = ""
    game_container.append(ship_dock)
    game_container.appendChild(board)
    game_container.appendChild(board.cloneNode(true))
    
    grid_one = board.children
    grid_two = document.getElementsByClassName("board-grid")[1].children

    //createBoats()
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
            resolve("hit")
        }
        else{
            resolve("miss")
        }

    })
}

let currentShip;
let currentShipNumber;

function highlightNodes(nodelist, number){
    [...grid_one].filter(item => item.classList.contains("ship-" + number)).forEach(item => item.classList.remove("ship-" +number))

    nodelist.forEach(item => item.classList.add("ship-" + number))
}

function checkList(nodelist){
    return(
        nodelist.every(num => (num > -1 && num < 100)) &&
        (
            nodelist.every(num => Math.floor(nodelist[0] / 10) == Math.floor(num / 10)) || 
            nodelist.every(num => Math.floor(nodelist[0] % 10) == Math.floor(num % 10))
        )
    )
}

let currentPosition = 0

function move(direction){//get the new node items
    const indexes = currentShip.map(item => indexOfNode(grid_one, item))//converts the ship to indexes
    const newIndexes = indexes.map(num => num += direction) //changes the indexes to match new location
    console.log(newIndexes)
    const nodeList = newIndexes.map(num => grid_one[num])//converts back into node elements

    if(checkList(newIndexes)){
        currentShip = nodeList
        currentPosition = newIndexes[0];
        highlightNodes(currentShip, currentShipNumber);
    }
    return
}

let rotations = [10, -1, -10, 1]
let rotation = 10;

function rotateShip(){
    let indexRotation = rotations.indexOf(rotation);
    if(indexRotation == rotations.length -1) indexRotation = -1 

    let newIndexes = [];

    for(let i = 0; i < currentShip.length; i++){
        newIndexes.push(currentPosition + (i * rotation))
    } 

    const nodeList = newIndexes.map(num => grid_one[num])
    
    if(checkList(newIndexes)){
        rotation = rotations[indexRotation + 1]
        
        currentShip = nodeList
        highlightNodes(currentShip, currentShipNumber)
    }
    return
} 

function indexOfNode(parent, node){
    return [...parent].indexOf(node);
}


function shipWithIndex(index){
    return [...grid_one].some(item => item.classList.contains("ship-" + index))
}

function initGame(){

    togglePages();

    [...grid_two].forEach((area, index) => {
        area.addEventListener("click", () => {
            if(myTurn && myShipsPlaced && otherShipsPlaced && !gameOver){
                myTurn = !myTurn
                turn.textContent = "";
                send({type: "turn"})

                checkHit(index).then(msg => {
                    const smallElement = area.children[0];
                    smallElement.classList.add(msg)

                    send({type: "placeTile", index: index, value: msg})
                })
            }
        })
    })

    const ships = [...document.getElementsByClassName("ship")];

    

    ships.forEach((ship, index) => {
        ship.addEventListener("click", () => {
            currentShipNumber = index;
            if(!shipWithIndex(currentShipNumber)){
                currentShip = [...grid_one].slice(0, ship.textContent)//creates the ship if there isnt one on the board
            }
            else{
                currentShip = [...document.getElementsByClassName("ship-" + currentShipNumber)]//if there is an existing ship it finds it
            }
            highlightNodes(currentShip, currentShipNumber)
        })
    })    

    const directions = [-1, -10, +1, +10];

    document.addEventListener("keyup", e => {
        if(currentShip){
            
            if(e.key.startsWith("Arrow")){
                const direction = directions[e.keyCode - 37]
                move(direction)
            }
            else if(e.key.toLowerCase() == "r"){
                rotateShip()
            }
        }
    })
}

function togglePages(){
    game.classList.toggle("hidden")
    home_page.classList.toggle("hidden")
}

async function start(){
    await createBoard()
    initGame()
}

function setGame(){
    const ships = [...grid_one].filter(el => JSON.stringify(el.classList).includes("ship-"))

    if(ships.length === boatLengths.reduce((a, b) => a + b, 0)){
        boardOptions.style.display = 'none';
        turn.style.display = 'block';
        
        let grid = ships.map(el => indexOfNode(grid_one, el))
        
        document.getElementById("ship_container").style.display = "none"

        myShipsPlaced = true
        send({ type: "grid", value: grid })
    }
    else{
        alert("Ship(s) placed incorrectly")
    }
       
}

function reloadGame(){
    console.log("Reloading...")
    start()
    return
}

document.getElementById("return").addEventListener("click", start)
document.getElementById("start").addEventListener("click", setGame)
document.getElementById("create-game").addEventListener("click", start)




const inputId = document.getElementById("inputId");
document.getElementById("connectButton").addEventListener("click", () => {
    const id = inputId.value
    if(id.length == inputId.max){
        connect(id)
    }
})

function connect(id) {//html onclick
    connection = peer.connect(id);
    myTurn = false;
    boardOptions.style.display = "flex"
    start();
}
