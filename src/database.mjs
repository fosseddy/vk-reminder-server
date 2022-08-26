import mysql from "mysql2/promise";
import assert from "assert";

let conn = null;

export async function init() {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export function connection() {
  assert(
    conn != null,
    "Connection is null. Use init() function to create connection."
  );

  return conn;
}

export class Model {
  constructor(table) {
    this.table = table;
  }

  async findBy(field, value) {
    const query = await conn.execute(
      `select * from ${this.table} where ${field} = ?`,
      [value]
    );

    return query[0];
  }

  async findInBy(field, inVals) {
    const placeholders = "".padStart(inVals.length * 2 - 1, "?,");

    const query = await conn.execute(
      `select * from ${this.table} where ${field} in (${placeholders})`,
      [...inVals]
    );

    return query[0];
  }

  async create(kvs) {
    let ks = [];
    let vs = [];
    let placeholders = [];

    for (const [k, v] of Object.entries(kvs)) {
      ks.push(k);
      vs.push(v);
      placeholders.push("?");
    }

    ks = ks.join(",");
    placeholders = placeholders.join(",");

    const query = await conn.execute(
      `insert into ${this.table} (${ks}) values (${placeholders})`,
      [...vs]
    );

    return query[0].insertId;
  }

  async updateBy(field, value, kvs) {
    let placeholders = [];
    let vs = [];

    for (const [k, v] of Object.entries(kvs)) {
      placeholders.push(`${k} = ?`);
      vs.push(v);
    }

    placeholders = placeholders.join(",");

    await conn.execute(
      `update ${this.table} set ${placeholders} where ${field} = ?`,
      [...vs, value]
    )
  }

  async deleteBy(field, value) {
    await conn.execute(
      `delete from ${this.table} where ${field} = ?`,
      [value]
    );
  }
}
