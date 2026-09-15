import iconv from 'iconv-lite'

const CODE_PAGES = {
    cp850: { escPosId: 2, label: 'CP850' },
    cp437: { escPosId: 0, label: 'CP437' }
}

export function getPrinterCodePage(value = process.env.THERMAL_PRINTER_CODEPAGE || 'cp850') {
    const normalized = String(value).toLowerCase()
    return CODE_PAGES[normalized] ? normalized : 'cp850'
}

export function encodePrinterText(value, codePage = getPrinterCodePage()) {
    const selected = getPrinterCodePage(codePage)
    return iconv.encode(String(value ?? ''), selected)
}

export function selectCodePage(codePage = getPrinterCodePage()) {
    const selected = getPrinterCodePage(codePage)
    return Buffer.from([0x1b, 0x74, CODE_PAGES[selected].escPosId])
}

export function getSupportedCodePages() {
    return Object.entries(CODE_PAGES).map(([id, value]) => ({ id, ...value }))
}