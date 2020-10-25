let loginBox,txtUsername,txtPassword;
let btnSign, btnLogin;
let gameBox, lobby,userInfo,userDelete;
let statusMsg,msgBox; 
let user = { userName: "", passWord: "" ,wins:0};
let tiles = [];
let opponent, moves, lobbyLoop, gameLoop;
let alertBox;


function init() {
    //login 
    loginBox = document.getElementById("loginBox");
    txtUsername = document.getElementById("txtLogin");
    txtPassword = document.getElementById("txtSign");
    btnSign = document.getElementById('btnSign');
    btnLogin = document.getElementById('btnLogin');
    //waiting lobby
    lobby = document.getElementById("lobby");
    msgBox = document.getElementById("msgBox");
    userInfo = document.getElementById("chatBox");
    statusMsg = document.getElementById('statusMsg');
    userDelete = document.getElementById("userDelete");
    //game related
    gameBox = document.getElementById("gameBox");
    alertBox = new windowPop();
    txtUsername.focus();
}
//user authorization phase
function loginOrSignUp(action) { 

    if (txtUsername.value == "" || txtPassword.value == "") { //wont accept empty values
        statusMsg.innerHTML = "Either username or password were empty...";
        return;
    }
    user.userName = txtUsername.value;
    user.passWord = txtPassword.value;

    let toDelete = (action == "login") ? "&deletion=false" : "";

    sendHttpRequest("users/" + action + "?username=" + user.userName + "&password=" + user.passWord + toDelete,
        (status, response) =>
        {
            if (status == 200) {
                if (response != "") {
                    user = JSON.parse(response);
                    statusMsg.innerHTML = action == "login" ? "Welcome back " + user.userName : "Account registerd successfully!";
                    setTimeout(function () {
                        transitionScreens("lobby");
                        lobbyLoop = true;
                        getUserInfo();
                        getActiveUsers();
                    }, 1000);
                }
            } else {
                statusMsg.innerHTML = action == "login" ? "Username or Password are incorrect" : "The name " + user.userName + " is already in use..."
            }
        });
}

function getActiveUsers() { //main lobby 
    sendHttpRequest("users/online?whocalled="+user.userName, (status, response) => { //retrives online players and renders the lobby
        if (status == 200) {
            let activeUsers = JSON.parse(response);
            clearNodes(lobby);
            let h1 = document.createElement('h1');
            h1.innerHTML = "Online players:";
            lobby.appendChild(h1);

            for (let i = 0; i < activeUsers.length; i++) {
                let p = document.createElement('p');
                p.onclick = (ev) => { //i am directly challenging someone
                    if (ev.target.innerHTML == user.userName)
                        return;
                    opponent = ev.target.innerHTML;
                    sendHttpRequest("users/matchmake?player=" + user.userName + "&opponent=" + ev.target.innerHTML, (success, response) => {
                        if (success == 200) {
                            if (JSON.parse(response) == true) {
                                gameLoop = true;
                                lobbyLoop = false;
                                transitionScreens("game");
                            }
                        }
                    });
                };
                p.innerHTML = activeUsers[i];
                if (p.innerHTML == user.userName) {
                    p.style.color = "green";
                    p.canChallenge = false;
                }
                lobby.appendChild(p);
            }
        } else if (status == 202) { //i was challenged
            gameLoop = true;
            lobbyLoop = false;
            transitionScreens("game");
        }
    });
    if (lobbyLoop)
        setTimeout(getActiveUsers, 500);
    else { 
        renderGameBoard();
        refreshBoard();
    }
}


function getUserInfo() { //renders the user info 
    clearNodes(userInfo);
    userInfo.style.display = "block";
    let h2 = document.createElement("h2");
    h2.innerHTML = "Welcome " + user.userName + "!";
    let h2Wins = document.createElement("h2");
    sendHttpRequest("users/wins?username=" + user.userName, (success, response) => { //user wins
        if (success) {
            h2Wins.innerHTML = JSON.parse(response);
        }
    });
    let img = document.createElement("img");
    img.src = "images/trophy.png";
    img.style.float = "left";

    userInfo.appendChild(h2);
    userInfo.appendChild(img);
    userInfo.appendChild(h2Wins);

}
function renderGameBoard() {
    clearNodes(gameBox);
    let column = 0;
    let row = 0;
    for (let i = 0; i < 42; i++) { //creating an array with all the the game tiles for a standard game board (6 * 7)

        let temp = document.createElement('div');
        if (column > 6) { //assigning each tiles important proprties 
            column = 0;
            row++;
        }
        temp.column = column;
        temp.row = row;
        temp.id = "tile";
        temp.index = i;

        if (temp.index < 7) { //like the game in real life, we apply the game pieces from the top
            temp.onclick = (ev) => {
                sendHttpRequest("users/updateboard?caller=" + user.userName + "&row=" + temp.row + "&col=" + temp.column, () => {
                });
            };
        }
        column++;
        tiles.push(temp);
        gameBox.appendChild(temp);
    }
}

function refreshBoard() { //main game loop
    sendHttpRequest("users/getboard?caller=" + user.userName, (status, response) =>
    {
        let text;
        if (status) {
            if (response) {
                let matchDetails = JSON.parse(response); //we get the moves and the layout from the server
                for (let i = 0; i < matchDetails.length; i++) {
                    switch (matchDetails[i]) {
                        case 0:
                            tiles[i].style.backgroundColor = "yellow";
                            break;
                        case 1:
                            tiles[i].style.backgroundColor = "red";
                            break;
                    }
                }
            }
        }
        if (status != 200) { //if 200 there is no match conclusion so far
            gameLoop = false;
            switch (status) {
                case 201:
                    text = "Yellow wins!";
                    break;
                case 202:
                    text = "Red wins!";
                    break;
                case 203:
                    text = "Draw!";
                    break;
                default:
                    text = "Match is complete, please return to lobby";
            }
            
            alertBox.show(text, () => {
                sendHttpRequest("users/removematch?caller=" + user.userName, () =>
                {
                }); //removes match from server
                sendHttpRequest("users/backonline?caller=" + user.userName, (status, response) => { //once we click we are back to the lobby list
                    if (status == 200) {
                        clearBoard();
                        lockScreen(false);
                        lobbyLoop = true;
                        getUserInfo();
                        getActiveUsers();
                        transitionScreens("lobby");
                    }
                });
            }, () => {
                msgBox.style.display = "none"; //hides the message box so we can see the board
                setTimeout(() => {
                    msgBox.style.display = "block";
                }, 5000);
            });
        }
    });
    if (gameLoop == true)
        setTimeout(refreshBoard, 100);
}

function lockScreen(everyone) { //based on moves we lock the screen, if we pass true it locks for everyone
    if (everyone == true) {
        gameBox.style.pointerEvents = "none";
        return;
    } else {
        gameBox.style.pointerEvents = "auto";
    }
}


function popDeletionAccount() { //creates the user deletion window
    clearNodes(msgBox);
    alertBox.show("Please confirm account deletion by entering your password", (input, p) =>
    {
        if (input.value == "") {
            p.innerHTML = "Nothing was entered...";
            return;
        }
        sendHttpRequest("users/login?username=" + user.userName + "&password=" + input.value + "&deletion=true"
            , (success, response) =>
            {
                if (success) {
                    if (response != "") {
                        p.innerHTML = "sorry to see you go :(";
                        setTimeout(() => {
                            transitionScreens("login");
                        }, 1000);
                    } else {
                        p.innerHTML = "Wrong password...";
                    }
                } 
            });
    }, () =>
        {
            msgBox.style.display = "none";
    }, true);
}
function sendHttpRequest(url, whatToDo, body) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4) {
            whatToDo(httpRequest.status, httpRequest.responseText);
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

function clearNodes(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function btnLogAct() {
     loginOrSignUp("login");
}

function clearBoard() {
    clearNodes(gameBox);
    tiles = [];
    opponent = "";
}

function transitionScreens(where) {
    if (where == "game") {
        gameBox.style.display = "block";
        lobby.style.display = "none";
        userDelete.style.display = "none";
    }
    if (where == "lobby") {
        lobby.style.display = "block";
        userDelete.style.display = "block";
        loginBox.style.display = "none";
        msgBox.style.display = "none";
        gameBox.style.display = "none";
    }
    if (where == "login") {
        loginBox.style.display = "block";
        msgBox.style.display = "none";
        lobby.style.display = "none";
        userInfo.style.display = "none";
        userDelete.style.display = "none";
        txtUsername.value = "";
        txtPassword.value = "";
        statusMsg.innerHTML = "Welcome to Connect Four online!";
        txtUsername.focus();
    }
}

function btnSingUpAct() {
    loginOrSignUp("signup");
}

class windowPop {
    show(message,onOkClick,onCancelClick,input) { //we can create a pop up message box and customize it
        clearNodes(msgBox);
        msgBox.style.display = "block";
        let h1 = document.createElement("h1");
        h1.innerHTML = message;
        let button = document.createElement("button");
        button.id = "btnMsgBox";
        button.innerHTML = "OK";
        let userInput, p;

        if (input) { //if we want some input from the user
            userInput = document.createElement("input");
            userInput.type = "password";
            userInput.id = "inputMsgBox";
            msgBox.appendChild(userInput);
            p = document.createElement("p");
            p.id = "msgBoxStatus";
            msgBox.appendChild(p);
            userInput.focus();
            button.onclick = function () {
                onOkClick(userInput,p);
            }
        } else {
            button.onclick  = function () {
                onOkClick();
            }
        }
        
        let button2 = document.createElement("button");
        button2.innerHTML = "Cancel";
        button2.id = "btnMsgBoxCancel";
        button2.onclick = onCancelClick;
        msgBox.appendChild(h1);
        msgBox.appendChild(button);
        msgBox.appendChild(button2);
    }

}