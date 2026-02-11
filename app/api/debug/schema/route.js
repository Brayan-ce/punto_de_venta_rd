import { NextResponse } from 'next/server'
import db from '@/_DB/db'

/**
 * Endpoint de diagnóstico para verificar esquema de base de datos
 * Útil para debuggear errores de columnas faltantes
 */
export async function GET(request) {
  let connection
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table') || 'obras'
    
    connection = await db.getConnection()
    
    // Verificar si la tabla existe
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ?`,
      [tableName]
    )
    
    if (tables.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Table '${tableName}' does not exist`,
        table: tableName,
      }, { status: 404 })
    }
    
    // Obtener todas las columnas de la tabla
    const [columns] = await connection.query(
      `SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [tableName]
    )
    
    // Verificar columnas específicas que el código espera
    const expectedColumns = ['empresa_id', 'codigo_obra']
    const columnNames = columns.map(col => col.COLUMN_NAME)
    const missingColumns = expectedColumns.filter(col => !columnNames.includes(col))
    
    connection.release()
    
    return NextResponse.json({
      success: true,
      table: tableName,
      exists: true,
      totalColumns: columns.length,
      columns: columns,
      columnNames: columnNames,
      expectedColumns: expectedColumns,
      missingColumns: missingColumns,
      hasAllRequiredColumns: missingColumns.length === 0,
    })
  } catch (error) {
    if (connection) connection.release()
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

