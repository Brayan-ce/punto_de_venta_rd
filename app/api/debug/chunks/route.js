import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Endpoint de diagnóstico para verificar chunks de Next.js
 * Útil para debuggear errores 500 en producción
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const chunkName = searchParams.get('chunk')
    
    const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks')
    
    // Verificar si el directorio existe
    const dirExists = fs.existsSync(chunksDir)
    
    if (!dirExists) {
      return NextResponse.json({
        success: false,
        error: 'Chunks directory does not exist',
        path: chunksDir,
        cwd: process.cwd(),
      }, { status: 500 })
    }
    
    // Listar todos los chunks disponibles
    const chunks = fs.readdirSync(chunksDir)
      .filter(file => file.endsWith('.js'))
      .slice(0, 50) // Limitar a 50 para no sobrecargar
    
    // Si se especifica un chunk específico, verificar si existe
    if (chunkName) {
      const chunkPath = path.join(chunksDir, chunkName)
      const chunkExists = fs.existsSync(chunkPath)
      
      if (chunkExists) {
        const stats = fs.statSync(chunkPath)
        return NextResponse.json({
          success: true,
          chunk: chunkName,
          exists: true,
          size: stats.size,
          path: chunkPath,
          readable: true,
        })
      } else {
        return NextResponse.json({
          success: false,
          chunk: chunkName,
          exists: false,
          path: chunkPath,
          availableChunks: chunks.slice(0, 10),
        }, { status: 404 })
      }
    }
    
    // Retornar información general
    return NextResponse.json({
      success: true,
      chunksDir,
      totalChunks: chunks.length,
      chunks: chunks,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

