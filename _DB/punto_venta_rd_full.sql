/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: punto_venta_rd
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cajas`
--

DROP TABLE IF EXISTS `cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `monto_inicial` decimal(10,2) NOT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `total_ventas` decimal(10,2) DEFAULT 0.00,
  `total_efectivo` decimal(10,2) DEFAULT 0.00,
  `total_tarjeta_debito` decimal(10,2) DEFAULT 0.00,
  `total_tarjeta_credito` decimal(10,2) DEFAULT 0.00,
  `total_transferencia` decimal(10,2) DEFAULT 0.00,
  `total_cheque` decimal(10,2) DEFAULT 0.00,
  `total_gastos` decimal(10,2) DEFAULT 0.00,
  `diferencia` decimal(10,2) DEFAULT 0.00,
  `estado` enum('abierta','cerrada') DEFAULT 'abierta',
  `notas` text DEFAULT NULL,
  `fecha_apertura` timestamp NULL DEFAULT current_timestamp(),
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_apertura` (`fecha_apertura`),
  CONSTRAINT `cajas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cajas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cajas`
--

LOCK TABLES `cajas` WRITE;
/*!40000 ALTER TABLE `cajas` DISABLE KEYS */;
INSERT INTO `cajas` VALUES
(1,1,9,500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-11 04:17:33',NULL),
(2,5,13,4000.00,4000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-11 07:05:24','2025-12-11 07:05:50'),
(4,3,11,500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 01:36:07',NULL),
(5,2,10,200.00,500.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,300.00,'cerrada',NULL,'2025-12-13 01:43:46','2025-12-13 02:56:01'),
(6,2,21,110.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 01:45:59',NULL),
(8,2,10,0.00,200.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,200.00,'cerrada',NULL,'2025-12-13 02:56:20','2025-12-14 19:06:01'),
(9,5,13,5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-13 06:24:38','2025-12-14 22:55:07'),
(10,13,22,1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 18:17:05',NULL),
(11,1,5,10000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 01:10:48',NULL),
(12,1,4,5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-14 04:20:01','2025-12-14 04:25:04'),
(13,1,4,5000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 04:25:31',NULL),
(14,15,25,23.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 17:04:59',NULL),
(15,1,7,1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 17:36:02',NULL),
(16,2,10,0.00,20000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,20000.00,'cerrada',NULL,'2025-12-14 19:07:22','2025-12-14 23:24:20'),
(17,5,13,5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-15 01:23:59','2025-12-16 08:53:58'),
(18,2,10,123456.00,123423.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,-33.00,'cerrada',NULL,'2025-12-15 02:03:30','2025-12-15 02:04:28'),
(19,2,10,12.00,1.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,-11.00,'cerrada',NULL,'2025-12-15 02:04:33','2025-12-15 02:04:44'),
(20,2,10,0.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-15 02:05:13',NULL),
(21,16,26,200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-15 20:12:48',NULL),
(22,17,27,1000000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-16 00:35:29',NULL),
(23,5,13,5000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-16 08:54:12',NULL),
(24,1,3,0.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-17 18:33:14',NULL),
(25,18,28,700.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-17 18:57:00',NULL),
(26,19,29,1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-18 17:04:40',NULL);
/*!40000 ALTER TABLE `cajas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_empresa` (`empresa_id`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES
(1,1,'asdasd',NULL,1,'2025-12-09 23:07:26'),
(2,2,'Sodas','Kola real',1,'2025-12-10 00:37:47'),
(3,3,'Refrescos','Pequeño 30 grande 75',1,'2025-12-10 01:23:14'),
(4,3,'Pizza suprema','Completa',1,'2025-12-10 01:26:54'),
(5,5,'Cámaras',NULL,1,'2025-12-11 00:19:54'),
(6,5,'DVR',NULL,1,'2025-12-11 00:20:20'),
(8,4,'Perfumería',NULL,1,'2025-12-11 03:28:40'),
(9,4,'Polos de hombre',NULL,1,'2025-12-11 03:28:50'),
(10,15,'asdasd',NULL,1,'2025-12-14 17:30:34'),
(11,16,'vivere',NULL,1,'2025-12-15 20:14:26'),
(12,2,'Viveres',NULL,1,'2025-12-16 12:03:10');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `tipo_documento_id` int(11) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `apellidos` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('masculino','femenino','otro','prefiero_no_decir') DEFAULT NULL,
  `total_compras` decimal(12,2) DEFAULT 0.00,
  `puntos_fidelidad` int(11) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tipo_documento_id` (`tipo_documento_id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_documento` (`numero_documento`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_telefono` (`telefono`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clientes_ibfk_2` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES
(1,5,1,'087-0018956-9','Juan','De la cruz','8096177488','juanrenandelacruz87@gmail.com','Fantino','Malecon','Fantino','Sánchez Ramírez',NULL,'masculino',0.00,0,1,'2025-12-11 00:18:27','2025-12-11 00:18:27'),
(2,5,1,'439-9652827-7','Eulises','Consumidor','829-581-8272','eulises8046@hotmail.com','Av. Abraham Lincoln No. 562','El Millon','Santo Domingo','Distrito Nacional',NULL,NULL,2950.00,0,1,'2025-12-11 00:21:29','2025-12-11 00:21:30'),
(3,4,1,'302-3765438-9','Juan','Perez','809555555','cliente@ejemplo.com',NULL,'Naco','Santo Domingo','Distrito nacional','1994-10-10','masculino',13388.00,0,1,'2025-12-11 03:31:56','2025-12-11 04:34:32'),
(4,1,1,'696-5852846-1','Elvis','Consumidor','849-429-1624','elvis6602@gmail.com','Calle Las Mercedes No. 528','Piantini','Santo Domingo','Distrito Nacional',NULL,NULL,1175.00,0,1,'2025-12-14 01:12:36','2025-12-14 01:12:37'),
(5,15,1,'267-8129761-1','brayan','Consumidor','809-875-7857','brayan1209@outlook.com','Av. Abraham Lincoln No. 572','Naco','Santo Domingo','Distrito Nacional',NULL,NULL,145.14,0,1,'2025-12-14 17:45:16','2025-12-14 17:45:21'),
(6,15,1,'247-7773595-5','brayan','Consumidor','849-428-9955','brayan7466@outlook.com','Calle Las Mercedes No. 362','Naco','Santo Domingo','Distrito Nacional',NULL,NULL,145.14,0,1,'2025-12-14 19:18:10','2025-12-14 19:18:10');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `tipo_comprobante_id` int(11) NOT NULL,
  `ncf` varchar(19) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `itbis` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('recibida','pendiente','anulada') DEFAULT 'recibida',
  `notas` text DEFAULT NULL,
  `fecha_compra` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tipo_comprobante_id` (`tipo_comprobante_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_ncf` (`ncf`),
  KEY `idx_fecha` (`fecha_compra`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_proveedor` (`proveedor_id`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`tipo_comprobante_id`) REFERENCES `tipos_comprobante` (`id`),
  CONSTRAINT `compras_ibfk_3` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`),
  CONSTRAINT `compras_ibfk_4` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despachos`
--

DROP TABLE IF EXISTS `despachos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `despachos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) NOT NULL,
  `numero_despacho` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_despacho` timestamp NULL DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `estado` enum('activo','cerrado','anulado') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_venta` (`venta_id`),
  KEY `idx_fecha` (`fecha_despacho`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `despachos_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `despachos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despachos`
--

LOCK TABLES `despachos` WRITE;
/*!40000 ALTER TABLE `despachos` DISABLE KEYS */;
INSERT INTO `despachos` VALUES
(1,1,1,11,'2025-12-10 23:04:30','Despacho completo','cerrado'),
(2,2,1,13,'2025-12-11 00:21:30','Despacho completo','cerrado'),
(3,3,1,12,'2025-12-11 03:48:42','Despacho completo','cerrado'),
(4,4,1,12,'2025-12-11 03:49:19','Despacho completo','cerrado'),
(5,5,1,12,'2025-12-11 03:50:05','Despacho completo','cerrado'),
(6,6,1,12,'2025-12-11 03:50:44','Despacho completo','cerrado'),
(7,7,1,12,'2025-12-11 03:56:03','Despacho completo','cerrado'),
(8,8,1,12,'2025-12-11 04:22:34','Despacho completo','cerrado'),
(9,9,1,12,'2025-12-11 04:34:32','Despacho completo','cerrado'),
(10,10,1,12,'2025-12-11 04:35:23','Despacho completo','cerrado'),
(11,11,1,12,'2025-12-11 04:36:23','Despacho completo','cerrado'),
(12,12,1,9,'2025-12-11 22:54:37','Despacho completo','cerrado'),
(13,13,1,9,'2025-12-11 22:56:10','Despacho completo','cerrado'),
(14,14,1,9,'2025-12-11 22:56:51','Despacho completo','cerrado'),
(15,15,1,9,'2025-12-11 23:12:45','Despacho completo','cerrado'),
(16,16,1,9,'2025-12-11 23:13:39','Despacho completo','cerrado'),
(17,17,1,9,'2025-12-11 23:15:47','Despacho completo','cerrado'),
(18,18,1,9,'2025-12-11 23:18:58','Despacho completo','cerrado'),
(19,19,1,11,'2025-12-13 15:38:18','Despacho completo','cerrado'),
(20,20,1,11,'2025-12-13 16:43:49','Despacho completo','cerrado'),
(21,21,1,5,'2025-12-14 01:12:37','Despacho completo','cerrado'),
(22,22,1,25,'2025-12-14 17:45:20','Despacho completo','cerrado'),
(23,23,1,10,'2025-12-14 19:08:07','Despacho completo','cerrado'),
(24,24,1,5,'2025-12-14 19:11:50','Despacho completo','cerrado'),
(25,25,1,25,'2025-12-14 19:18:10','Despacho completo','cerrado'),
(26,26,1,10,'2025-12-15 19:09:54','Despacho completo','cerrado'),
(27,27,1,26,'2025-12-15 20:27:27','Despacho completo','cerrado');
/*!40000 ALTER TABLE `despachos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compras`
--

DROP TABLE IF EXISTS `detalle_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_compras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compra_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_compra` (`compra_id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `detalle_compras_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_compras_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_despachos`
--

DROP TABLE IF EXISTS `detalle_despachos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_despachos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `despacho_id` int(11) NOT NULL,
  `detalle_venta_id` int(11) NOT NULL,
  `cantidad_despachada` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_despacho` (`despacho_id`),
  KEY `idx_detalle_venta` (`detalle_venta_id`),
  CONSTRAINT `detalle_despachos_ibfk_1` FOREIGN KEY (`despacho_id`) REFERENCES `despachos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_despachos_ibfk_2` FOREIGN KEY (`detalle_venta_id`) REFERENCES `detalle_ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_despachos`
--

LOCK TABLES `detalle_despachos` WRITE;
/*!40000 ALTER TABLE `detalle_despachos` DISABLE KEYS */;
INSERT INTO `detalle_despachos` VALUES
(1,1,1,1),
(2,1,2,1),
(3,2,3,1),
(4,3,4,2),
(5,4,5,1),
(6,5,6,3),
(7,6,7,1),
(8,7,8,1),
(9,7,9,1),
(10,7,10,1),
(11,7,11,1),
(12,8,12,1),
(13,8,13,1),
(14,9,14,2),
(15,10,15,1),
(16,11,16,1),
(17,11,17,1),
(18,12,18,8),
(19,13,19,1),
(20,14,20,2),
(21,15,21,2),
(22,16,22,1),
(23,17,23,3),
(24,18,24,2),
(25,19,25,1),
(26,20,26,1),
(27,21,27,1),
(28,22,28,1),
(29,23,29,3),
(30,24,30,1),
(31,25,31,1),
(32,26,32,1),
(33,27,33,2);
/*!40000 ALTER TABLE `detalle_despachos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `cantidad_despachada` int(11) DEFAULT 0,
  `cantidad_pendiente` int(11) DEFAULT 0,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `monto_gravado` decimal(10,2) NOT NULL,
  `itbis` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_venta` (`venta_id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `detalle_ventas_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_ventas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES
(1,1,22,1,1,0,750.00,750.00,0.00,750.00,0.00,750.00),
(2,1,59,1,1,0,250.00,250.00,0.00,250.00,0.00,250.00),
(3,2,114,1,1,0,2500.00,2500.00,0.00,2500.00,450.00,2950.00),
(4,3,139,2,2,0,600.00,1200.00,0.00,1200.00,216.00,1416.00),
(5,4,148,1,1,0,2200.00,2200.00,0.00,2200.00,396.00,2596.00),
(6,5,148,3,3,0,2200.00,6600.00,0.00,6600.00,1188.00,7788.00),
(7,6,141,1,1,0,3000.00,3000.00,0.00,3000.00,540.00,3540.00),
(8,7,141,1,1,0,3000.00,3000.00,0.00,3000.00,0.00,3000.00),
(9,7,139,1,1,0,600.00,600.00,0.00,600.00,0.00,600.00),
(10,7,143,1,1,0,2500.00,2500.00,0.00,2500.00,0.00,2500.00),
(11,7,148,1,1,0,2200.00,2200.00,0.00,2200.00,0.00,2200.00),
(12,8,141,1,1,0,3000.00,3000.00,0.00,3000.00,0.00,3000.00),
(13,8,139,1,1,0,600.00,600.00,0.00,600.00,0.00,600.00),
(14,9,178,2,2,0,2800.00,5600.00,0.00,5600.00,0.00,5600.00),
(15,10,178,1,1,0,2800.00,2800.00,0.00,2800.00,0.00,2800.00),
(16,11,178,1,1,0,2800.00,2800.00,0.00,2800.00,0.00,2800.00),
(17,11,143,1,1,0,2500.00,2500.00,0.00,2500.00,0.00,2500.00),
(18,12,6,8,8,0,160.00,1280.00,0.00,1280.00,0.00,1280.00),
(19,13,123,1,1,0,700.00,700.00,0.00,700.00,0.00,700.00),
(20,14,119,2,2,0,50.00,100.00,0.00,100.00,0.00,100.00),
(21,15,7,2,2,0,110.00,220.00,0.00,220.00,0.00,220.00),
(22,16,81,1,1,0,350.00,350.00,0.00,350.00,0.00,350.00),
(23,17,173,3,3,0,25.00,75.00,0.00,75.00,0.00,75.00),
(24,18,174,2,2,0,15.00,30.00,0.00,30.00,0.00,30.00),
(25,19,22,1,1,0,750.00,750.00,0.00,750.00,0.00,750.00),
(26,20,59,1,1,0,250.00,250.00,0.00,250.00,0.00,250.00),
(27,21,127,1,1,0,1175.00,1175.00,0.00,1175.00,0.00,1175.00),
(28,22,196,1,1,0,123.00,123.00,0.00,123.00,22.14,145.14),
(29,23,2,3,3,0,30.00,90.00,0.00,90.00,16.20,106.20),
(30,24,179,1,1,0,570.00,570.00,0.00,570.00,0.00,570.00),
(31,25,197,1,1,0,123.00,123.00,0.00,123.00,22.14,145.14),
(32,26,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(33,27,198,2,2,0,34.98,69.96,0.00,69.96,12.59,82.55);
/*!40000 ALTER TABLE `detalle_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_empresa` varchar(200) NOT NULL,
  `rnc` varchar(11) NOT NULL,
  `razon_social` varchar(250) NOT NULL,
  `nombre_comercial` varchar(200) NOT NULL,
  `actividad_economica` varchar(200) NOT NULL,
  `direccion` text NOT NULL,
  `sector` varchar(100) NOT NULL,
  `municipio` varchar(100) NOT NULL,
  `provincia` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `moneda` varchar(3) DEFAULT 'DOP',
  `simbolo_moneda` varchar(5) DEFAULT 'RD$',
  `impuesto_nombre` varchar(50) DEFAULT 'ITBIS',
  `impuesto_porcentaje` decimal(5,2) DEFAULT 18.00,
  `logo_url` varchar(255) DEFAULT NULL,
  `color_fondo` varchar(7) DEFAULT '#FFFFFF',
  `mensaje_factura` text DEFAULT NULL,
  `secuencia_ncf_fiscal` varchar(20) DEFAULT NULL,
  `secuencia_ncf_consumidor` varchar(20) DEFAULT NULL,
  `secuencia_ncf_gubernamental` varchar(20) DEFAULT NULL,
  `secuencia_ncf_regimenes` varchar(20) DEFAULT NULL,
  `fecha_vencimiento_ncf` date DEFAULT NULL,
  `usuario_dgii` varchar(100) DEFAULT NULL,
  `ambiente_dgii` enum('prueba','produccion') DEFAULT 'prueba',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rnc` (`rnc`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES
(1,'Empresa SuperAdmin','999-99999-9','SUPERADMIN EMPRESA SRL','SuperAdmin Store','Administración del sistema','Calle Principal #123','Sector Central','Santo Domingo','Distrito Nacional',NULL,NULL,'DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-09 22:53:25','2025-12-11 16:21:31'),
(2,'Barra 4 vientos','738-29292-9','Barra 4 vientos','Barra 4 vientos','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295844245','lasmellasserver@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 00:22:34','2025-12-15 13:05:18'),
(3,'Cheesepizza','511-06689-0','Cheesepizza','Cheesepizza','Comercio al por menor','Calle progreso frente a servicentro','La progreso','Nagua','Maria Trinidad Sanchez','8495025126','bmbrayanmartinez@icloun.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 01:18:31','2025-12-15 17:31:04'),
(4,'Exclusive Drips','PEND151318','Exclusive Drips','Exclusive Drips','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8292876233','ainhoahernandez04@icloud.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 02:02:31','2025-12-10 02:02:31'),
(5,'SentryTech Multiservices','087-00189-5','SentryTech Multiservices','SentryTech Multiservices','Comercio al por menor','Calle Hnas. Mirabal, Esq. Sanchez, Frente  a la Farmacia Abreu','Centro Pueblo','Fantino','Sanchez Ramirez','8096177188','juanrenandelacruz87@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF','Gracias por Elegirnos',NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 17:34:04','2025-12-11 07:01:09'),
(6,'Tupapa','PEND083317','Tupapa','Tupapa','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295543767','prueba2@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 23:58:03','2025-12-10 23:58:03'),
(7,'D’Vicell','PEND179796','D’Vicell','D’Vicell','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8293086775','frankelis071@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-11 12:29:39','2025-12-11 12:29:39'),
(8,'Pruebal','PEND707852','Pruebal','Pruebal','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8292191548','elpruebal@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-11 16:31:47','2025-12-11 16:31:47'),
(9,'Empresa Corina amparo','PEND620852','Empresa Corina amparo','Empresa Corina amparo','Comercio','Pendiente','Pendiente','Pendiente','Pendiente',NULL,NULL,'DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-12 00:50:20','2025-12-12 00:50:20'),
(10,'Klk','PEND712155','Klk','Klk','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295844245','mendoza@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-12 00:51:52','2025-12-12 00:51:52'),
(11,'Universidad Nacional San Luis Gonzaga','PEND800956','Universidad Nacional San Luis Gonzaga','Universidad Nacional San Luis Gonzaga','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','957786282','giancarlos@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-12 02:33:20','2025-12-12 02:33:20'),
(12,'SmartCities','PEND082838','SmartCities','SmartCities','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','916367507','infoeliasar12@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-12 04:18:02','2025-12-12 04:18:02'),
(13,'Comedor maria','PEND051444','Comedor maria','Comedor maria','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295844245','manuel@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-13 18:04:11','2025-12-13 18:04:11'),
(14,'Comedor maria','PEND273060','Comedor maria','Comedor maria','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','84597643484','manuel2@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-13 18:07:53','2025-12-13 18:07:53'),
(15,'Empresa prueba','PEND381786','Empresa prueba','Empresa prueba','Comercio','Pendiente','Pendiente','Pendiente','Pendiente',NULL,NULL,'DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-14 16:56:21','2025-12-14 16:56:21'),
(16,'conuco ramona','PEND534841','conuco ramona','conuco ramona','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','829 8172975','ramonaescolasticoortega@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-15 20:12:14','2025-12-15 20:12:14'),
(17,'VENDEDOR DE AGUAS DE PATA','PEND279566','VENDEDOR DE AGUAS DE PATA','VENDEDOR DE AGUAS DE PATA','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','829312018','leonkaurhot23@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-16 00:34:39','2025-12-16 00:34:39'),
(18,'D’ paca magica','PEND589076','D’ paca magica','D’ paca magica','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8496395590','anabelfelixgalan@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-17 18:53:09','2025-12-17 18:53:09'),
(19,'Locación de junior','PEND340442','Locación de junior','Locación de junior','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8494783337','junior07@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-18 17:02:20','2025-12-18 17:02:20');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gastos`
--

DROP TABLE IF EXISTS `gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `concepto` varchar(200) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `caja_id` int(11) DEFAULT NULL,
  `comprobante_numero` varchar(50) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `fecha_gasto` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `caja_id` (`caja_id`),
  KEY `idx_fecha` (`fecha_gasto`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_usuario` (`usuario_id`),
  CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gastos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `gastos_ibfk_3` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
/*!40000 ALTER TABLE `gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marcas`
--

DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `pais_origen` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_empresa` (`empresa_id`),
  CONSTRAINT `marcas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES
(1,1,'asdasd',NULL,NULL,NULL,1,'2025-12-09 23:07:33'),
(2,5,'UNV','China',NULL,NULL,1,'2025-12-11 00:19:33'),
(3,4,'Náutica',NULL,NULL,NULL,1,'2025-12-11 03:29:09'),
(4,4,'Calvin Klein',NULL,NULL,NULL,1,'2025-12-11 03:29:23'),
(5,4,'American eagle',NULL,NULL,NULL,1,'2025-12-11 03:29:32'),
(6,15,'asdasd',NULL,NULL,NULL,1,'2025-12-14 17:30:45');
/*!40000 ALTER TABLE `marcas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monedas`
--

DROP TABLE IF EXISTS `monedas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `monedas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(3) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `simbolo` varchar(5) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monedas`
--

LOCK TABLES `monedas` WRITE;
/*!40000 ALTER TABLE `monedas` DISABLE KEYS */;
INSERT INTO `monedas` VALUES
(1,'DOP','Peso Dominicano','RD$',1,'2025-12-09 22:53:23'),
(2,'USD','Dolar Estadounidense','US$',1,'2025-12-09 22:53:23'),
(3,'EUR','Euro','€',0,'2025-12-09 22:53:23');
/*!40000 ALTER TABLE `monedas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `tipo` enum('entrada','salida','ajuste','devolucion','merma') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `stock_anterior` int(11) NOT NULL,
  `stock_nuevo` int(11) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `notas` text DEFAULT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_producto` (`producto_id`),
  KEY `idx_fecha` (`fecha_movimiento`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_tipo` (`tipo`),
  CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_inventario_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_inventario_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=309 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES
(2,2,2,'entrada',100,0,100,'Stock inicial',10,'Creacion de producto','2025-12-10 01:28:43'),
(3,2,4,'entrada',100,0,100,'Stock inicial',10,'Creacion de producto','2025-12-10 02:01:12'),
(4,1,9,'entrada',1,0,1,NULL,9,NULL,'2025-12-10 20:00:33'),
(5,3,11,'entrada',950,0,950,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 21:52:47'),
(6,3,11,'salida',300,950,650,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 21:56:37'),
(7,3,3,'entrada',950,0,950,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 22:06:05'),
(8,3,12,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:08:57'),
(9,3,13,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:14:02'),
(10,3,17,'entrada',1200,0,1200,'Stock inicial',11,'Creacion de producto','2025-12-10 22:16:37'),
(11,3,22,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:21:02'),
(12,3,25,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:22:20'),
(13,3,23,'entrada',350,0,350,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 22:23:56'),
(14,3,27,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:24:50'),
(15,3,28,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:26:18'),
(16,3,29,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:27:21'),
(17,3,30,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:28:12'),
(18,3,31,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:31:03'),
(19,3,32,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:32:11'),
(20,3,33,'entrada',800,0,800,'Stock inicial',11,'Creacion de producto','2025-12-10 22:33:01'),
(21,3,34,'entrada',800,0,800,'Stock inicial',11,'Creacion de producto','2025-12-10 22:33:51'),
(22,3,35,'entrada',800,0,800,'Stock inicial',11,'Creacion de producto','2025-12-10 22:34:17'),
(23,3,36,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:35:19'),
(24,3,37,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:35:58'),
(25,3,39,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:40:57'),
(26,3,40,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:41:59'),
(27,3,41,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:42:51'),
(28,3,42,'entrada',950,0,950,'Stock inicial',11,'Creacion de producto','2025-12-10 22:43:34'),
(29,3,43,'entrada',500,0,500,'Stock inicial',11,'Creacion de producto','2025-12-10 22:46:11'),
(30,3,44,'entrada',500,0,500,'Stock inicial',11,'Creacion de producto','2025-12-10 22:46:49'),
(31,3,45,'entrada',500,0,500,'Stock inicial',11,'Creacion de producto','2025-12-10 22:47:16'),
(32,3,46,'entrada',500,0,500,'Stock inicial',11,'Creacion de producto','2025-12-10 22:47:55'),
(33,3,47,'entrada',550,0,550,'Stock inicial',11,'Creacion de producto','2025-12-10 22:48:31'),
(34,3,48,'entrada',500,0,500,'Stock inicial',11,'Creacion de producto','2025-12-10 22:49:03'),
(35,3,49,'entrada',550,0,550,'Stock inicial',11,'Creacion de producto','2025-12-10 22:49:43'),
(36,3,50,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:50:48'),
(37,3,51,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:51:21'),
(38,3,52,'entrada',850,0,850,'Stock inicial',11,'Creacion de producto','2025-12-10 22:52:05'),
(39,3,53,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:52:40'),
(40,3,54,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:53:18'),
(41,3,55,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:53:54'),
(42,3,56,'entrada',1000,0,1000,'Stock inicial',11,'Creacion de producto','2025-12-10 22:54:05'),
(43,3,57,'entrada',650,0,650,'Stock inicial',11,'Creacion de producto','2025-12-10 22:54:19'),
(44,3,58,'entrada',1000,0,1000,'Stock inicial',11,'Creacion de producto','2025-12-10 22:55:04'),
(45,3,59,'entrada',250,0,250,'Stock inicial',11,'Creacion de producto','2025-12-10 22:55:50'),
(46,3,60,'entrada',1000,0,1000,'Stock inicial',11,'Creacion de producto','2025-12-10 22:56:59'),
(47,3,61,'entrada',250,0,250,'Stock inicial',11,'Creacion de producto','2025-12-10 22:57:05'),
(48,3,62,'entrada',75,0,75,'Stock inicial',11,'Creacion de producto','2025-12-10 22:58:08'),
(49,3,63,'entrada',30,0,30,'Stock inicial',11,'Creacion de producto','2025-12-10 23:00:23'),
(50,3,64,'entrada',25,0,25,'Stock inicial',11,'Creacion de producto','2025-12-10 23:00:59'),
(51,3,22,'salida',1,750,749,'Venta B0200000000001',11,'Venta registrada - Comprobante Consumidor Final','2025-12-10 23:04:30'),
(52,3,59,'salida',1,250,249,'Venta B0200000000001',11,'Venta registrada - Comprobante Consumidor Final','2025-12-10 23:04:30'),
(53,3,65,'entrada',300,0,300,'Stock inicial',11,'Creacion de producto','2025-12-10 23:05:51'),
(54,3,66,'entrada',300,0,300,'Stock inicial',11,'Creacion de producto','2025-12-10 23:06:18'),
(55,3,67,'entrada',300,0,300,'Stock inicial',11,'Creacion de producto','2025-12-10 23:06:48'),
(56,3,68,'entrada',300,0,300,'Stock inicial',11,'Creacion de producto','2025-12-10 23:07:19'),
(57,3,69,'entrada',325,0,325,'Stock inicial',11,'Creacion de producto','2025-12-10 23:07:57'),
(58,3,71,'entrada',300,0,300,'Stock inicial',11,'Creacion de producto','2025-12-10 23:08:57'),
(59,3,72,'entrada',325,0,325,'Stock inicial',11,'Creacion de producto','2025-12-10 23:09:48'),
(60,3,73,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:10:30'),
(61,3,74,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:11:09'),
(62,3,75,'entrada',450,0,450,'Stock inicial',11,'Creacion de producto','2025-12-10 23:11:42'),
(63,3,76,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:12:28'),
(64,3,77,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:13:05'),
(65,3,78,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:13:37'),
(66,3,79,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 23:14:15'),
(67,1,80,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-10 23:33:38'),
(68,1,81,'entrada',8,0,8,'Stock inicial',9,'Creacion de producto','2025-12-10 23:35:00'),
(69,1,82,'entrada',11,0,11,'Stock inicial',9,'Creacion de producto','2025-12-10 23:36:14'),
(70,1,83,'entrada',11,0,11,'Stock inicial',9,'Creacion de producto','2025-12-10 23:37:21'),
(71,1,84,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-10 23:38:24'),
(72,1,85,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-10 23:43:35'),
(73,1,86,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-10 23:44:19'),
(74,1,87,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-10 23:45:10'),
(75,1,88,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-10 23:46:23'),
(76,1,89,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-10 23:47:03'),
(77,1,90,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-10 23:48:08'),
(78,1,91,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-10 23:49:08'),
(79,1,92,'entrada',7,0,7,'Stock inicial',9,'Creacion de producto','2025-12-10 23:49:49'),
(80,3,93,'entrada',1000,0,1000,'Stock inicial',11,'Creacion de producto','2025-12-10 23:51:53'),
(81,1,94,'entrada',6,0,6,'Stock inicial',9,'Creacion de producto','2025-12-10 23:52:22'),
(82,1,96,'entrada',6,0,6,'Stock inicial',9,'Creacion de producto','2025-12-10 23:56:04'),
(83,3,95,'entrada',1100,0,1100,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 23:56:58'),
(84,1,97,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-10 23:57:14'),
(85,1,98,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-10 23:58:19'),
(86,3,99,'entrada',1100,0,1100,'Stock inicial',11,'Creacion de producto','2025-12-10 23:58:53'),
(87,1,100,'entrada',9,0,9,'Stock inicial',9,'Creacion de producto','2025-12-10 23:59:19'),
(88,3,101,'entrada',1100,0,1100,'Stock inicial',11,'Creacion de producto','2025-12-11 00:00:02'),
(89,1,102,'entrada',9,0,9,'Stock inicial',9,'Creacion de producto','2025-12-11 00:00:53'),
(90,3,103,'entrada',1200,0,1200,'Stock inicial',11,'Creacion de producto','2025-12-11 00:01:47'),
(91,1,104,'entrada',6,0,6,'Stock inicial',9,'Creacion de producto','2025-12-11 00:02:03'),
(92,1,106,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-11 00:03:15'),
(93,3,105,'entrada',1200,0,1200,'Ajuste manual',11,'Actualizacion de producto','2025-12-11 00:03:36'),
(94,1,107,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 00:04:11'),
(95,3,108,'entrada',1500,0,1500,'Stock inicial',11,'Creacion de producto','2025-12-11 00:04:54'),
(96,1,109,'entrada',11,0,11,'Stock inicial',9,'Creacion de producto','2025-12-11 00:05:13'),
(97,3,110,'entrada',1200,0,1200,'Stock inicial',11,'Creacion de producto','2025-12-11 00:09:12'),
(98,3,111,'entrada',1200,0,1200,'Stock inicial',11,'Creacion de producto','2025-12-11 00:11:22'),
(99,3,112,'entrada',1100,0,1100,'Stock inicial',11,'Creacion de producto','2025-12-11 00:12:23'),
(100,3,113,'entrada',1100,0,1100,'Stock inicial',11,'Creacion de producto','2025-12-11 00:13:41'),
(101,5,114,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-11 00:16:05'),
(102,5,114,'salida',1,10,9,'Venta B0200000000002',13,'Venta registrada - Comprobante Consumidor Final','2025-12-11 00:21:30'),
(103,1,115,'entrada',11,0,11,'Stock inicial',9,'Creacion de producto','2025-12-11 00:25:23'),
(104,1,116,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:28:42'),
(105,1,117,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:29:39'),
(106,1,118,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:31:14'),
(107,1,119,'entrada',56,0,56,'Stock inicial',9,'Creacion de producto','2025-12-11 00:32:00'),
(108,1,120,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 00:33:25'),
(109,1,121,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:37:23'),
(110,1,122,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:38:06'),
(111,1,123,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 00:39:35'),
(112,1,124,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:40:54'),
(113,1,125,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 00:42:15'),
(114,1,126,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-11 00:42:51'),
(115,1,127,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:44:03'),
(116,1,128,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 00:47:55'),
(117,1,129,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-11 00:48:58'),
(118,1,130,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 00:49:44'),
(119,1,131,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 00:52:55'),
(120,1,132,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 00:53:57'),
(122,1,134,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 03:38:09'),
(123,1,135,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 03:39:04'),
(124,1,136,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 03:40:19'),
(125,1,137,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 03:41:24'),
(126,1,138,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 03:42:13'),
(127,4,139,'entrada',50,0,50,'Stock inicial',12,'Creacion de producto','2025-12-11 03:43:02'),
(128,1,140,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 03:43:32'),
(129,4,141,'entrada',15,0,15,'Stock inicial',12,'Creacion de producto','2025-12-11 03:43:53'),
(130,1,142,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 03:44:21'),
(131,1,144,'entrada',10,0,10,'Stock inicial',9,'Creacion de producto','2025-12-11 03:45:03'),
(132,1,145,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 03:45:52'),
(133,1,146,'entrada',30,0,30,'Stock inicial',9,'Creacion de producto','2025-12-11 03:46:19'),
(134,1,147,'entrada',6,0,6,'Stock inicial',9,'Creacion de producto','2025-12-11 03:47:01'),
(135,4,148,'entrada',15,0,15,'Stock inicial',12,'Creacion de producto','2025-12-11 03:47:04'),
(136,1,149,'entrada',16,0,16,'Stock inicial',9,'Creacion de producto','2025-12-11 03:47:42'),
(137,1,150,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 03:48:25'),
(138,4,139,'salida',2,50,48,'Venta B0200000000003',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:48:42'),
(139,1,151,'entrada',7,0,7,'Stock inicial',9,'Creacion de producto','2025-12-11 03:49:07'),
(140,4,148,'salida',1,15,14,'Venta B0200000000004',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:49:19'),
(141,1,152,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 03:49:47'),
(142,4,148,'salida',3,14,11,'Venta B0200000000005',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:50:05'),
(143,1,153,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-11 03:50:28'),
(144,4,141,'salida',1,15,14,'Venta B0200000000006',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:50:44'),
(145,1,154,'entrada',12,0,12,'Stock inicial',9,'Creacion de producto','2025-12-11 03:51:13'),
(146,4,143,'entrada',50,0,50,'Ajuste manual',12,'Ajuste de stock desde panel de productos','2025-12-11 03:52:47'),
(147,1,155,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 03:53:14'),
(148,1,156,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 03:54:08'),
(149,1,157,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 03:54:47'),
(150,1,158,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 03:55:35'),
(151,4,141,'salida',1,14,13,'Venta B0200000000007',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:56:03'),
(152,4,139,'salida',1,48,47,'Venta B0200000000007',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:56:03'),
(153,4,143,'salida',1,50,49,'Venta B0200000000007',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:56:03'),
(154,4,148,'salida',1,11,10,'Venta B0200000000007',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:56:03'),
(155,1,159,'entrada',5,0,5,'Stock inicial',9,'Creacion de producto','2025-12-11 03:56:07'),
(156,1,160,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 03:56:54'),
(157,1,161,'entrada',16,0,16,'Stock inicial',9,'Creacion de producto','2025-12-11 03:57:43'),
(158,1,162,'entrada',138,0,138,'Stock inicial',9,'Creacion de producto','2025-12-11 03:58:27'),
(159,1,163,'entrada',18,0,18,'Stock inicial',9,'Creacion de producto','2025-12-11 03:59:12'),
(160,1,164,'entrada',53,0,53,'Stock inicial',9,'Creacion de producto','2025-12-11 04:00:08'),
(161,1,165,'entrada',18,0,18,'Stock inicial',9,'Creacion de producto','2025-12-11 04:00:43'),
(162,1,166,'entrada',17,0,17,'Stock inicial',9,'Creacion de producto','2025-12-11 04:01:17'),
(163,1,167,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 04:02:48'),
(164,1,168,'entrada',1,0,1,'Stock inicial',9,'Creacion de producto','2025-12-11 04:03:32'),
(165,1,169,'entrada',2,0,2,'Stock inicial',9,'Creacion de producto','2025-12-11 04:04:10'),
(166,1,170,'entrada',3,0,3,'Stock inicial',9,'Creacion de producto','2025-12-11 04:04:44'),
(167,1,171,'entrada',6,0,6,'Stock inicial',9,'Creacion de producto','2025-12-11 04:05:20'),
(168,1,172,'entrada',25,0,25,'Stock inicial',9,'Creacion de producto','2025-12-11 04:05:58'),
(169,1,173,'entrada',17,0,17,'Stock inicial',9,'Creacion de producto','2025-12-11 04:06:33'),
(170,1,174,'entrada',8,0,8,'Stock inicial',9,'Creacion de producto','2025-12-11 04:07:21'),
(171,1,175,'entrada',7,0,7,'Stock inicial',9,'Creacion de producto','2025-12-11 04:07:55'),
(172,1,176,'entrada',10,0,10,'Stock inicial',9,'Creacion de producto','2025-12-11 04:08:28'),
(173,1,177,'entrada',4,0,4,'Stock inicial',9,'Creacion de producto','2025-12-11 04:08:57'),
(174,1,5,'entrada',15,0,15,NULL,9,NULL,'2025-12-11 04:10:31'),
(175,1,8,'entrada',29,0,29,NULL,9,NULL,'2025-12-11 04:10:57'),
(176,1,6,'entrada',23,0,23,NULL,9,NULL,'2025-12-11 04:11:22'),
(177,1,7,'entrada',15,0,15,NULL,9,NULL,'2025-12-11 04:11:58'),
(178,1,5,'salida',11,15,4,NULL,9,NULL,'2025-12-11 04:12:42'),
(179,4,141,'salida',1,13,12,'Venta B0200000000008',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:22:34'),
(180,4,139,'salida',1,47,46,'Venta B0200000000008',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:22:34'),
(181,4,178,'entrada',40,0,40,'Stock inicial',12,'Creacion de producto','2025-12-11 04:32:14'),
(182,4,178,'salida',2,40,38,'Venta B0200000000009',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:34:32'),
(183,4,178,'salida',1,38,37,'Venta B0200000000010',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:35:23'),
(184,4,178,'salida',1,37,36,'Venta B0200000000011',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:36:23'),
(185,4,143,'salida',1,49,48,'Venta B0200000000011',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:36:23'),
(186,3,22,'devolucion',1,749,750,'Anulacion venta #1',11,'No se hizo ','2025-12-11 22:04:00'),
(187,3,59,'devolucion',1,249,250,'Anulacion venta #1',11,'No se hizo ','2025-12-11 22:04:00'),
(188,1,6,'salida',8,23,15,'Venta B0200000000012',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:54:37'),
(189,1,123,'salida',1,3,2,'Venta B0200000000013',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:56:10'),
(190,1,119,'salida',2,56,54,'Venta B0200000000014',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:56:51'),
(191,1,7,'salida',2,15,13,'Venta B0200000000015',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:12:45'),
(192,1,81,'salida',1,8,7,'Venta B0200000000016',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:13:39'),
(193,1,173,'salida',3,17,14,'Venta B0200000000017',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:15:47'),
(194,1,174,'salida',2,8,6,'Venta B0200000000018',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:18:58'),
(195,3,22,'salida',1,750,749,'Venta B0200000000019',11,'Venta registrada - Comprobante Consumidor Final','2025-12-13 15:38:18'),
(196,3,22,'devolucion',1,749,750,'Anulacion venta #19',11,'No se realizó ','2025-12-13 15:40:50'),
(197,3,59,'salida',1,250,249,'Venta B0200000000020',11,'Venta registrada - Comprobante Consumidor Final','2025-12-13 16:43:49'),
(198,3,59,'devolucion',1,249,250,'Anulacion venta #20',11,'No','2025-12-13 18:18:05'),
(199,3,113,'salida',1099,1100,1,'Ajuste manual',11,'Actualizacion de producto','2025-12-13 18:19:28'),
(200,3,112,'salida',1099,1100,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:19:51'),
(201,3,111,'salida',1199,1200,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:19:57'),
(202,3,110,'salida',1199,1200,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:04'),
(203,3,108,'salida',1499,1500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:11'),
(204,3,105,'salida',1199,1200,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:17'),
(205,3,103,'salida',1199,1200,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:23'),
(206,3,101,'salida',1099,1100,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:30'),
(207,3,99,'salida',1099,1100,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:20:55'),
(208,3,95,'salida',1099,1100,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:21:00'),
(209,3,93,'salida',999,1000,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:21:16'),
(210,3,79,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:21:37'),
(211,3,78,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:21:46'),
(212,3,77,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:21:54'),
(213,3,76,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:01'),
(214,3,75,'salida',449,450,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:07'),
(215,3,74,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:14'),
(216,3,73,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:20'),
(217,3,72,'salida',324,325,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:25'),
(218,3,71,'salida',299,300,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:31'),
(219,3,70,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:22:55'),
(220,3,69,'salida',324,325,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:03'),
(221,3,68,'salida',299,300,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:08'),
(222,3,67,'salida',299,300,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:14'),
(223,3,66,'salida',299,300,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:22'),
(224,3,65,'salida',299,300,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:28'),
(225,3,64,'salida',24,25,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:34'),
(226,3,63,'salida',29,30,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:41'),
(227,3,62,'salida',74,75,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:47'),
(228,3,61,'salida',249,250,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:23:53'),
(229,3,60,'salida',999,1000,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:13'),
(230,3,59,'salida',249,250,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:19'),
(231,3,58,'salida',999,1000,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:24'),
(232,3,57,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:32'),
(233,3,56,'salida',999,1000,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:40'),
(234,3,55,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:45'),
(235,3,54,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:50'),
(236,3,53,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:24:56'),
(237,3,52,'salida',849,850,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:02'),
(238,3,51,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:07'),
(239,3,50,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:16'),
(240,3,49,'salida',549,550,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:21'),
(241,3,48,'salida',499,500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:25'),
(242,3,47,'salida',549,550,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:32'),
(243,3,46,'salida',499,500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:37'),
(244,3,45,'salida',499,500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:45'),
(245,3,44,'salida',499,500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:25:51'),
(246,3,43,'salida',499,500,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:01'),
(247,3,42,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:06'),
(248,3,41,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:11'),
(249,3,38,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:19'),
(250,3,40,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:27'),
(251,3,39,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:33'),
(252,3,37,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:38'),
(253,3,36,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:47'),
(254,3,35,'salida',799,800,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:26:53'),
(255,3,34,'salida',799,800,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:03'),
(256,3,33,'salida',799,800,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:13'),
(257,3,32,'salida',749,750,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:19'),
(258,3,31,'salida',749,750,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:24'),
(259,3,24,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:36'),
(260,3,21,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:44'),
(261,3,22,'salida',749,750,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:50'),
(262,3,23,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:27:55'),
(263,3,25,'salida',749,750,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:02'),
(264,3,26,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:08'),
(265,3,27,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:21'),
(266,3,28,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:28'),
(267,3,29,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:40'),
(268,3,30,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:46'),
(269,3,11,'salida',649,650,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:28:55'),
(270,3,12,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:01'),
(271,3,13,'salida',349,350,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:07'),
(272,3,14,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:12'),
(273,3,15,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:18'),
(274,3,16,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:22'),
(275,3,17,'salida',1199,1200,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:28'),
(276,3,18,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:33'),
(277,3,19,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:38'),
(278,3,20,'entrada',1,0,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:43'),
(279,3,3,'salida',949,950,1,'Ajuste manual',11,'Ajuste de stock desde panel de productos','2025-12-13 18:29:55'),
(280,1,127,'salida',1,2,1,'Venta B0200000000021',5,'Venta registrada - Comprobante Consumidor Final','2025-12-14 01:12:37'),
(281,1,179,'entrada',500,0,500,'Stock inicial',5,'Creacion de producto','2025-12-14 01:15:57'),
(282,5,181,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 02:13:42'),
(283,5,182,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 02:15:26'),
(284,5,183,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 02:16:26'),
(285,5,184,'entrada',5,0,5,'Stock inicial',13,'Creacion de producto','2025-12-14 02:17:49'),
(286,5,185,'entrada',5,0,5,'Stock inicial',13,'Creacion de producto','2025-12-14 02:18:31'),
(287,5,186,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 04:12:34'),
(288,5,187,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 04:14:09'),
(289,5,188,'entrada',25,0,25,'Stock inicial',13,'Creacion de producto','2025-12-14 04:15:40'),
(290,5,189,'entrada',25,0,25,'Stock inicial',13,'Creacion de producto','2025-12-14 04:16:26'),
(291,5,190,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-14 04:17:13'),
(292,5,191,'entrada',1000,0,1000,'Stock inicial',13,'Creacion de producto','2025-12-14 04:18:34'),
(293,5,192,'entrada',24,0,24,'Stock inicial',13,'Creacion de producto','2025-12-14 04:19:14'),
(294,5,193,'entrada',3,0,3,'Stock inicial',13,'Creacion de producto','2025-12-14 04:20:13'),
(295,5,194,'entrada',4,0,4,'Stock inicial',13,'Creacion de producto','2025-12-14 04:20:56'),
(296,5,195,'entrada',100,0,100,'Stock inicial',13,'Creacion de producto','2025-12-14 04:22:05'),
(297,15,196,'entrada',123,0,123,'Stock inicial',25,'Creacion de producto','2025-12-14 17:44:50'),
(298,15,196,'salida',1,123,122,'Venta B0200000000022',25,'Venta registrada - Comprobante Consumidor Final','2025-12-14 17:45:20'),
(299,15,197,'entrada',123,0,123,'Stock inicial',25,'Creacion de producto','2025-12-14 18:30:14'),
(300,15,196,'devolucion',1,122,123,'Anulacion venta #22',25,'asd','2025-12-14 18:32:00'),
(301,2,2,'salida',3,100,97,'Venta B0200000000023',10,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:08:07'),
(302,1,179,'salida',1,500,499,'Venta B0200000000024',5,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:11:50'),
(303,15,197,'salida',1,123,122,'Venta B0200000000025',25,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:18:10'),
(304,5,180,'entrada',5,0,5,NULL,13,NULL,'2025-12-15 01:38:51'),
(305,2,2,'salida',1,97,96,'Venta B0200000000026',10,'Venta registrada - Comprobante Consumidor Final','2025-12-15 19:09:54'),
(306,16,198,'entrada',200,0,200,'Stock inicial',26,'Creacion de producto','2025-12-15 20:19:17'),
(307,16,198,'salida',2,200,198,'Venta B0200000000027',26,'Venta registrada - Comprobante Consumidor Final','2025-12-15 20:27:27'),
(308,2,199,'entrada',25,0,25,'Stock inicial',10,'Creacion de producto','2025-12-16 12:05:17');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modulo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `clave` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_modulo` (`modulo`),
  KEY `idx_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES
(1,'generico','Acceso al dashboard','dashboard.view','Ver dashboard principal',1,'2025-12-09 22:53:23'),
(2,'reportes','Ver reportes','reportes.view','Acceso a módulo de reportes',1,'2025-12-09 22:53:23'),
(3,'reportes','Exportar reportes','reportes.export','Exportar reportes a PDF/Excel',1,'2025-12-09 22:53:23'),
(4,'configuracion','Ver configuración','configuracion.view','Acceso a configuración',1,'2025-12-09 22:53:23'),
(5,'configuracion','Editar configuración','configuracion.edit','Modificar configuración',1,'2025-12-09 22:53:23'),
(6,'ventas','Ver ventas','ventas.view','Ver listado de ventas',1,'2025-12-09 22:53:23'),
(7,'ventas','Crear ventas','ventas.create','Realizar nuevas ventas',1,'2025-12-09 22:53:23'),
(8,'ventas','Editar ventas','ventas.edit','Modificar ventas',1,'2025-12-09 22:53:23'),
(9,'ventas','Anular ventas','ventas.delete','Anular ventas',1,'2025-12-09 22:53:23'),
(10,'clientes','Ver clientes','clientes.view','Ver listado de clientes',1,'2025-12-09 22:53:23'),
(11,'clientes','Crear clientes','clientes.create','Registrar nuevos clientes',1,'2025-12-09 22:53:23'),
(12,'clientes','Editar clientes','clientes.edit','Modificar datos de clientes',1,'2025-12-09 22:53:23'),
(13,'clientes','Eliminar clientes','clientes.delete','Eliminar clientes',1,'2025-12-09 22:53:23'),
(14,'productos','Ver productos','productos.view','Ver listado de productos',1,'2025-12-09 22:53:23'),
(15,'productos','Crear productos','productos.create','Registrar nuevos productos',1,'2025-12-09 22:53:23'),
(16,'productos','Editar productos','productos.edit','Modificar productos',1,'2025-12-09 22:53:23'),
(17,'productos','Eliminar productos','productos.delete','Eliminar productos',1,'2025-12-09 22:53:23'),
(18,'inventario','Ver inventario','inventario.view','Ver inventario',1,'2025-12-09 22:53:23'),
(19,'inventario','Ajustar inventario','inventario.adjust','Realizar ajustes de inventario',1,'2025-12-09 22:53:23'),
(20,'caja','Abrir caja','caja.open','Abrir caja',1,'2025-12-09 22:53:23'),
(21,'caja','Cerrar caja','caja.close','Cerrar caja',1,'2025-12-09 22:53:23'),
(22,'caja','Ver movimientos caja','caja.view','Ver movimientos de caja',1,'2025-12-09 22:53:23'),
(23,'compras','Ver compras','compras.view','Ver listado de compras',1,'2025-12-09 22:53:23'),
(24,'compras','Crear compras','compras.create','Registrar nuevas compras',1,'2025-12-09 22:53:23'),
(25,'proveedores','Ver proveedores','proveedores.view','Ver listado de proveedores',1,'2025-12-09 22:53:23'),
(26,'proveedores','Crear proveedores','proveedores.create','Registrar nuevos proveedores',1,'2025-12-09 22:53:23');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `marca_id` int(11) DEFAULT NULL,
  `unidad_medida_id` int(11) DEFAULT NULL,
  `precio_compra` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `precio_oferta` decimal(10,2) DEFAULT NULL,
  `precio_mayorista` decimal(10,2) DEFAULT NULL,
  `cantidad_mayorista` int(11) DEFAULT 6,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 5,
  `stock_maximo` int(11) DEFAULT 100,
  `imagen_url` varchar(255) DEFAULT NULL,
  `aplica_itbis` tinyint(1) DEFAULT 1,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_vencimiento` date DEFAULT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `ubicacion_bodega` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `unidad_medida_id` (`unidad_medida_id`),
  KEY `idx_codigo_barras` (`codigo_barras`),
  KEY `idx_sku` (`sku`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_categoria` (`categoria_id`),
  KEY `idx_marca` (`marca_id`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `productos_ibfk_3` FOREIGN KEY (`marca_id`) REFERENCES `marcas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `productos_ibfk_4` FOREIGN KEY (`unidad_medida_id`) REFERENCES `unidades_medida` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES
(2,2,'7330042999392','REFR-30042998-4803','Refresco','Coca-Cola',2,NULL,2,20.00,30.00,25.00,25.00,6,96,5,100,NULL,1,1,NULL,'LT-20251210-033793955',NULL,'2025-12-10 01:28:43','2025-12-15 19:09:54'),
(3,3,'7330128282910','SUPR-30128282-0808','Pizza Suprema de 12 pedazo',NULL,4,NULL,1,950.00,950.00,950.00,950.00,950,1,950,950,NULL,0,1,NULL,'LT-20251210-041644493',NULL,'2025-12-10 01:29:52','2025-12-13 18:29:55'),
(4,2,'7331753556554','CON-31753556-0647','Refresco','Uva Kola Real',2,NULL,2,20.00,30.00,25.00,25.00,6,100,5,100,NULL,1,1,'2025-12-09','LT-20251210-751200751',NULL,'2025-12-10 02:01:12','2025-12-10 02:01:12'),
(5,1,'7396483788625','PRE-96483786-8319','Presidente','Regular mediana',NULL,NULL,NULL,151.00,180.00,NULL,NULL,6,4,5,100,NULL,0,1,NULL,'LT-20251210-446854868',NULL,'2025-12-10 19:56:03','2025-12-11 14:38:21'),
(6,1,'7396572258717','BHA-96572258-9583','Bhama','Mediana',NULL,NULL,NULL,134.00,160.00,NULL,NULL,6,15,5,100,NULL,0,1,NULL,'LT-20251210-569084376',NULL,'2025-12-10 19:56:39','2025-12-11 22:54:37'),
(7,1,'7396606712064','BHAM-96606711-7959','Bhama','Pequeña',NULL,NULL,NULL,89.00,110.00,NULL,NULL,6,13,5,100,NULL,0,1,NULL,'LT-20251210-604304028',NULL,'2025-12-10 19:57:05','2025-12-11 23:12:45'),
(8,1,'7396631050914','PRE-96631050-9216','Presidente','Regular pequeña',NULL,NULL,NULL,100.00,125.00,NULL,NULL,6,29,5,100,NULL,0,1,NULL,'LT-20251210-629399587',NULL,'2025-12-10 19:57:56','2025-12-11 14:37:29'),
(9,1,'7396729572935','AGU-96729571-1223','Agua planeta azul',NULL,NULL,NULL,NULL,10.00,15.00,NULL,NULL,6,1,5,100,NULL,0,1,NULL,'LT-20251210-714116134',NULL,'2025-12-10 19:59:12','2025-12-11 14:37:10'),
(10,1,'7396850493858','AGU-96850492-0541','Agua cool heave',NULL,NULL,NULL,NULL,7.00,15.00,NULL,NULL,6,0,5,100,NULL,0,1,NULL,'LT-20251210-848719548',NULL,'2025-12-10 20:01:12','2025-12-11 14:36:58'),
(11,3,'7403286415101','PIZZ-03286414-8700','Pizza suprema de 8 pedazo','Suprema',4,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-272931876',NULL,'2025-12-10 21:49:18','2025-12-13 18:28:55'),
(12,3,'7404416261200','PIZZ-04416261-5081','Pizza suprema de 4 pedazo',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,350,350,NULL,0,1,NULL,'LT-20251210-411350650',NULL,'2025-12-10 22:08:57','2025-12-13 18:29:01'),
(13,3,'7404645907125','CARZ-04645907-3764','Calzón supremo','Calzón supremo',NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,350,350,NULL,0,1,NULL,'LT-20251210-572173528',NULL,'2025-12-10 22:14:02','2025-12-13 18:29:07'),
(14,3,'7404791831166','PIZZ-04791830-3290','Pizza 4 pedazos jamon',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-748663238',NULL,'2025-12-10 22:14:16','2025-12-13 18:29:12'),
(15,3,'7404868827269','PIZZ-04868826-8461','Pizza 4 pedazos maíz',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-864046755',NULL,'2025-12-10 22:15:09','2025-12-13 18:29:18'),
(16,3,'7404921964197','PIZZ-04921963-6045','Pizza de 4 pedazos peperonni',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-918520762',NULL,'2025-12-10 22:16:01','2025-12-13 18:29:22'),
(17,3,'7404926033004','MET-04926033-3357','Metro pizza suprema 16 pedazos','Metro pizza suprema 16 pedazos',NULL,NULL,NULL,1200.00,1200.00,1200.00,1200.00,1200,1,1200,1200,NULL,0,1,NULL,'LT-20251210-922287877',NULL,'2025-12-10 22:16:37','2025-12-13 18:29:28'),
(18,3,'7404970432323','PIZ-04970432-0475','Pizza de 4 pedazos mega queso',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-965193658',NULL,'2025-12-10 22:16:45','2025-12-13 18:29:33'),
(19,3,'7405020045550','PIZ-05020044-1896','Pizza 4 pedazos boloñesa',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-017255657',NULL,'2025-12-10 22:17:32','2025-12-13 18:29:38'),
(20,3,'7405074972022','PIZZ-05074971-6854','Pizza de 4 pedazos tocineta',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-056946066',NULL,'2025-12-10 22:18:35','2025-12-13 18:29:43'),
(21,3,'7405122996953','PIZZ-05122996-7759','Pizza de 4 pedazos pollo',NULL,NULL,NULL,NULL,325.00,325.00,325.00,325.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-119935600',NULL,'2025-12-10 22:20:15','2025-12-13 18:27:44'),
(22,3,'7405054697384','PIZZ-05054697-8882','Pizza de 12 pedazos de jamón','Pizza de 12 pedazos de jamón',NULL,NULL,1,750.00,750.00,750.00,750.00,750,1,750,750,NULL,0,1,NULL,'LT-20251210-041069694',NULL,'2025-12-10 22:21:02','2025-12-13 18:27:50'),
(23,3,'7405225691071','PIZZ-05225691-5077','Pizza de 4 pedazos Suprema pollo',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,350,350,NULL,0,1,NULL,'LT-20251210-221585840',NULL,'2025-12-10 22:21:08','2025-12-13 18:27:55'),
(24,3,'7405295285154','PD4-05295284-7554','Pizza de 4 pedazos Pollo a la crema',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-285220367',NULL,'2025-12-10 22:22:03','2025-12-13 18:27:36'),
(25,3,'7405273104812','PD1-05273103-6492','Pizza de 12 pedazos de maiz','Pizza de 12 pedazos de maíz',NULL,NULL,1,750.00,750.00,750.00,750.00,750,1,750,750,NULL,0,1,NULL,'LT-20251210-269092455',NULL,'2025-12-10 22:22:20','2025-12-13 18:28:02'),
(26,3,'7405330855935','PD4-05330855-2270','Pizza de 4 pedazos Camarones a la crema',NULL,NULL,NULL,NULL,450.00,450.00,450.00,450.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-327804552',NULL,'2025-12-10 22:22:48','2025-12-13 18:28:08'),
(27,3,'7405440545060','PD4-05440544-1668','Pizza de 4 pedazos Napoliana',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-372325558',NULL,'2025-12-10 22:24:50','2025-12-13 18:28:21'),
(28,3,'7405533218898','PIZZ-05533218-3565','Pizza 4 pedazos vegetales',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-528120380',NULL,'2025-12-10 22:26:18','2025-12-13 18:28:28'),
(29,3,'7405591934681','P4P-05591933-5201','Pizza 4 pedazos Especial carne',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-583613343',NULL,'2025-12-10 22:27:21','2025-12-13 18:28:40'),
(30,3,'7405654845041','P4P-05654845-2052','Pizza 4 pedazos Hawaina',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-650491604',NULL,'2025-12-10 22:28:12','2025-12-13 18:28:46'),
(31,3,'7405777386595','PIZ-05777386-0710','Pizza de 12 pedazos peperonni',NULL,NULL,NULL,NULL,750.00,750.00,750.00,750.00,750,1,5,100,NULL,0,1,NULL,'LT-20251210-774720145',NULL,'2025-12-10 22:31:03','2025-12-13 18:27:24'),
(32,3,'7405869754692','PD1-05869753-0771','Pizza de 12 pedazos Mega queso',NULL,NULL,NULL,NULL,750.00,750.00,750.00,750.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-867565066',NULL,'2025-12-10 22:32:11','2025-12-13 18:27:19'),
(33,3,'7405939495710','PD1-05939494-8740','Pizza de 12 pedazos Boloñesa',NULL,NULL,NULL,NULL,800.00,800.00,800.00,800.00,800,1,5,100,NULL,0,1,NULL,'LT-20251210-937129406',NULL,'2025-12-10 22:33:01','2025-12-13 18:27:13'),
(34,3,'7405986566461','PD1-05986566-0483','Pizza de 12 pedazos Tocineta',NULL,NULL,NULL,NULL,800.00,800.00,800.00,800.00,800,1,5,100,NULL,0,1,NULL,'LT-20251210-984307613',NULL,'2025-12-10 22:33:51','2025-12-13 18:27:03'),
(35,3,'7406036114231','PD1-06036114-2453','Pizza de 12 pedazos Pollo',NULL,NULL,NULL,NULL,800.00,800.00,800.00,800.00,800,1,5,100,NULL,0,1,NULL,'LT-20251210-033891190',NULL,'2025-12-10 22:34:17','2025-12-13 18:26:53'),
(36,3,'7406062990464','PD1-06062990-2012','Pizza de 12 pedazos Suprema pollo',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,950,1,5,100,NULL,0,1,NULL,'LT-20251210-059686179',NULL,'2025-12-10 22:35:19','2025-12-13 18:26:47'),
(37,3,'7406123915425','PD1-06123914-7799','Pizza de 12 pedazos Pollo a la crema',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,950,1,5,100,NULL,0,1,NULL,'LT-20251210-121960496',NULL,'2025-12-10 22:35:58','2025-12-13 18:26:38'),
(38,3,'7406165013532','PD1-06165013-0684','Pizza de 12 pedazos Camarones a la crema',NULL,NULL,NULL,NULL,1.20,1.20,1.20,1.20,6,1,5,100,NULL,0,1,NULL,'LT-20251210-161268437',NULL,'2025-12-10 22:38:42','2025-12-13 18:26:19'),
(39,3,'7406329147046','PD1-06329146-8887','Pizza de 12 pedazos Napolitana',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,950,1,5,100,NULL,0,1,NULL,'LT-20251210-326642379',NULL,'2025-12-10 22:40:57','2025-12-13 18:26:33'),
(40,3,'7406464492299','PD1-06464492-0938','Pizza de 12 pedazos Vegetales',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,6,1,5,100,NULL,0,1,NULL,'LT-20251210-462312311',NULL,'2025-12-10 22:41:59','2025-12-13 18:26:27'),
(41,3,'7406524459800','PD1-06524457-1133','Pizza de 12 pedazos Especial carne',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,950,1,5,100,NULL,0,1,NULL,'LT-20251210-522385195',NULL,'2025-12-10 22:42:51','2025-12-13 18:26:11'),
(42,3,'7406577189166','PD1-06577189-7141','Pizza de 12 pedazos Hawaiana',NULL,NULL,NULL,NULL,950.00,950.00,950.00,950.00,950,1,5,100,NULL,0,1,NULL,'LT-20251210-574568770',NULL,'2025-12-10 22:43:34','2025-12-13 18:26:06'),
(43,3,'7406736531790','PIZZ-06736531-2066','Pizza de 8 pedazos jamón',NULL,NULL,NULL,NULL,500.00,500.00,500.00,500.00,500,1,5,100,NULL,0,1,NULL,'LT-20251210-732224556',NULL,'2025-12-10 22:46:11','2025-12-13 18:26:01'),
(44,3,'7406782562583','PD8-06782562-7142','Pizza de 8 pedazos Maíz',NULL,NULL,NULL,NULL,500.00,500.00,500.00,500.00,500,1,5,100,NULL,0,1,NULL,'LT-20251210-780266068',NULL,'2025-12-10 22:46:49','2025-12-13 18:25:51'),
(45,3,'7406815182279','PD8-06815182-3866','Pizza de 8 pedazos  Peperonni',NULL,NULL,NULL,NULL,500.00,500.00,500.00,500.00,500,1,5,100,NULL,1,1,NULL,'LT-20251210-812035942',NULL,'2025-12-10 22:47:16','2025-12-13 18:25:45'),
(46,3,'7406841760804','PD8-06841759-0364','Pizza de 8 pedazos  Mega queso',NULL,NULL,NULL,NULL,500.00,500.00,500.00,500.00,500,1,5,100,NULL,0,1,NULL,'LT-20251210-840008328',NULL,'2025-12-10 22:47:55','2025-12-13 18:25:37'),
(47,3,'7406881083854','PD8-06881083-6374','Pizza de 8 pedazos Boloñesa',NULL,NULL,NULL,NULL,550.00,550.00,550.00,550.00,550,1,5,100,NULL,0,1,NULL,'LT-20251210-879092144',NULL,'2025-12-10 22:48:31','2025-12-13 18:25:32'),
(48,3,'7406920943853','PD8-06920943-4696','Pizza de 8 pedazos  Tocineta',NULL,NULL,NULL,NULL,500.00,500.00,500.00,500.00,500,1,5,100,NULL,0,1,NULL,'LT-20251210-918829686',NULL,'2025-12-10 22:49:03','2025-12-13 18:25:25'),
(49,3,'7406952127188','PD8-06952127-3994','Pizza de 8 pedazos Pollo',NULL,NULL,NULL,NULL,550.00,550.00,550.00,550.00,500,1,5,100,NULL,0,1,NULL,'LT-20251210-946496079',NULL,'2025-12-10 22:49:43','2025-12-13 18:25:21'),
(50,3,'7407012539088','PD8-07012539-6540','Pizza de 8 pedazos Suprema pollo',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-006291754',NULL,'2025-12-10 22:50:48','2025-12-13 18:25:16'),
(51,3,'7407052909542','PD8-07052909-2558','Pizza de 8 pedazos  Pollo a la crema',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-050618158',NULL,'2025-12-10 22:51:21','2025-12-13 18:25:07'),
(52,3,'7407091119751','PD8-07091119-4626','Pizza de 8 pedazos Camarones a la crema',NULL,NULL,NULL,NULL,850.00,850.00,850.00,850.00,850,1,5,100,NULL,0,1,NULL,'LT-20251210-088699880',NULL,'2025-12-10 22:52:05','2025-12-13 18:25:02'),
(53,3,'7407129904926','PD8-07129904-4714','Pizza de 8 pedazos Napolitana',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-128238172',NULL,'2025-12-10 22:52:40','2025-12-13 18:24:56'),
(54,3,'7407164434332','PD8-07164433-4838','Pizza de 8 pedazos Vegetales',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-162477016',NULL,'2025-12-10 22:53:18','2025-12-13 18:24:50'),
(55,3,'7407202787424','PD8-07202787-9703','Pizza de 8 pedazos  Especial de carne',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-200926346',NULL,'2025-12-10 22:53:54','2025-12-13 18:24:45'),
(56,3,'7407159899324','MET-07159898-5975','Metro pizza 16 pedazos de jamón','Metro pizza 16 pedazos de jamón',NULL,NULL,NULL,1000.00,1000.00,1000.00,1000.00,1000,1,1000,1000,NULL,0,1,NULL,'LT-20251210-151918126',NULL,'2025-12-10 22:54:05','2025-12-13 18:24:40'),
(57,3,'7407239517640','PD8-07239516-9635','Pizza de 8 pedazos  Hawaiana',NULL,NULL,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-237724904',NULL,'2025-12-10 22:54:19','2025-12-13 18:24:32'),
(58,3,'7407254363583','MP1-07254363-1075','Metro pizza 16 pedazos de maiz','Metro pizza 16 pedazos de maíz',NULL,NULL,NULL,1000.00,1000.00,1000.00,1000.00,1000,1,1000,1000,NULL,0,1,NULL,'LT-20251210-251408879',NULL,'2025-12-10 22:55:04','2025-12-13 18:24:24'),
(59,3,'7407281755441','BRE-07281755-4399','Breadstiks queso mozzarella y queso parmesano con sabor a ajo',NULL,NULL,NULL,NULL,250.00,250.00,250.00,250.00,250,1,5,100,NULL,0,1,NULL,'LT-20251210-278493111',NULL,'2025-12-10 22:55:50','2025-12-13 18:24:19'),
(60,3,'7407357528950','MP1-07357528-7749','Metro pizza 16 pedazos de mega queso','Metro pizza 16 pedazos de mega queso',NULL,NULL,NULL,1000.00,1000.00,1000.00,1000.00,1000,1,1000,1000,NULL,0,1,NULL,'LT-20251210-350150955',NULL,'2025-12-10 22:56:59','2025-12-13 18:24:13'),
(61,3,'7407362313674','CHEE-07362312-0083','Cheese pops bolitas de queso mozzarella Y peperonni o jamón',NULL,NULL,NULL,NULL,250.00,250.00,250.00,250.00,250,1,5,100,NULL,0,1,NULL,'LT-20251210-353341837',NULL,'2025-12-10 22:57:05','2025-12-13 18:23:53'),
(62,3,'7407446968313','REF-07446967-5809','Refresco grande 1 litro',NULL,NULL,NULL,NULL,75.00,75.00,75.00,75.00,75,1,5,100,NULL,0,1,NULL,'LT-20251210-443721721',NULL,'2025-12-10 22:58:08','2025-12-13 18:23:47'),
(63,3,'7407495842143','REF-07495841-3266','Refresco pequeño',NULL,NULL,NULL,NULL,30.00,30.00,30.00,30.00,30,1,5,100,NULL,0,1,NULL,'LT-20251210-491769103',NULL,'2025-12-10 23:00:23','2025-12-13 18:23:41'),
(64,3,'7407631626319','BOTE-07631626-6865','Botellas de agua 💦',NULL,NULL,NULL,NULL,25.00,25.00,25.00,25.00,25,1,5,100,NULL,0,1,NULL,'LT-20251210-626425629',NULL,'2025-12-10 23:00:59','2025-12-13 18:23:34'),
(65,3,'7407860377719','CAL-07860377-8981','Calzones jamón',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,300,1,5,100,NULL,0,1,NULL,'LT-20251210-848512202',NULL,'2025-12-10 23:05:51','2025-12-13 18:23:28'),
(66,3,'7407956321584','CALZ-07956320-4671','Calzones Maíz',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,300,1,5,100,NULL,0,1,NULL,'LT-20251210-953905320',NULL,'2025-12-10 23:06:18','2025-12-13 18:23:22'),
(67,3,'7407983177744','CALZ-07983176-3560','Calzones Peperonni',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,300,1,5,100,NULL,0,1,NULL,'LT-20251210-981331171',NULL,'2025-12-10 23:06:48','2025-12-13 18:23:14'),
(68,3,'7408013479701','CALZ-08013479-9552','Calzones Mega queso',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,300,1,5,100,NULL,0,1,NULL,'LT-20251210-011649366',NULL,'2025-12-10 23:07:19','2025-12-13 18:23:08'),
(69,3,'7408044578453','CALZ-08044577-0571','Calzones Boloñesa',NULL,NULL,NULL,NULL,325.00,325.00,325.00,325.00,325,1,5,100,NULL,0,1,NULL,'LT-20251210-042282854',NULL,'2025-12-10 23:07:57','2025-12-13 18:23:03'),
(70,3,'7408084695253','CALZ-08084694-8860','Calzones  Tocineta',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,6,1,5,100,NULL,1,1,NULL,'LT-20251210-080433618',NULL,'2025-12-10 23:08:25','2025-12-13 18:22:55'),
(71,3,'7408113346775','CALZ-08113345-3983','Calzones Tocineta',NULL,NULL,NULL,NULL,300.00,300.00,300.00,300.00,300,1,5,100,NULL,0,1,NULL,'LT-20251210-111474349',NULL,'2025-12-10 23:08:57','2025-12-13 18:22:31'),
(72,3,'7408147858923','CALZ-08147858-1366','Calzones Pollo',NULL,NULL,NULL,NULL,325.00,325.00,325.00,325.00,325,1,5,100,NULL,0,1,NULL,'LT-20251210-139644380',NULL,'2025-12-10 23:09:48','2025-12-13 18:22:25'),
(73,3,'7408193769613','CALZ-08193769-4967','Calzones Suprema pollo',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-191569565',NULL,'2025-12-10 23:10:30','2025-12-13 18:22:20'),
(74,3,'7408236456350','CALZ-08236456-6134','Calzones Pollo a la crema',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-233576218',NULL,'2025-12-10 23:11:09','2025-12-13 18:22:14'),
(75,3,'7408274271246','CALZ-08274271-2223','Calzones Camarones a la crema',NULL,NULL,NULL,NULL,450.00,450.00,450.00,450.00,450,1,5,100,NULL,1,1,NULL,'LT-20251210-272094625',NULL,'2025-12-10 23:11:42','2025-12-13 18:22:07'),
(76,3,'7408316261233','CALZ-08316261-7828','Calzones Especial carne',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-314152145',NULL,'2025-12-10 23:12:28','2025-12-13 18:22:01'),
(77,3,'7408354908397','CALZ-08354907-4776','Calzones Napolitana',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-353040693',NULL,'2025-12-10 23:13:05','2025-12-13 18:21:54'),
(78,3,'7408391119741','CALZ-08391118-2525','Calzones Vegetales',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-388892592',NULL,'2025-12-10 23:13:37','2025-12-13 18:21:46'),
(79,3,'7408423566498','CALZ-08423566-8924','Calzones Hawaiana',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,5,100,NULL,0,1,NULL,'LT-20251210-420259491',NULL,'2025-12-10 23:14:15','2025-12-13 18:21:37'),
(80,1,'7409573800679','BRU-09573799-6232','Brugal blanco 350 ml',NULL,NULL,NULL,NULL,270.00,350.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251210-571191161',NULL,'2025-12-10 23:33:38','2025-12-11 14:28:50'),
(81,1,'7409635524048','MAC-09635524-6104','Mack Albert 350 ml',NULL,NULL,NULL,NULL,290.00,350.00,NULL,NULL,6,7,1,100,NULL,0,1,NULL,'LT-20251210-628713087',NULL,'2025-12-10 23:35:00','2025-12-11 23:13:39'),
(82,1,'7409708853697','BRU-09708853-4183','Brugal Xv 350 ml',NULL,NULL,NULL,NULL,300.00,400.00,NULL,NULL,6,11,1,100,NULL,0,1,NULL,'LT-20251210-704425520',NULL,'2025-12-10 23:36:14','2025-12-11 14:28:16'),
(83,1,'7409803053017','BRU-09803053-7688','Brugal Xv 700 ml',NULL,NULL,NULL,NULL,575.00,725.00,NULL,NULL,6,11,1,100,NULL,0,1,NULL,'LT-20251210-785517812',NULL,'2025-12-10 23:37:21','2025-12-11 14:27:47'),
(84,1,'7409863301070','BRU-09863300-2001','Brugal extra viejo 350 ml',NULL,NULL,NULL,NULL,295.00,375.00,NULL,NULL,6,2,5,100,NULL,0,1,NULL,'LT-20251210-855646363',NULL,'2025-12-10 23:38:24','2025-12-11 14:27:30'),
(85,1,'7410189322911','BRY-10189321-8760','Brugal añejo 350 ml',NULL,NULL,NULL,NULL,260.00,350.00,NULL,NULL,6,2,5,100,NULL,0,1,NULL,'LT-20251210-187254967',NULL,'2025-12-10 23:43:35','2025-12-11 14:27:13'),
(86,1,'7410230078321','ALE-10230078-9887','Aloe Vera grande',NULL,NULL,NULL,NULL,140.00,200.00,NULL,NULL,6,1,5,100,NULL,0,1,NULL,'LT-20251210-220206045',NULL,'2025-12-10 23:44:19','2025-12-11 14:26:58'),
(87,1,'7410271537277','AGUA-10271536-3164','Agua Enriquillo 800 ml',NULL,NULL,NULL,NULL,30.00,60.00,NULL,NULL,6,5,5,100,NULL,0,1,NULL,'LT-20251210-263710697',NULL,'2025-12-10 23:45:10','2025-12-11 14:24:44'),
(88,1,'7410345976596','MAC-10345975-3141','Mack Albert 700 ml',NULL,NULL,NULL,NULL,450.00,650.00,NULL,NULL,6,3,5,100,NULL,0,1,NULL,'LT-20251210-340430164',NULL,'2025-12-10 23:46:23','2025-12-11 14:24:29'),
(89,1,'7410393135662','FIR-10393135-5332','Fireball 750 ml',NULL,NULL,NULL,NULL,575.00,700.00,NULL,NULL,6,3,5,100,NULL,0,1,NULL,'LT-20251210-387443026',NULL,'2025-12-10 23:47:03','2025-12-11 14:24:12'),
(90,1,'7410435941830','COL-10435940-4318','ROM columbo 700 ml',NULL,NULL,NULL,NULL,375.00,500.00,NULL,NULL,6,3,5,100,NULL,0,1,NULL,'LT-20251210-428276926',NULL,'2025-12-10 23:48:08','2025-12-11 14:23:53'),
(91,1,'7410505630836','VINO-10505629-8527','Vino campeón 700 ml',NULL,NULL,NULL,NULL,160.00,225.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251210-497293700',NULL,'2025-12-10 23:49:08','2025-12-11 14:23:39'),
(92,1,'7410562155471','VINO-10562153-4747','Vino la fuerza 700 ml',NULL,NULL,NULL,NULL,270.00,225.00,NULL,NULL,6,7,1,100,NULL,0,1,NULL,'LT-20251210-556375353',NULL,'2025-12-10 23:49:49','2025-12-11 14:23:11'),
(93,3,'7410651786093','MP1-10651786-1206','Metro pizza 16 pedazos de pepperoni','Metro pizza 16 pedazos de pepperoni',NULL,NULL,1,1000.00,1000.00,1000.00,1000.00,1000,1,1000,1000,NULL,0,1,NULL,'LT-20251210-622599238',NULL,'2025-12-10 23:51:53','2025-12-13 18:21:16'),
(94,1,'7410609135703','ROM-10609135-4976','ROM Bermúdez 350 ml',NULL,NULL,NULL,NULL,180.00,250.00,NULL,NULL,6,6,1,100,NULL,0,1,NULL,'LT-20251210-596895640',NULL,'2025-12-10 23:52:22','2025-12-11 14:22:51'),
(95,3,'7410733669270','MP1-10733669-3935','Metro pizza 16 pedazos de Boloñesa','Metro pizza 16 pedazos de Boloñesa',NULL,NULL,1,1100.00,1100.00,1100.00,1100.00,1100,1,1100,1100,NULL,0,1,NULL,'LT-20251210-730339831',NULL,'2025-12-10 23:55:11','2025-12-13 18:21:00'),
(96,1,'7410774024709','CART-10774024-5405','Carta 2 dorada 350 ml',NULL,NULL,NULL,NULL,180.00,225.00,NULL,NULL,6,6,1,100,NULL,0,1,NULL,'LT-20251210-760048624',NULL,'2025-12-10 23:56:04','2025-12-11 14:22:35'),
(97,1,'7410990059640','CAR-10990059-7680','Carta 2 blanca 350 ml',NULL,NULL,NULL,NULL,180.00,225.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251210-983496499',NULL,'2025-12-10 23:57:14','2025-12-11 14:22:19'),
(98,1,'7411081361334','CORO-11081353-8902','Corona cero',NULL,NULL,NULL,NULL,100.00,125.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251210-075662335',NULL,'2025-12-10 23:58:19','2025-12-11 14:21:01'),
(99,3,'7411045274647','MP1-11045274-6102','Metro pizza 16 pedazos de tocineta','Metro pizza 16 pedazos de tocineta',NULL,NULL,1,1100.00,1100.00,1100.00,1100.00,1100,1,1100,1100,NULL,0,1,NULL,'LT-20251210-037125925',NULL,'2025-12-10 23:58:53','2025-12-13 18:20:55'),
(100,1,'7411121312151','AGU-11121312-5650','Agua salutari 355 ml',NULL,NULL,NULL,NULL,25.00,40.00,NULL,NULL,6,9,1,100,NULL,0,1,NULL,'LT-20251210-116732552',NULL,'2025-12-10 23:59:19','2025-12-11 14:20:45'),
(101,3,'7411143110172','MP1-11143109-0056','Metro pizza 16 pedazos de pollo','Metro pizza 16 pedazos de pollo',NULL,NULL,1,1100.00,1100.00,1100.00,1100.00,1100,1,1100,1100,NULL,0,1,NULL,'LT-20251210-140135084',NULL,'2025-12-11 00:00:01','2025-12-13 18:20:30'),
(102,1,'7411218732891','CER-11218727-7071','Cerveza bambo',NULL,NULL,NULL,NULL,85.00,100.00,NULL,NULL,6,9,1,100,NULL,0,1,NULL,'LT-20251210-166287242',NULL,'2025-12-11 00:00:53','2025-12-11 14:20:30'),
(103,3,'7411224640252','MP1-11224638-7383','Metro pizza 16 pedazos suprema de pollo','Metro pizza 16 pedazos suprema de pollo',NULL,NULL,1,1200.00,1200.00,1200.00,1200.00,1200,1,1200,1200,NULL,0,1,NULL,'LT-20251211-215965645',NULL,'2025-12-11 00:01:47','2025-12-13 18:20:23'),
(104,1,'7411293175772','SID-11293174-8303','Sidra mayu',NULL,NULL,NULL,NULL,180.00,225.00,NULL,NULL,6,6,1,100,NULL,0,1,NULL,'LT-20251211-259068199',NULL,'2025-12-11 00:02:03','2025-12-11 14:20:15'),
(105,3,'7411316562533','MP1-11316561-9802','Metro pizza 16 pedazos pollo a la crema','Metro pizza 16 pedazos pollo a la crema',NULL,NULL,1,1200.00,1200.00,1200.00,1200.00,1200,1,1200,1200,NULL,0,1,NULL,'LT-20251211-314560838',NULL,'2025-12-11 00:02:44','2025-12-13 18:20:17'),
(106,1,'7411333158597','GRA-11333158-6273','Gramberry 946 ml',NULL,NULL,NULL,NULL,140.00,200.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251211-331068302',NULL,'2025-12-11 00:03:15','2025-12-11 14:20:00'),
(107,1,'7411405413189','VIN-11405413-1461','Vino campeón 1800 ml',NULL,NULL,NULL,NULL,475.00,650.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-403945132',NULL,'2025-12-11 00:04:11','2025-12-11 14:19:44'),
(108,3,'7411427901734','MP1-11427900-6545','Metro pizza 16 pedazos camarones a la crema','Metro pizza 16 pedazos camarones a la crema',NULL,NULL,1,1500.00,1500.00,1500.00,1500.00,1500,1,1500,1500,NULL,0,1,NULL,'LT-20251211-425624621',NULL,'2025-12-11 00:04:54','2025-12-13 18:20:11'),
(109,1,'7411474255227','BRU-11474255-7111','Brugal extra viejo 700 ml',NULL,NULL,NULL,NULL,575.00,700.00,NULL,NULL,6,11,1,100,NULL,0,1,NULL,'LT-20251211-471245744',NULL,'2025-12-11 00:05:13','2025-12-11 14:18:51'),
(110,3,'7411547105381','MP1-11547104-9849','Metro pizza 16 pedazos especial de carne','Metro pizza 16 pedazos especial de carne',NULL,NULL,1,1200.00,1200.00,1200.00,1200.00,1200,1,1200,1200,NULL,0,1,NULL,'LT-20251211-500590650',NULL,'2025-12-11 00:09:12','2025-12-13 18:20:04'),
(111,3,'7411771586063','MP1-11771585-6035','Metro pizza 16 pedazos vegetales','Metro pizza 16 pedazos vegetales',NULL,NULL,1,1200.00,1200.00,1200.00,1200.00,1200,1,1200,1200,NULL,0,1,NULL,'LT-20251211-767214883',NULL,'2025-12-11 00:11:22','2025-12-13 18:19:57'),
(112,3,'7411891468215','MP1-11891468-8933','Metro pizza 16 pedazos hawaiana','Metro pizza 16 pedazos hawaiana',NULL,NULL,NULL,1100.00,1100.00,1100.00,1100.00,1100,1,1100,1100,NULL,0,1,NULL,'LT-20251211-889282132',NULL,'2025-12-11 00:12:23','2025-12-13 18:19:51'),
(113,3,'7411956741281','MP1-11956740-0482','Metro pizza 16 pedazos jamón y maíz','Metro pizza 16 pedazos jamón y maíz',NULL,NULL,NULL,1100.00,1100.00,1100.00,1100.00,1100,1,1,1,NULL,0,1,NULL,'LT-20251211-950167346',NULL,'2025-12-11 00:13:41','2025-12-13 18:19:28'),
(114,5,'7412027296234','DVR-12027295-3003','XVR UNV 4 Canales','DVR Marca UNV de 4 canales análogos y 2 canales NVR',NULL,NULL,1,1980.00,2500.00,2360.00,2200.00,2,9,2,100,NULL,1,1,NULL,'LT-20251211-022318830',NULL,'2025-12-11 00:16:05','2025-12-11 00:21:30'),
(115,1,'7412496192885','CAR-12496192-0948','Vino Carlo Rossi',NULL,NULL,NULL,NULL,330.00,450.00,NULL,NULL,6,11,1,100,NULL,1,1,NULL,'LT-20251211-482451784',NULL,'2025-12-11 00:25:23','2025-12-11 00:25:23'),
(116,1,'7412893967235','CARL-12893966-9827','Carlo Rosi rose',NULL,NULL,NULL,NULL,330.00,450.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-891007090',NULL,'2025-12-11 00:28:42','2025-12-11 14:17:36'),
(117,1,'7412937747391','FRO-12937747-1393','Frontera frutos rojos',NULL,NULL,NULL,NULL,450.00,650.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-927334746',NULL,'2025-12-11 00:29:39','2025-12-11 14:17:18'),
(118,1,'7413041330109','BRU-13041329-7748','Brugal extra viejo 1000ml',NULL,NULL,NULL,NULL,700.00,900.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-984540034',NULL,'2025-12-11 00:31:14','2025-12-11 14:16:34'),
(119,1,'7413086715567','ENE-13086715-7388','Energy 911',NULL,NULL,NULL,NULL,39.00,50.00,NULL,NULL,6,54,1,100,NULL,0,1,NULL,'LT-20251211-078519658',NULL,'2025-12-11 00:32:00','2025-12-11 22:56:51'),
(120,1,'7413160424804','JHO-13160424-8854','Jhonny walker','Gold label',NULL,NULL,NULL,4000.00,4500.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-148926866',NULL,'2025-12-11 00:33:25','2025-12-11 14:16:04'),
(121,1,'7413284590373','CHI-13284589-3272','Chiva 12 años',NULL,NULL,NULL,NULL,1800.00,2400.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-280604680',NULL,'2025-12-11 00:37:23','2025-12-11 14:15:47'),
(122,1,'7413456875180','BRUG-13456874-8450','Brugal añejo 1000 ml',NULL,NULL,NULL,NULL,675.00,900.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-448268078',NULL,'2025-12-11 00:38:06','2025-12-11 14:15:31'),
(123,1,'7413541985915','BRU-13541983-8105','Brugal añejo 700ml',NULL,NULL,NULL,NULL,575.00,700.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-491451076',NULL,'2025-12-11 00:39:35','2025-12-11 22:56:10'),
(124,1,'7413616049772','BUC-13616049-7292','Buchanna 12 años',NULL,NULL,NULL,NULL,2000.00,2600.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-606971261',NULL,'2025-12-11 00:40:54','2025-12-11 14:14:50'),
(125,1,'7413666420552','BRU-13666419-7774','Brugal doble reserva 700 ml',NULL,NULL,NULL,NULL,875.00,1000.00,NULL,NULL,6,5,1,100,NULL,0,1,NULL,'LT-20251211-659491105',NULL,'2025-12-11 00:42:15','2025-12-11 14:14:34'),
(126,1,'7413746638104','BRU-13746637-3724','Brugal triple reserva',NULL,NULL,NULL,NULL,900.00,1300.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251211-742021208',NULL,'2025-12-11 00:42:51','2025-12-11 14:14:19'),
(127,1,'7413801757692','BAR-13801757-8709','Barceló imperial 700ml',NULL,NULL,NULL,NULL,800.00,1175.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-793939557',NULL,'2025-12-11 00:44:03','2025-12-14 01:12:37'),
(128,1,'7414044615219','ROM-14044615-8095','ROM carta 2 dorada 700 ml',NULL,NULL,NULL,NULL,250.00,375.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-032622592',NULL,'2025-12-11 00:47:55','2025-12-11 14:12:49'),
(129,1,'7414096552252','DEW-14096552-9614','Dewars 750 ml',NULL,NULL,NULL,NULL,750.00,900.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251211-082020591',NULL,'2025-12-11 00:48:58','2025-12-11 14:12:34'),
(130,1,'7414149161785','BLA-14149161-9898','Black y white',NULL,NULL,NULL,NULL,650.00,900.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-143558165',NULL,'2025-12-11 00:49:44','2025-12-11 14:12:17'),
(131,1,'7414324272509','DLE-14324271-9253','D león Jiménez 1903',NULL,NULL,NULL,NULL,1500.00,2000.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-191674119',NULL,'2025-12-11 00:52:55','2025-12-11 14:12:00'),
(132,1,'7414387266686','LEY-14387266-7608','Leyenda',NULL,NULL,NULL,NULL,1000.00,1400.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-383387086',NULL,'2025-12-11 00:53:57','2025-12-11 14:11:42'),
(134,1,'7424242679992','OLD-24242679-2276','Old par 12 años',NULL,NULL,NULL,NULL,1800.00,2350.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-227414058',NULL,'2025-12-11 03:38:09','2025-12-11 14:11:26'),
(135,1,'7424306135551','KIN-24306134-4770','King pride 175 ml',NULL,NULL,NULL,NULL,125.00,180.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-293486751',NULL,'2025-12-11 03:39:04','2025-12-11 14:11:13'),
(136,1,'7424362545395','VIN-24362544-1718','Vino Santa Rita 120 ml',NULL,NULL,NULL,NULL,655.00,850.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-354949152',NULL,'2025-12-11 03:40:19','2025-12-11 14:11:00'),
(137,1,'7424433404018','CAN-24433403-8744','Canadá aloe Vera lata',NULL,NULL,NULL,NULL,45.00,60.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-425417735',NULL,'2025-12-11 03:41:24','2025-12-11 14:10:45'),
(138,1,'7424501515934','CAY-24501515-3575','Cayman blue 700 ml',NULL,NULL,NULL,NULL,800.00,1000.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-488462802',NULL,'2025-12-11 03:42:13','2025-12-11 14:10:28'),
(139,4,'7424528078377','LAP-24528077-0946','Lapto Dell',NULL,8,5,1,300.00,600.00,500.00,450.00,6,46,5,100,NULL,0,1,NULL,'LT-20251211-523748221',NULL,'2025-12-11 03:43:02','2025-12-11 04:22:34'),
(140,1,'7424576957933','MAC-24576957-5607','Macorix gold 750 ml',NULL,NULL,NULL,NULL,375.00,650.00,NULL,NULL,6,5,1,100,NULL,0,1,NULL,'LT-20251211-550965747',NULL,'2025-12-11 03:43:32','2025-12-11 14:10:15'),
(141,4,'7424589959193','CAM-24589958-5084','Camisa',NULL,9,3,1,1650.00,3000.00,2500.00,2200.00,6,12,5,100,NULL,0,1,NULL,'LT-20251211-587216294',NULL,'2025-12-11 03:43:53','2025-12-11 04:22:34'),
(142,1,'7424625917478','JHO-24625916-7691','Jhonny walker red Lebel',NULL,NULL,NULL,NULL,750.00,1150.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-617090001',NULL,'2025-12-11 03:44:21','2025-12-11 14:09:57'),
(143,4,'7424640125953','POL-24640124-6114','Polo natica',NULL,9,3,1,1650.00,2500.00,2200.00,1.00,6,48,5,100,NULL,0,1,NULL,'LT-20251211-638419560',NULL,'2025-12-11 03:44:34','2025-12-11 04:36:23'),
(144,1,'7424676103321','MAL-24676103-5111','Malta morena 355 ml lata',NULL,NULL,NULL,NULL,28.00,40.00,NULL,NULL,6,10,3,100,NULL,0,1,NULL,'LT-20251211-665400089',NULL,'2025-12-11 03:45:03','2025-12-11 14:09:38'),
(145,1,'7424718043815','VIN-24718041-8159','Vino la fuerza galón',NULL,NULL,NULL,NULL,450.00,650.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-707093732',NULL,'2025-12-11 03:45:52','2025-12-11 14:09:20'),
(146,1,'7424763701626','VIV-24763701-3697','Vive 100',NULL,NULL,NULL,NULL,39.00,50.00,NULL,NULL,6,30,5,100,NULL,0,1,NULL,'LT-20251211-756713535',NULL,'2025-12-11 03:46:19','2025-12-11 14:09:02'),
(147,1,'7424793055775','AGUA-24793054-5584','Agua perrier pequeña',NULL,NULL,NULL,NULL,100.00,125.00,NULL,NULL,6,6,2,100,NULL,0,1,NULL,'LT-20251211-785716561',NULL,'2025-12-11 03:47:01','2025-12-11 14:08:47'),
(148,4,'7424714572689','T-SH-24714571-3673','T-shirt',NULL,9,5,1,1250.00,2200.00,1650.00,1500.00,6,10,5,100,'https://cdn.isiweek.com/uploads/9f5d8ab4-ff89-4d93-8caf-39dd54aab15c.jpeg',0,1,NULL,'LT-20251211-699246857','Perchero movible ','2025-12-11 03:47:04','2025-12-11 03:56:03'),
(149,1,'7424835044917','COCO-24835043-9554','Coco rico 400 ml',NULL,NULL,NULL,NULL,23.00,35.00,NULL,NULL,6,16,5,100,NULL,0,1,NULL,'LT-20251211-825176370',NULL,'2025-12-11 03:47:42','2025-12-11 14:08:33'),
(150,1,'7424875205844','GAT-24875204-5927','Gatoralite suero',NULL,NULL,NULL,NULL,135.00,180.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-866226107',NULL,'2025-12-11 03:48:25','2025-12-11 14:08:16'),
(151,1,'7424922794011','COCO-24922793-3657','Coconut aloe',NULL,NULL,NULL,NULL,125.00,170.00,NULL,NULL,6,7,2,100,NULL,0,1,NULL,'LT-20251211-920636981',NULL,'2025-12-11 03:49:07','2025-12-11 14:07:58'),
(152,1,'7424961765047','ALO-24961765-4434','Aloe cera pequeña',NULL,NULL,NULL,NULL,100.00,125.00,NULL,NULL,6,5,1,100,NULL,0,1,NULL,'LT-20251211-951815299',NULL,'2025-12-11 03:49:47','2025-12-11 14:07:33'),
(153,1,'7425003581175','LOW-25003580-8520','Lowembrau',NULL,NULL,NULL,NULL,40.00,65.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251211-992116668',NULL,'2025-12-11 03:50:28','2025-12-11 14:07:08'),
(154,1,'7425044943568','CLA-25044943-2156','Clamato',NULL,NULL,NULL,NULL,45.00,75.00,NULL,NULL,6,12,3,100,NULL,0,1,NULL,'LT-20251211-043083790',NULL,'2025-12-11 03:51:13','2025-12-11 14:06:13'),
(155,1,'7425098420767','JUGO-25098420-7161','Jugos Mots 946ml',NULL,NULL,NULL,NULL,240.00,300.00,NULL,NULL,6,5,2,100,NULL,0,1,NULL,'LT-20251211-089982663',NULL,'2025-12-11 03:53:14','2025-12-11 14:05:55'),
(156,1,'7425207428246','JHO-25207427-1466','Jhonny walker','Black label',NULL,NULL,NULL,2000.00,2350.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-198196699',NULL,'2025-12-11 03:54:08','2025-12-11 14:05:41'),
(157,1,'7425257642923','JHON-25257641-1377','Jhonny walker','Double black',NULL,NULL,NULL,2100.00,2750.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-255133893',NULL,'2025-12-11 03:54:47','2025-12-11 14:05:24'),
(158,1,'7425299331809','AGUA-25299331-5569','Agua Enriquillo 1 lt',NULL,NULL,NULL,NULL,45.00,65.00,NULL,NULL,6,5,1,100,NULL,0,1,NULL,'LT-20251211-291994840',NULL,'2025-12-11 03:55:35','2025-12-11 14:05:08'),
(159,1,'7425346331540','AGUA-25346330-6680','Agua tónica 1 lt',NULL,NULL,NULL,NULL,45.00,65.00,NULL,NULL,6,5,1,100,NULL,0,1,NULL,'LT-20251211-340534283',NULL,'2025-12-11 03:56:07','2025-12-11 14:04:55'),
(160,1,'7425389919586','COL-25389919-6949','Colonia para hombres',NULL,NULL,NULL,NULL,375.00,550.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-370944922',NULL,'2025-12-11 03:56:54','2025-12-11 14:04:44'),
(161,1,'7425429250734','BRI-25429249-9658','Brilla labios',NULL,NULL,NULL,NULL,75.00,175.00,NULL,NULL,6,16,1,100,NULL,0,1,NULL,'LT-20251211-418782235',NULL,'2025-12-11 03:57:43','2025-12-11 14:04:29'),
(162,1,'7425473509412','MNTA-25473508-3489','Menta hall',NULL,NULL,NULL,NULL,0.99,2.75,NULL,NULL,6,138,5,100,NULL,0,1,NULL,'LT-20251211-467420160',NULL,'2025-12-11 03:58:27','2025-12-11 14:04:18'),
(163,1,'7425517509285','PRO-25517508-2928','Cigarro príncipe',NULL,NULL,NULL,NULL,25.00,35.00,NULL,NULL,6,18,5,100,NULL,0,1,NULL,'LT-20251211-511853133',NULL,'2025-12-11 03:59:12','2025-12-11 14:04:03'),
(164,1,'7425585952531','ZIBA-25585951-7265','Papitas zibas',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,53,5,100,NULL,1,1,NULL,'LT-20251211-580673804',NULL,'2025-12-11 04:00:08','2025-12-11 04:00:08'),
(165,1,'7425618504536','TAQU-25618503-4832','Taquerito pequeño',NULL,NULL,NULL,NULL,15.00,20.00,NULL,NULL,6,18,5,100,NULL,1,1,NULL,'LT-20251211-613248068',NULL,'2025-12-11 04:00:43','2025-12-11 04:00:43'),
(166,1,'7425656934603','ZAM-25656934-4433','Zambos',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,17,5,100,NULL,1,1,NULL,'LT-20251211-647534784',NULL,'2025-12-11 04:01:17','2025-12-11 04:01:17'),
(167,1,'7425738033260','CHE-25738032-7614','Cheetos 155g',NULL,NULL,NULL,NULL,110.00,130.00,NULL,NULL,6,1,1,100,NULL,1,1,NULL,'LT-20251211-680498804',NULL,'2025-12-11 04:02:48','2025-12-11 04:02:48'),
(168,1,'7425782088875','HOJ-25782087-3070','Hojuelas de queso 160 g',NULL,NULL,NULL,NULL,110.00,130.00,NULL,NULL,6,1,1,100,NULL,0,1,NULL,'LT-20251211-776666792',NULL,'2025-12-11 04:03:32','2025-12-11 14:03:45'),
(169,1,'7425825947295','MON-25825946-8839','Monster negro',NULL,NULL,NULL,NULL,100.00,115.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-819455968',NULL,'2025-12-11 04:04:10','2025-12-11 14:03:31'),
(170,1,'7425861434231','RED-25861434-1751','Red Bull 250 ml',NULL,NULL,NULL,NULL,78.00,125.00,NULL,NULL,6,3,1,100,NULL,0,1,NULL,'LT-20251211-855425926',NULL,'2025-12-11 04:04:44','2025-12-11 14:03:11'),
(171,1,'7425896548026','GAT-25896548-8775','Gatorade',NULL,NULL,NULL,NULL,46.00,60.00,NULL,NULL,6,6,1,100,NULL,0,1,NULL,'LT-20251211-889406671',NULL,'2025-12-11 04:05:20','2025-12-11 14:02:58'),
(172,1,'7425936976315','AGIA-25936975-4089','Dasani saborizada',NULL,NULL,NULL,NULL,28.00,35.00,NULL,NULL,6,25,5,100,NULL,0,1,NULL,'LT-20251211-926458489',NULL,'2025-12-11 04:05:58','2025-12-11 14:02:45'),
(173,1,'7425969448435','KOLA-25969447-0840','Kola real 400 ml',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,14,5,100,NULL,0,1,NULL,'LT-20251211-962923627',NULL,'2025-12-11 04:06:33','2025-12-11 23:15:47'),
(174,1,'7426010269903','MIN-26010268-3470','Minute maid 355',NULL,NULL,NULL,NULL,11.00,15.00,NULL,NULL,6,6,2,100,NULL,0,1,NULL,'LT-20251211-997251424',NULL,'2025-12-11 04:07:21','2025-12-11 23:18:58'),
(175,1,'7426050448692','SPR-26050448-6099','Sprite 400 ml',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,7,2,100,NULL,0,1,NULL,'LT-20251211-045359576',NULL,'2025-12-11 04:07:55','2025-12-11 14:02:05'),
(176,1,'7426087300651','TABA-26087298-8315','Tabaco San José',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,10,3,100,NULL,0,1,NULL,'LT-20251211-079780549',NULL,'2025-12-11 04:08:28','2025-12-11 14:01:51'),
(177,1,'7426115962392','CAFE-26115961-0351','Café Santo Domingo sobre',NULL,NULL,NULL,NULL,25.00,35.00,NULL,NULL,6,4,1,100,NULL,0,1,NULL,'LT-20251211-112832816',NULL,'2025-12-11 04:08:57','2025-12-11 14:01:39'),
(178,4,'7427440147063','JEA-27440147-1251','jeans de hombre',NULL,NULL,NULL,NULL,1650.00,2800.00,2500.00,2400.00,6,36,5,100,NULL,0,1,NULL,'LT-20251211-435603396','estante lado izquierdo','2025-12-11 04:32:14','2025-12-11 04:36:23'),
(179,1,'Cem','CEM-74844322-3529','Cemento gris fda',NULL,1,1,1,510.00,570.00,560.00,540.00,50,499,5,1000,NULL,0,1,NULL,'LT-20251214-840148605',NULL,'2025-12-14 01:15:57','2025-12-14 19:11:50'),
(180,5,'7678302986526','XVR-78302985-1741','XVR UNV 8 CANALES',NULL,6,2,1,2550.00,3550.00,3000.00,NULL,6,5,5,100,NULL,1,1,NULL,'LT-20251214-298405158',NULL,'2025-12-14 02:12:30','2025-12-15 01:38:51'),
(181,5,'7678366506349','XVR-78366505-2259','XVR UNV 16 CANALES',NULL,6,2,1,4200.00,5500.00,4900.00,4500.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-362769502',NULL,'2025-12-14 02:13:42','2025-12-14 02:13:42'),
(182,5,'7678432180353','CMA-78432180-1470','CAMARA UNV COLOR HUNTER BULLET 2MP','Full Color, 24/7 2MP, Microfono',5,2,1,835.00,1250.00,1000.00,950.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-427407244',NULL,'2025-12-14 02:15:26','2025-12-14 02:15:26'),
(183,5,'7678533522874','CAMA-78533522-4347','CAMARA UNV COLOR HUNTER 2MP DOMO',NULL,5,2,1,835.00,1250.00,1000.00,950.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-530320648',NULL,'2025-12-14 02:16:26','2025-12-14 02:16:53'),
(184,5,'7678625921059','DIC-78625920-8465','DISCO DURO 1TB',NULL,NULL,NULL,NULL,2300.00,2900.00,2500.00,2400.00,6,5,1,100,NULL,1,1,NULL,'LT-20251214-623863078',NULL,'2025-12-14 02:17:49','2025-12-14 02:17:49'),
(185,5,'7678675831513','DIS-78675830-8699','DISCO DURO 2TB',NULL,NULL,NULL,NULL,3400.00,4500.00,4000.00,3800.00,6,5,5,100,NULL,1,1,NULL,'LT-20251214-673268667',NULL,'2025-12-14 02:18:31','2025-12-14 02:18:31'),
(186,5,'7685458213205','CAMA-85458212-6404','CAMARA UNV COLOR HUNTER 5MP DOMO',NULL,5,2,1,1390.00,1700.00,1650.00,1500.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-455486492',NULL,'2025-12-14 04:12:34','2025-12-14 04:12:34'),
(187,5,'7685599006977','CAM-85599005-6869','CAMARA UNV COLOR HUNTER 5MP BULLET',NULL,5,2,1,1390.00,1700.00,1650.00,1500.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-595303588',NULL,'2025-12-14 04:14:09','2025-12-14 04:14:09'),
(188,5,'7685667795015','VID-85667795-4109','VIDEO BALUM TEC ONE 8MP',NULL,NULL,NULL,8,118.00,200.00,180.00,150.00,6,25,5,100,NULL,1,1,NULL,'LT-20251214-665329248',NULL,'2025-12-14 04:15:40','2025-12-14 04:15:40'),
(189,5,'7685746944643','CON-85746943-4220','CONECTOR BNC MACHO',NULL,NULL,NULL,1,17.00,50.00,30.00,25.00,6,25,5,100,NULL,1,1,NULL,'LT-20251214-744449939',NULL,'2025-12-14 04:16:26','2025-12-14 04:16:26'),
(190,5,'7685794202575','FUEN-85794201-2123','FUENTE 12V 3AMP',NULL,NULL,NULL,1,400.00,700.00,600.00,500.00,6,10,5,100,NULL,1,1,NULL,'LT-20251214-790496425',NULL,'2025-12-14 04:17:13','2025-12-14 04:17:13'),
(191,5,'7685840949140','CAB-85840948-3383','CABLE LINK PRO CAT 5',NULL,NULL,NULL,1,2.65,5.00,3.50,3.00,300,1000,100,100,NULL,1,1,NULL,'LT-20251214-837031528',NULL,'2025-12-14 04:18:34','2025-12-14 04:18:34'),
(192,5,'7685924607026','CAJ-85924607-8846','CAJA DE REGISTRO 4X4',NULL,NULL,NULL,1,100.00,130.00,125.00,110.00,6,24,5,100,NULL,1,1,NULL,'LT-20251214-922575235',NULL,'2025-12-14 04:19:14','2025-12-14 04:19:14'),
(193,5,'7685964870180','ROL-85964869-4349','ROLLO CORDUFLEX',NULL,NULL,NULL,7,500.00,600.00,550.00,NULL,6,3,1,100,NULL,1,1,NULL,'LT-20251214-962679957',NULL,'2025-12-14 04:20:13','2025-12-14 04:20:13'),
(194,5,'7686020891110','REFG-86020890-5041','REGISTRO PARA DVR',NULL,NULL,NULL,1,1350.00,1600.00,NULL,NULL,6,4,5,100,NULL,1,1,NULL,'LT-20251214-018843497',NULL,'2025-12-14 04:20:56','2025-12-14 04:20:56'),
(195,5,'7686062206672','MAN-86062204-1993','MANO DE OBRA INSTALACION CAMARAS',NULL,NULL,NULL,1,1300.00,1300.00,1100.00,1000.00,14,100,5,100,NULL,1,1,NULL,'LT-20251214-060328266',NULL,'2025-12-14 04:22:05','2025-12-14 04:22:05'),
(196,15,'7734281999396','ASDA-34281838-2083','asdasdsad','asdasdsad',10,6,7,123.00,123.00,NULL,NULL,6,123,5,100,NULL,1,0,NULL,'LT-20251214-279791270',NULL,'2025-12-14 17:44:49','2025-12-14 18:32:00'),
(197,15,'7736996341442','ASD-36996339-7157','asdasdsad',NULL,NULL,NULL,NULL,122.96,123.00,NULL,NULL,6,122,5,100,'https://cdn.isiweek.com/uploads/4ae36b60-86db-473a-81db-6517d01e0c0c.jpg',1,1,NULL,'LT-20251214-972511540',NULL,'2025-12-14 18:30:14','2025-12-14 19:18:10'),
(198,16,'7829695594272','PLA-29695593-5486','platano','verde',11,NULL,NULL,24.99,34.98,NULL,NULL,6,198,19,100,NULL,1,1,NULL,'LT-20251215-689446658',NULL,'2025-12-15 20:19:17','2025-12-15 20:27:27'),
(199,2,'7886624654899','GUIN-86624653-6555','Guineo','Verde',12,NULL,1,200.00,250.00,NULL,NULL,6,25,5,100,NULL,1,1,NULL,'LT-20251216-615776752',NULL,'2025-12-16 12:05:17','2025-12-16 12:05:17');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `rnc` varchar(11) NOT NULL,
  `razon_social` varchar(250) NOT NULL,
  `nombre_comercial` varchar(200) DEFAULT NULL,
  `actividad_economica` varchar(200) DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `sitio_web` varchar(255) DEFAULT NULL,
  `condiciones_pago` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_razon_social` (`razon_social`),
  KEY `idx_rnc` (`rnc`),
  KEY `idx_empresa` (`empresa_id`),
  CONSTRAINT `proveedores_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES
(1,5,'111-11111-1','DANIEL TECNOLOGY','DANIEL TECNOLOGY','COMERCIO AL POR MAYOR Y DETALLE','JOSE MANUEL ROMERO','8296592806',NULL,'COTUI',NULL,NULL,NULL,NULL,NULL,1,'2025-12-11 07:03:08');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'vendedor','Vendedor con permisos limitados',1,'2025-12-09 22:53:23'),
(2,'cajero','Cajero con acceso a caja y ventas',1,'2025-12-09 22:53:23'),
(3,'inventario','Encargado de inventario',1,'2025-12-09 22:53:23');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles_permisos`
--

DROP TABLE IF EXISTS `roles_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles_permisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol_id` int(11) NOT NULL,
  `permiso_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rol` (`rol_id`),
  KEY `idx_permiso` (`permiso_id`),
  CONSTRAINT `roles_permisos_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `roles_permisos_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles_permisos`
--

LOCK TABLES `roles_permisos` WRITE;
/*!40000 ALTER TABLE `roles_permisos` DISABLE KEYS */;
INSERT INTO `roles_permisos` VALUES
(1,1,21,'2025-12-09 22:53:23'),
(2,1,20,'2025-12-09 22:53:23'),
(3,1,22,'2025-12-09 22:53:23'),
(4,1,11,'2025-12-09 22:53:23'),
(5,1,10,'2025-12-09 22:53:23'),
(6,1,1,'2025-12-09 22:53:23'),
(7,1,14,'2025-12-09 22:53:23'),
(8,1,7,'2025-12-09 22:53:23'),
(9,1,6,'2025-12-09 22:53:23'),
(16,2,21,'2025-12-09 22:53:23'),
(17,2,20,'2025-12-09 22:53:23'),
(18,2,22,'2025-12-09 22:53:23'),
(19,2,10,'2025-12-09 22:53:23'),
(20,2,1,'2025-12-09 22:53:23'),
(21,2,14,'2025-12-09 22:53:23'),
(22,2,7,'2025-12-09 22:53:23'),
(23,2,6,'2025-12-09 22:53:23'),
(31,3,24,'2025-12-09 22:53:23'),
(32,3,23,'2025-12-09 22:53:23'),
(33,3,1,'2025-12-09 22:53:23'),
(34,3,19,'2025-12-09 22:53:23'),
(35,3,18,'2025-12-09 22:53:23'),
(36,3,15,'2025-12-09 22:53:23'),
(37,3,16,'2025-12-09 22:53:23'),
(38,3,14,'2025-12-09 22:53:23'),
(39,3,26,'2025-12-09 22:53:23'),
(40,3,25,'2025-12-09 22:53:23');
/*!40000 ALTER TABLE `roles_permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_name` (`name`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,'app_logo','https://cdn.isiweek.com/uploads/76832c01-2ff6-44ea-ade5-c7aaec4f52fe.jpg','2025-12-15 12:58:24',1);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_registro`
--

DROP TABLE IF EXISTS `solicitudes_registro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(13) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `nombre_empresa` varchar(200) DEFAULT NULL,
  `rnc` varchar(11) DEFAULT NULL,
  `razon_social` varchar(250) DEFAULT NULL,
  `estado` enum('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  `fecha_solicitud` timestamp NULL DEFAULT current_timestamp(),
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_email` (`email`),
  KEY `idx_fecha` (`fecha_solicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_registro`
--

LOCK TABLES `solicitudes_registro` WRITE;
/*!40000 ALTER TABLE `solicitudes_registro` DISABLE KEYS */;
INSERT INTO `solicitudes_registro` VALUES
(1,'Barra 4 vientos','PEND26154347','lasmellasserver@gmail.com','$2b$10$nyS6VQ4igyeha1lzNR02A.kys6Nui2QmMZkT1kflbNVOczCUNewNK','8295844245','Barra 4 vientos','PEND154347','Barra 4 vientos','pendiente','2025-12-10 00:22:34',NULL,NULL),
(2,'Cheesepizza','PEND29511066','bmbrayanmartinez@icloun.com','$2b$10$mX0OYQ5pURF6j6wlgP.fiezzd7ac8s37OI1uxNid8SwlDCQtNhFCq','8495025126','Cheesepizza','PEND511066','Cheesepizza','pendiente','2025-12-10 01:18:31',NULL,NULL),
(3,'Exclusive Drips','PEND32151318','ainhoahernandez04@icloud.com','$2b$10$Sq7g7WAxh3e34n7AbIoyP.OCNJZpGSUck5Yo1y1ZpUy.d9zjyETFC','8292876233','Exclusive Drips','PEND151318','Exclusive Drips','pendiente','2025-12-10 02:02:31',NULL,NULL),
(4,'SentryTech Multiservices ','PEND88044802','juanrenandelacruz87@gmail.com','$2b$10$9ygReirC07OTlZzzgp2Zzu7k8zQ84GxahyIoxukCA9GB274T4fVWC','8096177188','SentryTech Multiservices ','PEND044802','SentryTech Multiservices ','pendiente','2025-12-10 17:34:04',NULL,NULL),
(5,'Tupapa','PEND11083317','prueba2@gmail.com','$2b$10$RQaqZXy8lQqZxOpOoN0viewxW75AJ0EWNTP1Ck5jekwOmvVDDlAMe','8295543767','Tupapa','PEND083317','Tupapa','pendiente','2025-12-10 23:58:03',NULL,NULL),
(6,'D’Vicell','PEND56179796','frankelis071@gmail.com','$2b$10$qU.UWnumxm8W6k6WLB9l7eUm2QzuTQQR49g2xh366m1Kwc4ArBYmy','8293086775','D’Vicell','PEND179796','D’Vicell','pendiente','2025-12-11 12:29:39',NULL,NULL),
(7,'Pruebal','PEND70707852','elpruebal@gmail.com','$2b$10$15ABb/KFwlHkwUf0DDAqV.W.hEHFHodiMLxuPIOnp62XdOdolp6CS','8292191548','Pruebal','PEND707852','Pruebal','pendiente','2025-12-11 16:31:47',NULL,NULL),
(8,'Klk','PEND00712155','mendoza@gmail.com','$2b$10$roZHK5kVsDMAo763kmTmtOYoktXLf0T1DjbMKGk4VjhgS13dp50.y','8295844245','Klk','PEND712155','Klk','pendiente','2025-12-12 00:51:52',NULL,NULL),
(9,'Universidad Nacional San Luis Gonzaga','PEND06800956','giancarlos@gmail.com','$2b$10$rIShttmaXqIRqgeiEEjQT.M0f0ajWD2IosJn7Sh3G9Rgklu3JFUwm','957786282','Universidad Nacional San Luis Gonzaga','PEND800956','Universidad Nacional San Luis Gonzaga','pendiente','2025-12-12 02:33:20',NULL,NULL),
(10,'SmartCities','PEND13082838','infoeliasar12@gmail.com','$2b$10$WDdjYfBL5mL12ZddQylW0OEqmYc8t5a06GfOvc6o6PWcTHLh.O.vy','916367507','SmartCities','PEND082838','SmartCities','pendiente','2025-12-12 04:18:02',NULL,NULL),
(11,'Comedor maria','PEND49051444','manuel@gmail.com','$2b$10$SP.UbVjUiyu.l5YukTa7Mun.eaVDP3DRjw.4qMnCLfo.gj3S.D0I.','8295844245','Comedor maria','PEND051444','Comedor maria','pendiente','2025-12-13 18:04:11',NULL,NULL),
(12,'Comedor maria','PEND49273060','manuel2@gmail.com','$2b$10$/LzTbcOlQWEvO2koJhGBlesh0x0MFPetHElFrJg4LfeUX7rSaPPQK','84597643484','Comedor maria','PEND273060','Comedor maria','pendiente','2025-12-13 18:07:53',NULL,NULL),
(13,'conuco ramona','PEND29534841','ramonaescolasticoortega@gmail.com','$2b$10$46Y2SazV1Ch7LpBz9ETXyOh50iylQ8puc15U9GrMIlE8Afn94xvCy','829 8172975','conuco ramona','PEND534841','conuco ramona','pendiente','2025-12-15 20:12:14',NULL,NULL),
(14,'VENDEDOR DE AGUAS DE PATA','PEND45279566','leonkaurhot23@gmail.com','$2b$10$Eko7iuRPtepydwDWqh11hudkFxJp3/gytoQmtNhmeX0basAq85cPy','829312018','VENDEDOR DE AGUAS DE PATA','PEND279566','VENDEDOR DE AGUAS DE PATA','pendiente','2025-12-16 00:34:39',NULL,NULL),
(15,'D’ paca magica','PEND97589076','anabelfelixgalan@gmail.com','$2b$10$Z.WbPpSiI3.GvNH77XZKSO4kfmHFo1FzE0FQ5q2E50iFvmnZCCla.','8496395590','D’ paca magica','PEND589076','D’ paca magica','pendiente','2025-12-17 18:53:09',NULL,NULL),
(16,'Locación de junior','PEND77340442','junior07@gmail.com','$2b$10$P27mrvISODZc9hnJskg0OeVaysQJkRWwDhDV9lSHHV7Q1wzLkCQku','8494783337','Locación de junior','PEND340442','Locación de junior','pendiente','2025-12-18 17:02:20',NULL,NULL);
/*!40000 ALTER TABLE `solicitudes_registro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_comprobante`
--

DROP TABLE IF EXISTS `tipos_comprobante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_comprobante` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(10) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `prefijo_ncf` varchar(3) DEFAULT NULL,
  `secuencia_desde` bigint(20) DEFAULT NULL,
  `secuencia_hasta` bigint(20) DEFAULT NULL,
  `secuencia_actual` bigint(20) DEFAULT 1,
  `requiere_rnc` tinyint(1) DEFAULT 0,
  `requiere_razon_social` tinyint(1) DEFAULT 0,
  `genera_credito_fiscal` tinyint(1) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_comprobante`
--

LOCK TABLES `tipos_comprobante` WRITE;
/*!40000 ALTER TABLE `tipos_comprobante` DISABLE KEYS */;
INSERT INTO `tipos_comprobante` VALUES
(1,'B01','Comprobante Credito Fiscal','B01',1,10000000,1,1,1,1,1),
(2,'B02','Comprobante Consumidor Final','B02',1,10000000,28,0,0,0,1),
(3,'B14','Comprobante Regimenes Especiales','B14',1,10000000,1,1,1,0,1),
(4,'B15','Comprobante Gubernamental','B15',1,10000000,1,1,1,1,1),
(5,'B16','Comprobante Exportaciones','B16',1,10000000,1,1,1,0,1),
(6,'B04','Nota de Credito','B04',1,10000000,1,1,1,1,1),
(7,'B03','Nota de Debito','B03',1,10000000,1,1,1,1,1);
/*!40000 ALTER TABLE `tipos_comprobante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_documento`
--

DROP TABLE IF EXISTS `tipos_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_documento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(10) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `longitud_min` int(11) NOT NULL,
  `longitud_max` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_documento`
--

LOCK TABLES `tipos_documento` WRITE;
/*!40000 ALTER TABLE `tipos_documento` DISABLE KEYS */;
INSERT INTO `tipos_documento` VALUES
(1,'CED','Cedula de Identidad',11,13,1),
(2,'RNC','Registro Nacional de Contribuyentes',9,11,1),
(3,'PAS','Pasaporte',6,15,1);
/*!40000 ALTER TABLE `tipos_documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades_medida`
--

DROP TABLE IF EXISTS `unidades_medida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_medida` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(10) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `abreviatura` varchar(10) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_medida`
--

LOCK TABLES `unidades_medida` WRITE;
/*!40000 ALTER TABLE `unidades_medida` DISABLE KEYS */;
INSERT INTO `unidades_medida` VALUES
(1,'UN','Unidad','UN',1),
(2,'ML','Mililitro','ml',1),
(3,'GR','Gramo','gr',1),
(4,'KG','Kilogramo','kg',1),
(5,'LT','Litro','lt',1),
(6,'CJ','Caja','cj',1),
(7,'PQ','Paquete','pq',1),
(8,'SET','Set/Conjunto','set',1);
/*!40000 ALTER TABLE `unidades_medida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `rol_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(13) NOT NULL,
  `email` varchar(100) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `tipo` enum('superadmin','admin','vendedor') NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `rol_id` (`rol_id`),
  KEY `idx_cedula` (`cedula`),
  KEY `idx_email` (`email`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,1,NULL,'ANGEL LUIS BATISTA MENDOZA','40215504214','angelluisbm9@gmail.com','https://api.dicebear.com/7.x/bottts/svg?seed=Bear','$2b$12$Wo5n9e6tsiiYOUI0yCBYJ.aCiKQvZrn5JfSM/DWZYw8EPoTrG3u.y','superadmin',1,'2025-12-08 10:38:52','2025-12-13 02:54:04'),
(3,1,NULL,'CTMP','PEND93804511','emilioperezjavier@live.com','https://api.dicebear.com/7.x/bottts/svg?seed=Sophie','$2b$10$BG0tXb4JxHyrkmq0nUe.her8g3OU80b6r4rTwrtuGIcyoP7AIxejW','admin',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(4,1,NULL,'Stop liquors','PEND95912795','alfredjuniorguzmancabada@gmai.com',NULL,'$2b$10$tGYYWzGtqksmuUsdVL5sduUlXcNwXDX80/Pa8OKIFk2QbvOI4BBsS','admin',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(5,1,NULL,'CENTRO FERRETERO KAYLER','PEND05035479','elvishidalgo1971@gmail.com',NULL,'$2b$10$L4rBwCaOFQYHMEYR5x5U/.z48IDCx0L4GTlsrGVAu5p1cQjc5VcYq','admin',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(7,1,1,'prueba','402-1550421-4','negrolazo28@gmail.com',NULL,'$2b$10$ZZp8YMgU43SMENgy8sqKNOEa92pyQDolr9nfV/XDRE0y/7ZJcDLkO','vendedor',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(8,1,1,'Vendedor mayoreo','123-4567890-1','zevem17@gmail.com',NULL,'$2b$10$r6xYuqqZucISbmnudgVu5e0gUanLRWXSXXeWtutno6EcH4doOG9S.','vendedor',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(9,1,NULL,'La frescona','PEND90214289','abreusosajeydi@gmail.com',NULL,'$2b$10$1vpswNNpnl/AhTQNgBUq..F0qhbBZeHC64OzdjXXMO7uzyBlgSnGi','admin',1,'2025-12-09 23:01:45','2025-12-09 23:01:45'),
(10,2,NULL,'Barra 4 vientos','40271719929','lasmellasserver@gmail.com','https://api.dicebear.com/7.x/bottts/svg?seed=Charlie','$2b$10$xAz6b3IC.1uQeppF.sJmtuiH3a50QJYAfMiRarqFpCAlATydZfsBi','admin',1,'2025-12-10 00:22:34','2025-12-15 13:05:47'),
(11,3,NULL,'Cheesepizza','40212381335','bmbrayanmartinez@icloud.com','https://api.dicebear.com/7.x/bottts/svg?seed=Aneka','$2b$10$mX0OYQ5pURF6j6wlgP.fiezzd7ac8s37OI1uxNid8SwlDCQtNhFCq','admin',1,'2025-12-10 01:18:31','2025-12-15 17:28:05'),
(12,4,NULL,'Exclusive Drips','PEND32151318','ainhoahernandez04@icloud.com',NULL,'$2b$10$Sq7g7WAxh3e34n7AbIoyP.OCNJZpGSUck5Yo1y1ZpUy.d9zjyETFC','admin',1,'2025-12-10 02:02:31','2025-12-10 02:04:02'),
(13,5,NULL,'SentryTech Multiservices','08700189569','juanrenandelacruz87@gmail.com','https://api.dicebear.com/7.x/bottts/svg?seed=SentryTech%20Multiservices','$2b$10$9ygReirC07OTlZzzgp2Zzu7k8zQ84GxahyIoxukCA9GB274T4fVWC','admin',1,'2025-12-10 17:34:04','2025-12-11 07:04:43'),
(17,9,NULL,'Corina amparo','000-0000000-0','corinaamparo1@gmail.com',NULL,'$2b$10$Sj/AqL4Plg8O1lEP9TBRU.MDfuO7tIyWriRZXeWt8h1sR1g2IyktK','admin',1,'2025-12-12 00:50:20','2025-12-12 00:50:20'),
(21,2,1,'Vendedor','402-1550421-4','somos@gmail.com',NULL,'$2b$10$v8lVsrJEQjp2i0PrE.TRau.S2xkCJ99ui9ewugwJ3mxwuBXootBv2','vendedor',1,'2025-12-13 01:45:36','2025-12-15 05:21:31'),
(22,13,NULL,'Comedor maria','PEND49051444','manuel@gmail.com',NULL,'$2b$10$YJSjCYer6IegOi6YOn018uqta4RKK6aRT8cO532MZB0pq4sDqTr5.','admin',1,'2025-12-13 18:04:11','2025-12-16 00:48:30'),
(24,1,NULL,'Super Admin Pruebas','000-0000000-0','root2@admin.com',NULL,'$2b$12$k6K/3sxl/6A1s4wBR7iJnulKFCsLe7GqIFBwEhwx8NpgaL8cCbAta','superadmin',1,'2025-12-14 16:55:02','2025-12-14 16:55:02'),
(25,15,NULL,'prueba','123-1231231-2','prueba@gmail.com',NULL,'$2b$10$Wm7v6zL1SsQ9bN0/z74Zvei1AhNuuO2yMLXZv3UtyWyZWZIfXItmC','admin',1,'2025-12-14 16:56:21','2025-12-14 19:02:43'),
(26,16,NULL,'conuco ramona','PEND29534841','ramonaescolasticoortega@gmail.com',NULL,'$2b$10$46Y2SazV1Ch7LpBz9ETXyOh50iylQ8puc15U9GrMIlE8Afn94xvCy','admin',1,'2025-12-15 20:12:14','2025-12-15 20:12:20'),
(27,17,NULL,'VENDEDOR DE AGUAS DE PATA','402-1901351-9','leonkaurhot23@gmail.com',NULL,'$2b$10$Eko7iuRPtepydwDWqh11hudkFxJp3/gytoQmtNhmeX0basAq85cPy','superadmin',1,'2025-12-16 00:34:39','2025-12-16 00:44:15'),
(28,18,NULL,'D’ paca magica','PEND97589076','anabelfelixgalan@gmail.com',NULL,'$2b$10$Z.WbPpSiI3.GvNH77XZKSO4kfmHFo1FzE0FQ5q2E50iFvmnZCCla.','admin',1,'2025-12-17 18:53:09','2025-12-17 18:53:39'),
(29,19,NULL,'Locación de junior','PEND77340442','junior07@gmail.com',NULL,'$2b$10$P27mrvISODZc9hnJskg0OeVaysQJkRWwDhDV9lSHHV7Q1wzLkCQku','admin',0,'2025-12-18 17:02:20','2025-12-18 17:05:07');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta_extras`
--

DROP TABLE IF EXISTS `venta_extras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta_extras` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL COMMENT 'ingrediente,delivery,propina,otro',
  `nombre` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT 1.00,
  `precio_unitario` decimal(14,2) NOT NULL,
  `aplica_itbis` tinyint(1) DEFAULT 1,
  `impuesto_porcentaje` decimal(5,2) NOT NULL,
  `monto_base` decimal(14,2) NOT NULL,
  `monto_impuesto` decimal(14,2) NOT NULL,
  `monto_total` decimal(14,2) NOT NULL,
  `notas` text DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_venta_id` (`venta_id`),
  KEY `idx_empresa_id` (`empresa_id`),
  CONSTRAINT `venta_extras_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venta_extras_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venta_extras_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_extras`
--

LOCK TABLES `venta_extras` WRITE;
/*!40000 ALTER TABLE `venta_extras` DISABLE KEYS */;
INSERT INTO `venta_extras` VALUES
(1,19,3,11,'ingrediente','Pepperoni',1.00,150.00,0,18.00,150.00,0.00,150.00,NULL,'2025-12-13 15:38:18');
/*!40000 ALTER TABLE `venta_extras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `tipo_comprobante_id` int(11) NOT NULL,
  `ncf` varchar(19) NOT NULL,
  `numero_interno` varchar(20) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `monto_gravado` decimal(10,2) NOT NULL,
  `itbis` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta_debito','tarjeta_credito','transferencia','cheque','mixto') NOT NULL,
  `tipo_entrega` enum('completa','parcial') DEFAULT 'completa',
  `despacho_completo` tinyint(1) DEFAULT 1,
  `efectivo_recibido` decimal(10,2) DEFAULT NULL,
  `cambio` decimal(10,2) DEFAULT NULL,
  `estado` enum('emitida','anulada','pendiente') DEFAULT 'emitida',
  `razon_anulacion` text DEFAULT NULL,
  `ncf_modificado` varchar(19) DEFAULT NULL,
  `tipo_ingreso` enum('01','02','03','04') DEFAULT '01',
  `tipo_operacion` varchar(2) DEFAULT '1',
  `fecha_envio_dgii` timestamp NULL DEFAULT NULL,
  `estado_dgii` enum('enviado','aceptado','rechazado','no_enviado') DEFAULT 'no_enviado',
  `notas` text DEFAULT NULL,
  `fecha_venta` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `idx_ncf` (`ncf`),
  KEY `idx_numero_interno` (`numero_interno`),
  KEY `idx_fecha` (`fecha_venta`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_comprobante` (`tipo_comprobante_id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`tipo_comprobante_id`) REFERENCES `tipos_comprobante` (`id`),
  CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `ventas_ibfk_4` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES
(1,3,2,'B0200000000001','V-00000001',11,NULL,1000.00,0.00,1000.00,0.00,1000.00,'efectivo','completa',1,1050.00,50.00,'anulada','No se hizo ',NULL,'01','1',NULL,'no_enviado','jamón y peperonni','2025-12-10 23:04:30'),
(2,5,2,'B0200000000002','V-00000001',13,2,2500.00,0.00,2500.00,450.00,2950.00,'efectivo','completa',1,3000.00,50.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 00:21:30'),
(3,4,2,'B0200000000003','V-00000001',12,NULL,1200.00,0.00,1200.00,216.00,1416.00,'efectivo','completa',1,2000.00,584.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:48:42'),
(4,4,2,'B0200000000004','V-00000002',12,NULL,2200.00,0.00,2200.00,396.00,2596.00,'efectivo','completa',1,3000.00,404.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:49:19'),
(5,4,2,'B0200000000005','V-00000003',12,3,6600.00,0.00,6600.00,1188.00,7788.00,'tarjeta_credito','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:50:05'),
(6,4,2,'B0200000000006','V-00000004',12,NULL,3000.00,0.00,3000.00,540.00,3540.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado','Reserva','2025-12-11 03:50:44'),
(7,4,2,'B0200000000007','V-00000005',12,NULL,8300.00,0.00,8300.00,0.00,8300.00,'efectivo','completa',1,8500.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:56:03'),
(8,4,2,'B0200000000008','V-00000006',12,NULL,3600.00,17.28,3582.72,0.00,3582.72,'efectivo','completa',1,4000.00,417.28,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:22:34'),
(9,4,2,'B0200000000009','V-00000007',12,3,5600.00,0.00,5600.00,0.00,5600.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado','cuenta de reservas.','2025-12-11 04:34:32'),
(10,4,2,'B0200000000010','V-00000008',12,NULL,2800.00,0.00,2800.00,0.00,2800.00,'efectivo','completa',1,3000.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:35:23'),
(11,4,2,'B0200000000011','V-00000009',12,NULL,5300.00,0.00,5300.00,0.00,5300.00,'efectivo','completa',1,6000.00,700.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:36:23'),
(12,1,2,'B0200000000012','V-00000001',9,NULL,1280.00,0.00,1280.00,0.00,1280.00,'efectivo','completa',1,1280.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:54:37'),
(13,1,2,'B0200000000013','V-00000002',9,NULL,700.00,0.00,700.00,0.00,700.00,'efectivo','completa',1,700.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:56:10'),
(14,1,2,'B0200000000014','V-00000003',9,NULL,100.00,0.00,100.00,0.00,100.00,'efectivo','completa',1,100.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:56:51'),
(15,1,2,'B0200000000015','V-00000004',9,NULL,220.00,0.00,220.00,0.00,220.00,'efectivo','completa',1,220.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:12:45'),
(16,1,2,'B0200000000016','V-00000005',9,NULL,350.00,0.00,350.00,0.00,350.00,'efectivo','completa',1,350.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:13:39'),
(17,1,2,'B0200000000017','V-00000006',9,NULL,75.00,0.00,75.00,0.00,75.00,'efectivo','completa',1,75.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:15:47'),
(18,1,2,'B0200000000018','V-00000007',9,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,30.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:18:58'),
(19,3,2,'B0200000000019','V-00000002',11,NULL,750.00,0.00,900.00,0.00,900.00,'efectivo','completa',1,1000.00,100.00,'anulada','No se realizó ',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-13 15:38:18'),
(20,3,2,'B0200000000020','V-00000003',11,NULL,250.00,0.00,250.00,0.00,250.00,'efectivo','completa',1,1000.00,750.00,'anulada','No',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-13 16:43:49'),
(21,1,2,'B0200000000021','V-00000008',5,4,1175.00,0.00,1175.00,0.00,1175.00,'efectivo','completa',1,2000.00,825.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 01:12:36'),
(22,15,2,'B0200000000022','V-00000001',25,5,123.00,0.00,123.00,22.14,145.14,'efectivo','completa',1,2333.00,2187.86,'anulada','asd',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 17:45:18'),
(23,2,2,'B0200000000023','V-00000001',10,NULL,90.00,0.00,90.00,16.20,106.20,'efectivo','completa',1,2500.00,2393.80,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:08:07'),
(24,1,2,'B0200000000024','V-00000009',5,NULL,570.00,0.00,570.00,0.00,570.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:11:50'),
(25,15,2,'B0200000000025','V-00000002',25,6,123.00,0.00,123.00,22.14,145.14,'efectivo','completa',1,2322.97,2177.83,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:18:10'),
(26,2,2,'B0200000000026','V-00000002',10,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-15 19:09:54'),
(27,16,2,'B0200000000027','V-00000001',26,NULL,69.96,0.00,69.96,12.59,82.55,'efectivo','completa',1,500.00,417.45,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-15 20:27:27');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'punto_venta_rd'
--

--
-- Dumping routines for database 'punto_venta_rd'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-19  0:02:11
