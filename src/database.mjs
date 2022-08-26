import mysql from "mysql2/promise";
import assert from "assert";

let conn = null;

export async function init() {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  });
}

export function connection() {
  assert(conn != null, "There is no connection. Use init() function.");
  return conn;
}

export class Model {
  constructor(table) {
    this.table = table;
    this.db = connection();
  }

  async findAll() {
    const query = await this.db.execute(`select * from ${this.table}`);
    return query[0];
  }

  async findBy(field, value) {
    const query = await this.db.execute(
      `select * from ${this.table} where ${field} = ?`,
      [value]
    );

    return query[0];
  }

  async findInBy(field, inVals) {
    const placeholders = "".padStart(inVals.length * 2 - 1, "?,");

    const query = await this.db.execute(
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

    const query = await this.db.execute(
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

    await this.db.execute(
      `update ${this.table} set ${placeholders} where ${field} = ?`,
      [...vs, value]
    )
  }

  async updateInBy(field, inVals, kvs) {
    let placeholders = [];
    let vs = [];

    for (const [k, v] of Object.entries(kvs)) {
      placeholders.push(`${k} = ?`);
      vs.push(v);
    }

    placeholders = placeholders.join(",");
    const inPlaceholders = "".padStart(inVals.length * 2 - 1, "?,");

    await this.db.execute(
      `update ${this.table} set ${placeholders} ` +
      `where ${field} in (${inPlaceholders})`,
      [...vs, ...inVals]
    );
  }

  async deleteBy(field, value) {
    await this.db.execute(
      `delete from ${this.table} where ${field} = ?`,
      [value]
    );
  }

  async deleteInBy(field, inVals) {
    const placeholders = "".padStart(inVals.length * 2 - 1, "?,");
    await this.db.execute(
      `delete from ${this.table} where ${field} in (${placeholders})`,
      [...inVals]
    );
  }
}
