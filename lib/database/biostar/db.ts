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

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 10000,
  requestTimeout: 30000,
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getBioStarDB() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}
