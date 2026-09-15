MariaDB [punto_venta_rd]> CREATE TABLE guia_contenido (
d          INT AUTO_INCREMENT PRIMA    ->     id          INT AUTO_INCREMENT PRIMARY KEY,
    ->     titulo      VARCHAR(200) NOT NULL,
    ->     descripcion TEXT         NULL,
    tipo        ENUM('video','texto','imagen','pdf') NOT    ->     tipo        ENUM('video','texto','imagen','pdf') NOT NULL,
    ->     contenido   TEXT         NULL,
    ->     orden       INT          NOT NULL DEFAULT 0,
    ->     activo      TINYINT(1)   NOT NULL DEFAULT 1,
    ->     created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ->     updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -> );
E INDEX idx_guia_orden ON guia_contenido (activo, oQuery OK, 0 rows affected (0.010 sec)

MariaDB [punto_venta_rd]>
MariaDB [punto_venta_rd]> CREATE INDEX idx_guia_orden ON guia_contenido (activo, orden);
Query OK, 0 rows affected (0.015 sec)
Records: 0  Duplicates: 0  Warnings: 0

MariaDB [punto_venta_rd]>

