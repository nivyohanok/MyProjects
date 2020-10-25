using System;
using System.Collections.Generic;
using System.Diagnostics.Tracing;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Con_Four
{
    public class GamesAndUsers
    {
        public List<Match> Games { get; set; }
        public Dictionary<string,User> ActiveUsers { get; set; }
        public HashSet<string> LobbyPlayers { get; set; }

        public GamesAndUsers()
        {
            ActiveUsers = new Dictionary<string, User>();
            LobbyPlayers = new HashSet<string>();
            Games = new List<Match>();
        }
        public void AddOnlineUser(User user)
        {
            ActiveUsers.Add(user.UserName, user);
            LobbyPlayers.Add(user.UserName);
        }
        public void AddMatch(Match newMatch)
        {
            Games.Add(newMatch);
            
        }
        public Match LocateGame(string caller) //based on who called we try to find the relevent match
        {
            for (int i = 0; i < Games.Count; i++)
            {
                if(Games[i].Challenger == caller || Games[i].Opponent == caller)
                {
                    return Games[i];
                }
            }
            return null; 
        }
        public void MatchSummary(string caller) //match conclusion
        {
            Match match = LocateGame(caller);
            if (match == null)
                return;

            string winner;
            if (match.Winner == 0)
                winner = match.Challenger;
            else if (match.Winner == 1)
                winner = match.Opponent;
            else
                winner = "";

            if(winner != "")
                DB.Modify("UPDATE UsersInfo SET Wins += 1 WHERE UserName = '" + winner + "'", null); //update wins
           
            ActiveUsers[match.Challenger].Playing = false;
            ActiveUsers[match.Opponent].Playing = false;

            Games.Remove(match);
            //match is complete, users are back to the online lobby and the winner's win count is updated
        }
    }
}
