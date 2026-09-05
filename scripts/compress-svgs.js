const fs = require('fs').promises
const path = require('path')
const { optimize } = require('svgo')

const svgoConfig = require('../svgo.config.js')

async function compressSVGsInDirectory(dirPath) {
  try {
    const files = await fs.readdir(dirPath)
    const svgFiles = files.filter(file => file.endsWith('.svg'))
    
    if (svgFiles.length === 0) {
      console.log(`No se encontraron archivos SVG en ${dirPath}`)
      return { total: 0, saved: 0 }
    }

    let totalOriginalSize = 0
    let totalCompressedSize = 0

    console.log(`\n📦 Comprimiendo ${svgFiles.length} archivos SVG en ${dirPath}...\n`)

    for (const file of svgFiles) {
      const filePath = path.join(dirPath, file)
      const originalContent = await fs.readFile(filePath, 'utf8')
      const originalSize = Buffer.byteLength(originalContent, 'utf8')
      totalOriginalSize += originalSize

      const result = optimize(originalContent, {
        path: filePath,
        ...svgoConfig
      })

      if (result.error) {
        console.error(`❌ Error al comprimir ${file}:`, result.error)
        continue
      }

      const compressedSize = Buffer.byteLength(result.data, 'utf8')
      totalCompressedSize += compressedSize
      const saved = originalSize - compressedSize
      const savedPercent = ((saved / originalSize) * 100).toFixed(1)

      await fs.writeFile(filePath, result.data, 'utf8')

      console.log(`✅ ${file}`)
      console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`)
      console.log(`   Comprimido: ${(compressedSize / 1024).toFixed(2)} KB`)
      console.log(`   Ahorro: ${(saved / 1024).toFixed(2)} KB (${savedPercent}%)\n`)
    }

    const totalSaved = totalOriginalSize - totalCompressedSize
    const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(1)

    return {
      total: svgFiles.length,
      originalSize: totalOriginalSize,
      compressedSize: totalCompressedSize,
      saved: totalSaved,
      savedPercent: totalSavedPercent
    }
  } catch (error) {
    console.error(`Error al procesar directorio ${dirPath}:`, error)
    return { total: 0, saved: 0 }
  }
}

async function main() {
  console.log('🚀 Iniciando compresión de SVGs...\n')

  const directories = [
    path.join(__dirname, '../public/illustrations3D'),
    path.join(__dirname, '../public/lustracion_reparaciones')
  ]

  let totalFiles = 0
  let totalOriginalSize = 0
  let totalCompressedSize = 0

  for (const dir of directories) {
    try {
      await fs.access(dir)
      const result = await compressSVGsInDirectory(dir)
      totalFiles += result.total
      totalOriginalSize += result.originalSize || 0
      totalCompressedSize += result.compressedSize || 0
    } catch (error) {
      console.error(`⚠️  Directorio no encontrado: ${dir}`)
    }
  }

  if (totalFiles > 0) {
    const totalSaved = totalOriginalSize - totalCompressedSize
    const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(1)

    console.log('='.repeat(60))
    console.log('📊 RESUMEN FINAL')
    console.log('='.repeat(60))
    console.log(`Total de archivos procesados: ${totalFiles}`)
    console.log(`Tamaño original total: ${(totalOriginalSize / 1024).toFixed(2)} KB`)
    console.log(`Tamaño comprimido total: ${(totalCompressedSize / 1024).toFixed(2)} KB`)
    console.log(`Ahorro total: ${(totalSaved / 1024).toFixed(2)} KB (${totalSavedPercent}%)`)
    console.log('='.repeat(60))
  } else {
    console.log('⚠️  No se encontraron archivos SVG para comprimir')
  }
}

main().catch(console.error)

