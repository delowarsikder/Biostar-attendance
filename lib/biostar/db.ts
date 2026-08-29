import sql from "mssql";

const config: sql.config = {
  server: process.env.BIOSTAR_DB_HOST!,
  port: Number(process.env.BIOSTAR_DB_PORT || 1433),
  database: process.env.BIOSTAR_DB_NAME!,
  user: process.env.BIOSTAR_DB_USER!,
  password: process.env.BIOSTAR_DB_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getBioStarDB() {
  if (pool?.connected) {
    return pool;
  }

  pool = await sql.connect(config);

  return pool;
}