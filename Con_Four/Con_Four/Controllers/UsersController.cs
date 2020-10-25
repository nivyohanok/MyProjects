using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Con_Four.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        public static GamesAndUsers Users = new GamesAndUsers();
        private readonly object _lockObject = new object();

        [HttpGet("login")]
        public User Login(string username,string password,bool deletion) //retrives user data from the database
        {
            User myUser = null; 
            DB.PullData<User>("SELECT UserName,PassWord,Wins FROM UsersInfo" +
                " WHERE UserName='"+username+"';",
                (dr) => myUser = new User
                {
                    UserName = dr.GetString(0),
                    Password = dr.GetString(1),
                    Wins = dr.GetInt32(2)
                });
            if (myUser == null) //if null it means the user does not exist
                return null; 

            if(myUser.Password == password) 
            {
                if (deletion) //if it's true it means the user got here to delete his account
                {
                    Users.ActiveUsers.Remove(username);
                    Users.LobbyPlayers.Remove(username);
                    DB.Modify("DELETE FROM UsersInfo WHERE UserName = '" + username + "'",null);
                    return myUser;
                }
                if (!Users.ActiveUsers.ContainsKey(myUser.UserName))
                    Users.AddOnlineUser(myUser); 

                return myUser;
            }
            return null; 
            
        }
        [HttpGet("signup")]
        public User SignUp(string username,string password) //create a new user and update the database
        {
            if (!CheckIfAvailable(username))
                return null;
            User user = new User(username, password);
            Users.AddOnlineUser(user);

            DB.Modify("INSERT INTO UsersInfo (UserName, PassWord, Wins) VALUES (@UserName, @PassWord , @Wins)",
                (cmd) =>
                {
                    cmd.Parameters.AddWithValue("@UserName", user.UserName);
                    cmd.Parameters.AddWithValue("@PassWord", user.Password);
                    cmd.Parameters.AddWithValue("@Wins", 0);
                });
            return user;
        }

        [HttpGet("online")]
        public HashSet<string> GetOnlineUsers(string whoCalled)
        {
            lock (_lockObject)
            {
                if (Users.ActiveUsers.ContainsKey(whoCalled))
                {
                    if(Users.ActiveUsers[whoCalled].Playing == true)
                    {
                        Response.StatusCode = 202; //tells the client that this user was challenged 
                        return null;
                    }
                }

            }
            return Users.LobbyPlayers;
        }
        [HttpGet("matchmake")]
        public bool MatchMakePlayers(string player,string opponent) //pairs two players to play
        {
            lock (_lockObject)
            {
                Match newMatch = new Match(player, opponent);

                Users.ActiveUsers[player].Playing = true;
                Users.ActiveUsers[opponent].Playing = true;

                Users.LobbyPlayers.Remove(player);
                Users.LobbyPlayers.Remove(opponent);

                Users.AddMatch(newMatch);
            }
            return true;
        }


        [HttpGet("removematch")]
        public void RemoveMatch(string caller)
        {
            Users.MatchSummary(caller);
        }
        [HttpGet("backonline")]
        public void AddBack(string caller)
        {
            Users.LobbyPlayers.Add(caller);
        }
        [HttpGet("updateboard")]
        public int UpdateBoard(string caller,int row,int col) //updates the moves layout in a given match
        {
            int sendBack = -1;
            lock (_lockObject)
            {
                Match match = Users.LocateGame(caller);
                if (match == null)
                    return sendBack;
                if (match.WhosPlaying() == 0 && caller == match.Challenger)
                    sendBack = match.AddMove(row, col);
                else if (match.WhosPlaying() == 1 && caller == match.Opponent)
                    sendBack = match.AddMove(row, col);
            }
            return sendBack;
        }

        [HttpGet("getboard")]
        public int[] GetMatchDetails(string caller) //returns the game details of a given match
        {
            
            lock (_lockObject)
            {
                Match match = Users.LocateGame(caller);
                if (match == null)
                    return null;
                switch (match.Winner)
                {
                    case 0: //challenger won
                        Response.StatusCode = 201;
                        break;
                    case 1://opponent won
                        Response.StatusCode = 202;
                        break;
                    case 2: //draw
                        Response.StatusCode = 203;
                        break;
                }
                return match.LayOut;
            }
        }
        [HttpGet("wins")]
        public int GetWins(string username)
        {
            User myUser = null;
            DB.PullData<User>("SELECT Wins FROM UsersInfo" + //return wins
               " WHERE UserName='" + username + "';",
               (dr) => myUser = new User
               {
                   Wins = dr.GetInt32(0)
               });
            return myUser.Wins;
        }
        public bool CheckIfAvailable(string username)
        {
            User myUser = null;
            DB.PullData<User>("SELECT UserName,PassWord FROM UsersInfo" +
                " WHERE UserName='" + username + "';",
                (dr) => myUser = new User
                {
                    UserName = dr.GetString(0),
                    Password = dr.GetString(1)
                });
            if (myUser == null) //if null the username is available.
                return true;
            return false;
        }
        
    }
}
