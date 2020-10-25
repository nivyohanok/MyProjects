let loginBox,txtUsername,txtPassword;
let btnSign, btnLogin;
let gameBox, lobby,chatBox;
let body,p;
let statusMsg,msgBox; 
let user = { userName: "", passWord: "" };
let tiles = [],activeUsers = [],activeMatches =[];
let currentPlayer, opponent, moves, waitingList, gameLoop, matchID, currentMoveList, matrixArr;
let inMatch = false;
const ROWS = 6, COLS = 7,EMPTY_POG = 0;

function init() {
    loginBox = document.getElementById("loginBox");
    msgBox = document.getElementById("msgBox");
    body = document.body;
    lobby = document.getElementById("lobby");
    gameBox = document.getElementById("gameBox");
    txtUsername = document.getElementById("txtLogin");
    txtPassword = document.getElementById("txtSign");
    chatBox = document.getElementById("chatBox");
    btnSign = document.getElementById('btnSign');
    btnLogin = document.getElementById('btnLogin');
    statusMsg = document.getElementById('statusMsg');
}

function LoginOrSignUp(action) {

    if (txtUsername.value == "" || txtPassword.value == "") {
        statusMsg.innerHTML = "Either username or password were empty...";
        return;
    }
    user.userName = txtUsername.value;
    user.passWord = txtPassword.value;
    waitingList = true;

    if (action == "signup") { 
        sendHttpRequest("users/signup", (success, response) => {
            if (success) {
                if (JSON.parse(response) == false)
                {
                    statusMsg.innerHTML = "Username already taken..."
                } else {
                    statusMsg.innerHTML = "Username registerd successfully!"
                    setTimeout(function () {
                        loginBox.style.display = "none";
                        lobby.style.display = "block";
                        getActiveUsers();
                    }, 1000);

                }
            }
        }, user);
    }
    if (action == "login") { 
        sendHttpRequest("users/login?username=" + user.userName + "&password=" + user.passWord, (success, response) => {
            if (JSON.parse(response) == true) {
                statusMsg.innerHTML = "Welcome " + user.userName + " loading...";
                setTimeout(function () {
                    loginBox.style.display = "none";
                    lobby.style.display = "block";
                    getActiveUsers();
                }, 1000);

            }
            else {
                statusMsg.innerHTML = "Username or Password are incorrect";
            }
        });
    }
}

function getActiveUsers() {
    console.log("lobby loop");
    
    sendHttpRequest("users/online", (success, response) => { //retrives online players
        if (success) {
            activeUsers = JSON.parse(response);
            clearNodes(lobby);
            let h1 = document.createElement('h1');
            h1.innerHTML = "Online players:";
            lobby.appendChild(h1);
            for (let i = 0; i < activeUsers.length; i++) {
                let p = document.createElement('p');
                p.onclick = challengePlayer;
                p.innerHTML = activeUsers[i];
                lobby.appendChild(p);
            }
        }
    });
    sendHttpRequest("users/games", (success, response) => { //retrives matched players 
        if (success) {
            activeMatches = JSON.parse(response);
            console.log(activeMatches);
        }
    });
    if (activeMatches)
    {
        for (let i = 0; i < activeMatches.length; i++) { //Matchmakes players, if someone refreshes it will return them to the match.
            if (user.userName == activeMatches[i].challenger) {
                opponent = activeMatches[i].opponent;
                inMatch = true;
            }
            if (user.userName == activeMatches[i].opponent) {
                opponent = activeMatches[i].challenger;
                inMatch = true;
            }
            if (inMatch) {
                clearNodes(chatBox);
                waitingList = false;
                gameLoop = true;
                matchID = activeMatches[i].matchID;
                gameBox.style.display = "block";
                chatBox.style.display = "block";
                lobby.style.display = "none";
                let h2v1 = document.createElement("h2");
                h2v1.innerHTML = "Playing Against: ";
                let h2v2 = document.createElement("h2");
                h2v2.innerHTML = opponent;
                chatBox.appendChild(h2v1);
                chatBox.appendChild(h2v2);
                challengePlayer(undefined, true, opponent);
                renderGameBoard();
                inititateMatch();
            }
        }
    }
    if (waitingList)
        setTimeout(getActiveUsers, 500);
}

function challengePlayer(ev,existingMatch, against) {
    let opponent; 
    if (!ev) {
        opponent = against;
    } else {
        opponent = ev.target.innerHTML;
        if (ev.target.innerHTML == user.userName) //cannot challenge myself
            return;
    }
    
    if (!existingMatch)
        existingMatch = false;

    sendHttpRequest("users/matchmake?player=" + user.userName
        + "&opponent=" + opponent
        + "&existingMatch=" + existingMatch,
        (success, response) => {
            if (success) {
                if (JSON.parse(response)) {
                    console.log("Matched!");
                }
            }
        });
}


function inititateMatch() {
    console.log("gameloop");
    if (gameLoop) {
        sendHttpRequest("users/getboard?gameIndex=" + matchID, (success, response) => {
            if (success) {

                let matchDetails = JSON.parse(response);
                currentMoveList = matchDetails.moveslayOut;
                moves = matchDetails.moves;
                
                if (moves % 2 == Number(currentPlayer)) { //updates whos turn it is
                    gameBox.style.pointerEvents = "none";
                } else {
                    gameBox.style.pointerEvents = "auto";
                }
                refreshBoard();
            }
        });
        if (moves > 5) {
            let winner = checkWinner();
            if (winner > 0) {
                gameLoop = false;
                winner = winner == 2 ? activeMatches[matchID].challenger : activeMatches[matchID].opponent;
                console.log("winner is " + winner);
                clearNodes(msgBox);
                let h1 = document.createElement("h1");
                h1.innerHTML = winner + " is the winner!";
                let button = document.createElement("button");
                button.id = "btnMsgBox";
                button.innerHTML = "OK";
                button.onclick = closeBox;
                msgBox.appendChild(button);
                msgBox.appendChild(h1);
                sendHttpRequest("users/removematch?index=" + matchID
                    + "&player1=" + activeMatches[matchID].challenger
                    + "&player2=" + activeMatches[matchID].opponent,
                    () => { });
                msgBox.style.display = "block";

            }
        }

        setTimeout(inititateMatch, 100);
    }
    
}
function checkWinner() {
    
    for (let i = 0; i < ROWS; i++) {

        for (let j = 0; j < COLS; j++) {
            let currentPlayer = matrixArr[i][j].player;

            if (currentPlayer == EMPTY_POG) {
                continue;
            }

            if (j + 3 < COLS //if there is enough space for a combination check to the right
                && currentPlayer == matrixArr[i][j + 1].player
                && currentPlayer == matrixArr[i][j + 2].player
                && currentPlayer == matrixArr[i][j + 3].player
            ) return currentPlayer;
            if (i + 3 >= ROWS) {  // up
                if (currentPlayer == matrixArr[i - 1][j].player &&
                    currentPlayer == matrixArr[i - 2][j].player &&
                    currentPlayer == matrixArr[i - 3][j].player
                ) return currentPlayer;
                if (j + 3 < COLS //upper right
                    && currentPlayer == matrixArr[i - 1][j + 1].player
                    && currentPlayer == matrixArr[i - 2][j + 2].player
                    && currentPlayer == matrixArr[i - 3][j + 3].player
                ) return currentPlayer; 
                if (j + 3 >= COLS - 1
                    && currentPlayer == matrixArr[i - 1][j - 1].player
                    && currentPlayer == matrixArr[i - 2][j - 2].player
                    && currentPlayer == matrixArr[i - 3][j - 3].player
                ) return currentPlayer;
            }
        }
    }
    return EMPTY_POG;
}

function renderGameBoard() {

    clearNodes(gameBox);
    currentPlayer = (user.userName == activeMatches[matchID].opponent) ? false : true;
    moves = 0;
    let column = 0;
    let row = 0;
    for (let i = 0; i < 42; i++) { //need to convert this to a 2d array
        
        let temp = document.createElement('div');
        if (column > 6) {
            column = 0;
            row++;
        }
        temp.column = column;
        temp.row = row;
        temp.id = "tile";
        temp.index = i;
        temp.hasPog = false;
        temp.player = 0; // 0

        if (temp.index < 7) {
            temp.onclick = tileClicked;
        }

        column++;
        tiles.push(temp);
        gameBox.appendChild(temp);
    }
    matrixArr = convertToMatrix(tiles, ROWS, COLS); //changes it to 2d array
    //console.log(matrixArr);
}

function refreshBoard() {
    if (!currentMoveList)
        return;
    let row = 0
    let colm = 0;
    for (let i = 0; i < currentMoveList.length; i++) {
        if (colm > 6) {
            colm = 0;
            row++;
        }
        switch (currentMoveList[i]) {
            case 1:
                matrixArr[row][colm].style.backgroundColor = "red";
                matrixArr[row][colm].hasPog = true;
                matrixArr[row][colm].player = 1;

                break;
            case 2:
                matrixArr[row][colm].style.backgroundColor = "yellow";
                matrixArr[row][colm].hasPog = true;
                matrixArr[row][colm].player = 2;
                break;
        }

        colm++;
    }

}

function tileClicked(ev) {
    gameBox.style.pointerEvents = "none"; //prevents spam clicking 
    
    if (ev.target.id == "tile") {
        let trgtRow = ev.target.row;
        let trgtColm = ev.target.column;

        if (matrixArr[trgtRow][trgtColm].hasPog == true) //prevents top pogs to change
            return;

        if (matrixArr[trgtRow + 5][trgtColm].hasPog == false) { //quickly add pogs to the last row
            updateBoard(matrixArr[trgtRow + 5][trgtColm], currentPlayer);
            return;
        }
        while (matrixArr[trgtRow][trgtColm].hasPog == false) {
            trgtRow++;
        }
        updateBoard(matrixArr[trgtRow - 1][trgtColm], currentPlayer);
        
    } 
}

function updateBoard(tile, currentPlayer) {
    tile.player = currentPlayer ? 2 : 1;
    //tile.hasPog = true;
    console.log(tile.index);
    sendHttpRequest("users/updateboard?gameIndex=" + matchID + "&boardIndex=" + tile.index + "&value=" + tile.player, (success, response) => {
        if (success) {
            console.log("updated move" + tile.player);
        }
    });
    
}


function convertToMatrix(arr,n,m) {
    let result = [];
    for (let i = 0; i < n; i++) {
        result[i] = arr.splice(0, m);
    }
    return result;
}


function sendHttpRequest(url,whatToDo,body) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4) {
            whatToDo(httpRequest.status == 200, httpRequest.responseText);
        }
    };
    if (body) {
        httpRequest.open("POST", url, true);
        httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        httpRequest.send(JSON.stringify(body));
    } else {
    httpRequest.open('GET', url, true);
    httpRequest.send();
    }
}

function changeLight() {
    body.classList.toggle("light-mode");
    txtUsername.classList.toggle("light-mode");
    txtPassword.classList.toggle("light-mode");
    btnSign.classList.toggle("light-mode");
    btnLogin.classList.toggle("light-mode");
    statusMsg.classList.toggle("light-mode"); 
}


function clearNodes(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function btnLogAct() {
    LoginOrSignUp("login");
}
function btnSingUpAct() {
    LoginOrSignUp("signup");
}


function closeBox() {
    gameLoop = false;
    msgBox.style.display = "none";
    chatBox.style.display = "none";
    gameBox.style.display = "none";
    lobby.style.display = "block";
    sendHttpRequest("users/games", (success, response) => { //retrives matched players 
        if (success) {
            activeMatches = JSON.parse(response);
            console.log(activeMatches);
            waitingList = true;
            getActiveUsers();
        }
    });
    
    
}