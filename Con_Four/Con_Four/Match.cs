using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Con_Four
{
    public class Match //all of the match details are stored in this class
    {
        public string Challenger { get; set; }
        public string Opponent { get; set; }
        public int[,] Board { get; set; }
        public int[] LayOut { get; set; }
        public int Winner { get; set; }
        public int Moves { get; set; }

        private readonly int ROWS = 6, COLS = 7;

        public Match(string player1,string player2)
        {
            Challenger = player1;
            Opponent = player2;
            Winner = -1;
            Board = new int[ROWS, COLS];
            LayOut = new int[ROWS * COLS];
            ResetBoards();

        }
        private void ResetBoards()
        {
            for (int i = 0; i < Board.GetLength(0); i++)
            {
                for (int j = 0; j < Board.GetLength(1); j++)
                {
                    Board[i, j] = -1;
                }
            }
            for (int i = 0; i < LayOut.Length; i++)
            {
                LayOut[i] = -1;
            }
        }
        public int FindIndex(int row,int col) //gets the index to a 1d array that represents a 2d array
        {
            return COLS * (row) + col;
        }
        public int WhosPlaying() //based on moves we determine whos playing
        {
            return Moves % 2;
        }
        public void UpdateBoards(int row,int col,int value) //updates the the 2d array used for logic calculation
        {                                                  //and also the 1d array used to return to the server
            Board[row, col] = value;
            int index = FindIndex(row, col);
            LayOut[index] = value;
        }
        public int AddMove(int row,int col) //we find an available space to populate in a descending order
        {
            if (Board[row, col] != -1) //if the clicked space is populated we return; 
                return -1;

            int whichValue = WhosPlaying();

            if(Board[row + 5,col] == -1) //if the bottom of the column is free we populate it
            {
                UpdateBoards(row + 5, col, whichValue);
                Moves++;
                if (Moves > 5)
                    Winner = CheckWInner(Board);

                return Winner;
            }
            while(Board[row,col] == -1) //check below for a free space
                row++;

            UpdateBoards(row - 1, col, whichValue);
            Moves++;
            Winner = CheckWInner(Board);
            return Winner;
        }
        public int CheckWInner(int[,] board) 
        {
            if (Moves == 42)
                return 2; //draw
            for (int i = 0; i < ROWS; i++)
            {
                for (int j = 0; j < COLS; j++)
                {
                    int currentPlayer = board[i,j];

                    if (currentPlayer == -1) //if it's empty theres no point to check
                        continue;

                    if (j + 3 < COLS //if there is enough space for a combination check to the right
                        && currentPlayer == board[i,j + 1]
                        && currentPlayer == board[i,j + 2]
                        && currentPlayer == board[i,j + 3]
                    ) return currentPlayer;
                    if (i + 3 >= ROWS)
                    {  // checking up
                        if (currentPlayer == board[i - 1,j] &&
                            currentPlayer == board[i - 2,j] &&
                            currentPlayer == board[i - 3,j]
                        ) return currentPlayer;
                        if (j + 3 < COLS //check upper right
                            && currentPlayer == board[i - 1,j + 1]
                            && currentPlayer == board[i - 2,j + 2]
                            && currentPlayer == board[i - 3,j + 3]
                        ) return currentPlayer;
                        if (j + 3 >= COLS - 1 //check upper left
                            && currentPlayer == board[i - 1,j - 1]
                            && currentPlayer == board[i - 2,j - 2]
                            && currentPlayer == board[i - 3,j - 3]
                        ) return currentPlayer;
                    }
                }
            }
            return -1;
        }
       
    }
}
