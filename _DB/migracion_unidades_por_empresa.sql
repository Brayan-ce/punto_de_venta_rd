UPDATE unidades_medida SET empresa_id = NULL WHERE empresa_id > 0;

DELETE FROM unidades_medida WHERE empresa_id IS NOT NULL AND codigo NOT IN (
  'UN', 'LB', 'KG', 'GR', 'MG', 'TON', 'LIBRA', 'OZ', 'ONZA', 'TON_US', 'QQ',
  'L', 'LT', 'LITRO', 'ML', 'M3', 'PT', 'FL_OZ', 'M', 'MT', 'METRO', 'MM', 'KM',
  'FT', 'PIE', 'IN', 'PULGADA', 'YD', 'MI', 'M2', 'KM2', 'HA', 'FT2', 'IN2',
  'TAREA', 'UND', 'UNIDAD', 'PZ', 'PIEZA', 'MIL', 'PAR', 'SAC', 'PAQ', 'FRA',
  'LAT', 'TUB', 'ROL', 'H', 'MIN', 'SEM', 'MES'
);
