/**
 * Database Schema and Row Count Comparison
 * Optional module for comparing database state between environments
 */

import { Client } from 'pg';
import { config } from './config.js';

/**
 * Database comparison results
 */
export async function compareDatabase() {
  if (!config.LOCAL_DB_URL || !config.PROD_DB_URL) {
    console.log('⚠️ Database URLs not provided, skipping DB comparison');
    return null;
  }
  
  console.log('🗄️ Comparing database schemas and row counts...');
  
  const localClient = new Client({ connectionString: config.LOCAL_DB_URL });
  const prodClient = new Client({ connectionString: config.PROD_DB_URL });
  
  try {
    await localClient.connect();
    await prodClient.connect();
    
    const comparison = {
      schema_comparison: await compareSchemas(localClient, prodClient),
      row_count_comparison: await compareRowCounts(localClient, prodClient),
      timestamp: new Date().toISOString()
    };
    
    return comparison;
  } catch (error) {
    console.error('❌ Database comparison failed:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    try {
      await localClient.end();
      await prodClient.end();
    } catch (error) {
      console.error('Error closing database connections:', error.message);
    }
  }
}

/**
 * Compare database schemas
 */
async function compareSchemas(localClient, prodClient) {
  console.log('🔍 Comparing database schemas...');
  
  const schemaQuery = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `;
  
  const [localSchema, prodSchema] = await Promise.all([
    localClient.query(schemaQuery),
    prodClient.query(schemaQuery)
  ]);
  
  const localTables = groupByTable(localSchema.rows);
  const prodTables = groupByTable(prodSchema.rows);
  
  const comparison = {
    local_tables: Object.keys(localTables),
    prod_tables: Object.keys(prodTables),
    missing_in_prod: [],
    missing_in_local: [],
    schema_differences: []
  };
  
  // Find missing tables
  comparison.missing_in_prod = comparison.local_tables.filter(
    table => !comparison.prod_tables.includes(table)
  );
  
  comparison.missing_in_local = comparison.prod_tables.filter(
    table => !comparison.local_tables.includes(table)
  );
  
  // Compare common tables
  const commonTables = comparison.local_tables.filter(
    table => comparison.prod_tables.includes(table)
  );
  
  for (const table of commonTables) {
    const tableDiff = compareTableSchema(localTables[table], prodTables[table], table);
    if (tableDiff.differences.length > 0) {
      comparison.schema_differences.push(tableDiff);
    }
  }
  
  console.log(`✅ Schema comparison complete: ${commonTables.length} common tables`);
  return comparison;
}

/**
 * Compare row counts between databases
 */
async function compareRowCounts(localClient, prodClient) {
  console.log('🔢 Comparing row counts...');
  
  // Get all table names
  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `;
  
  const [localTables, prodTables] = await Promise.all([
    localClient.query(tablesQuery),
    prodClient.query(tablesQuery)
  ]);
  
  const commonTables = localTables.rows
    .map(row => row.table_name)
    .filter(table => prodTables.rows.some(pt => pt.table_name === table));
  
  const rowCounts = [];
  
  for (const table of commonTables) {
    try {
      const [localCount, prodCount] = await Promise.all([
        localClient.query(`SELECT COUNT(*) as count FROM ${table}`),
        prodClient.query(`SELECT COUNT(*) as count FROM ${table}`)
      ]);
      
      const localRows = parseInt(localCount.rows[0].count);
      const prodRows = parseInt(prodCount.rows[0].count);
      
      rowCounts.push({
        table,
        local_count: localRows,
        prod_count: prodRows,
        difference: Math.abs(localRows - prodRows),
        match: localRows === prodRows
      });
    } catch (error) {
      rowCounts.push({
        table,
        error: error.message
      });
    }
  }
  
  console.log(`✅ Row count comparison complete: ${rowCounts.length} tables`);
  return rowCounts;
}

/**
 * Group schema columns by table
 */
function groupByTable(columns) {
  const tables = {};
  
  for (const column of columns) {
    if (!tables[column.table_name]) {
      tables[column.table_name] = [];
    }
    tables[column.table_name].push(column);
  }
  
  return tables;
}

/**
 * Compare schema for a specific table
 */
function compareTableSchema(localColumns, prodColumns, tableName) {
  const differences = [];
  
  const localColumnMap = new Map(localColumns.map(col => [col.column_name, col]));
  const prodColumnMap = new Map(prodColumns.map(col => [col.column_name, col]));
  
  // Find columns missing in production
  for (const [columnName, column] of localColumnMap) {
    if (!prodColumnMap.has(columnName)) {
      differences.push({
        type: 'missing_in_prod',
        column: columnName,
        local_definition: column
      });
    }
  }
  
  // Find columns missing in local
  for (const [columnName, column] of prodColumnMap) {
    if (!localColumnMap.has(columnName)) {
      differences.push({
        type: 'missing_in_local',
        column: columnName,
        prod_definition: column
      });
    }
  }
  
  // Compare common columns
  for (const [columnName, localColumn] of localColumnMap) {
    const prodColumn = prodColumnMap.get(columnName);
    if (prodColumn) {
      const columnDiff = compareColumns(localColumn, prodColumn);
      if (columnDiff.length > 0) {
        differences.push({
          type: 'definition_mismatch',
          column: columnName,
          differences: columnDiff,
          local_definition: localColumn,
          prod_definition: prodColumn
        });
      }
    }
  }
  
  return {
    table: tableName,
    differences
  };
}

/**
 * Compare individual column definitions
 */
function compareColumns(localColumn, prodColumn) {
  const differences = [];
  
  const fields = ['data_type', 'is_nullable', 'column_default'];
  
  for (const field of fields) {
    if (localColumn[field] !== prodColumn[field]) {
      differences.push({
        field,
        local_value: localColumn[field],
        prod_value: prodColumn[field]
      });
    }
  }
  
  return differences;
}