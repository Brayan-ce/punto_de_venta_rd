const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '72.62.128.63', port: 3306, user: 'brayan', password: '123456', database: 'punto_venta_rd' });
  const tablas = ['fin_pagos','fin_cuotas','fin_contratos','fin_alertas','fin_planes','clientes','fin_pago_cuotas','fin_fiadores','fin_plan_opciones','fin_contrato_categorias','fin_contrato_activos'];
  for (const t of tablas) {
    const [cols] = await c.query("SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION", [t]);
    console.log('=== ' + t + ' ===');
    for (const r of cols) console.log('  ' + r.COLUMN_NAME + ' | ' + r.COLUMN_TYPE + ' | null=' + r.IS_NULLABLE + ' | def=' + r.COLUMN_DEFAULT + ' | ' + r.EXTRA);
  }
  await c.end();
})();
