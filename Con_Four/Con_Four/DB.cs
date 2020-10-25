using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data.SqlClient;

namespace Con_Four
{
    public class DB
    {
        public static string ConnString { get; set; }

        public static T PullData<T>(string sql, Func<SqlDataReader, T> processRecord, Action<SqlCommand> setParameters = null)
        {
            T list = default(T);
            using (SqlConnection conn = new SqlConnection(ConnString))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (setParameters != null)
                        setParameters(cmd);
                    using (SqlDataReader dr = cmd.ExecuteReader())
                    {
                        while (dr.Read())
                            list = processRecord(dr);
                    }
                }
            }

            return list;
        }


        public static int Modify(string sql, Action<SqlCommand> setParameters)
        {
            int rowsAffected = 0;
            using (SqlConnection conn = new SqlConnection(ConnString))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (setParameters != null)
                    {
                        setParameters(cmd);
                    }
                    rowsAffected = cmd.ExecuteNonQuery();
                }
            }
            return rowsAffected;
        }
    }
}
