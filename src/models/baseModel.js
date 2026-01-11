var pool = require('../config/dbConnection');
const QueryCondition = require("../Helper/utilsHelper");

class BaseModel {

    constructor(tableName) {
        this.table = tableName;
    }

    async select(table, where = {}) {
        try {
            const query = await this.buildQuery(table, where);
            console.log(query);
            const results = await pool.query(query);
            return results[0];
        } catch (error) {
            throw error;
        }
    }

    async buildQuery(table, where = {}) {
        try {
            var query = `select * from ${table} `;
            if (where && Object.keys(where).length > 0) {
                const conditions = [];
                for (const [key, value] of Object.entries(where)) {
                    conditions.push(new QueryCondition(key, '=', value));
                }
                const clauses = conditions.map(c => `${c.column} ${c.condition} '${c.value}'`).join(' and ');
                if (clauses && clauses != "") {
                    query += `where ${clauses}`;
                }
            }
            return query;
        } catch (error) {
            console.log(error);
        }
    }

    async buildConditions(where) {
        if (where && Object.keys(where).length > 0) {
            const conditions = [];
            const queryValues = [];
            for (const [key, value] of Object.entries(where)) {
                conditions.push(`\`${key}\` = ?`);
                queryValues.push(value);
            }
            return { clauses: conditions.join(' AND '), queryValues: queryValues };
        }
        return { clauses: '', queryValues: [] };
    }

    /** Use this for getting a single record */
    async find(table, where) {
        try {
            const results = await this.select(table, where);
            return results[0];
        } catch (error) {
            throw error;
        }
    }

    async exists(table, where) {
        try {
            const { clauses, queryValues } = await this.buildConditions(where);
            const query = clauses
                ? `select * from ${table} where ${clauses}`
                : `select * from ${table}`;
            console.log(query, queryValues);
            const [rows] = await pool.query(query, queryValues);
            if (rows.length) {
                return { exists: true, records: rows };
            }
            return { exists: false, records: null };
        } catch (error) {
            throw error;
        }
    }

    async update(tableOrId, values, idOverride) {
        try {
            // Support both update(id, values) (using this.table) and update(table, values, id)
            const tableName = idOverride !== undefined ? tableOrId : this.table;
            const id = idOverride !== undefined ? idOverride : tableOrId;
            const processedValues = {};
            for (const key in values) {
                if (Object.prototype.hasOwnProperty.call(values, key)) {
                    // Check if the value is an object or array and needs JSON stringification
                    if (typeof values[key] === 'object' && values[key] !== null) {
                        processedValues[key] = JSON.stringify(values[key]);
                    } else {
                        processedValues[key] = values[key];
                    }
                }
            }

            const setClauses = Object.keys(processedValues).map(key => `\`${key}\` = ?`).join(', ');
            const queryValues = Object.values(processedValues);
            queryValues.push(id); // Add id to the end for the WHERE clause

            const result = await pool.query(`UPDATE ${tableName} SET ${setClauses} WHERE id = ?`, queryValues);
            return result[0];
        } catch (error) {
            throw error;
        }
    }

    async updateRelation(table, oneIdName, oneId, manyIdName, manyIds) {

    }

    async updateOneToManyEntries(table, oneIdName, oneId, manyIdName, manyIds) {
        try {
            if (!manyIds || !Array.isArray(manyIds)) {
                manyIds = [manyIds];
            }

            //if new = 0, delete all existing
            if (!manyIds || manyIds.length == 0) {
                await pool.query(`delete from ${table} where ${oneIdName} = ${oneId}`);
                return;
            }
            //get existing entries
            const existingEntries = await pool.query(`select * from ${table} where ${oneIdName} = ${oneId}`);
            var existingIds = existingEntries[0].map((entry) => entry[manyIdName]);

            if (!existingIds || existingIds.length == 0) {
                await this.insertOneToMany(table, oneIdName, oneId, manyIdName, manyIds);
                return;
            }

            //delete from existing where id not in new
            const toBeRetained = manyIds.map(entry => `'${entry}'`).join(',');
            await pool.query(`delete from ${table} where ${oneIdName} = ${oneId} and ${manyIdName} not in (${toBeRetained})`);
            //insert new
            /*const inserts = manyIds.filter(function(id){
                if(!existingIds.includes(3)){
                    return id;
                }
            });*/
            const inserts = [];
            manyIds.forEach(element => {
                console.log(`Ele is: ${element}`);
                const s = existingIds.find(id => id == element);
                if (!s || s == null) {
                    inserts.push(element);
                }
                /*if(!existingIds.includes(element)){
                    altInserts.push(element);
                }*/
            });
            console.log("altInserts");
            console.log(inserts);
            await this.insertOneToMany(table, oneIdName, oneId, manyIdName, inserts);
            return;
        } catch (error) {
            console.log(error);
        }
    }

    async insert(table, values) {
        try {
            const result = await pool.query('INSERT INTO ' + table + ' SET ?', values);
            return result[0].insertId;
        } catch (error) {
            throw error;
        }
    }

    async insertOneToMany(table, oneIdName, oneId, manyIdName, manyIds) {
        if (!manyIds) {
            return null;
        }
        if (!Array.isArray(manyIds)) {
            manyIds = [manyIds];
        }
        var query = `insert into ${table} (${oneIdName},${manyIdName}) values `;
        query += manyIds.map(mid => `(${oneId},'${mid}')`).join(',');
        try {
            const result = await pool.query(query);
            return result[0];
        } catch (error) {
            throw error;
        }
    }

    async create(values) {
        try {
            return await this.insert(this.table, values);
        } catch (error) {
            throw error;
        }
    }

    async upsert(table, checkOnFields, values) {
        const { exists, records } = await this.exists(table, checkOnFields);
        if (exists) {
            console.log("record exists");
            console.log(records);
            console.log(`id is ${records[0].id}`);
            await this.update(table, values, records[0].id);
        } else {
            console.log("record does not exist");
            await this.insert(table, values);
        }
        return;
    }

    async delete(where) { // Removed 'table' as it's available via this.table
        try {
            const { clauses, queryValues } = await this.buildConditions(where);
            const query = `DELETE FROM ${this.table} WHERE ${clauses}`;
            await pool.query(query, queryValues);
            return;
        } catch (error) {
            throw error;
        }
    }

    async getById(id) {
        try {
            const result = await this.find(this.table, { id: id });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getMaxValueForColumn(table, column = "id") {
        try {
            const results = await pool.query(`select max(${column}) as maxval from ${table}`, [column, table]);
            return results[0].maxval;
        } catch (error) {
            throw error;
        }
    }

    async getNextValueForColumn(table, column = "id") {
        try {
            const maxval = this.getMaxValueForColumn(table, column);
            return maxval + 1;
        } catch (error) {
            throw error;
        }
    }

    async getAll() {
        try {
            return await this.select(this.table); // 'this.table' should be set in the constructor of the extending model
        } catch (error) {
            throw error;
        }
    }
}
module.exports = BaseModel;
