using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Con_Four
{
    public class User
    {
        public string UserName { get; set; }
        public string Password { get; set; }
        public int Wins { get; set; }
        public bool Playing { get; set; }
        public User()
        {
            Playing = false;
        }
        public User(string username,string password)
        {
            UserName = username;
            Password = password;
            Playing = false;
        }
    }
}
