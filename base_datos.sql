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
  `numero_caja` int(11) NOT NULL,
  `fecha_caja` date NOT NULL,
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
  UNIQUE KEY `unique_caja_dia` (`empresa_id`,`fecha_caja`,`numero_caja`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_caja` (`fecha_caja`),
  KEY `idx_fecha_apertura` (`fecha_apertura`),
  CONSTRAINT `cajas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cajas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cajas`
--

LOCK TABLES `cajas` WRITE;
/*!40000 ALTER TABLE `cajas` DISABLE KEYS */;
INSERT INTO `cajas` VALUES
(1,30,9,1,'2025-12-11',500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-11 04:17:33',NULL),
(2,5,13,2,'2025-12-11',4000.00,4000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-11 07:05:24','2025-12-11 07:05:50'),
(3,3,11,4,'2025-12-13',500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 01:36:07',NULL),
(4,2,10,5,'2025-12-13',200.00,500.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,300.00,'cerrada',NULL,'2025-12-13 01:43:46','2025-12-13 02:56:01'),
(5,2,21,6,'2025-12-13',110.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 01:45:59',NULL),
(6,2,10,8,'2025-12-13',0.00,200.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,200.00,'cerrada',NULL,'2025-12-13 02:56:20','2025-12-14 19:06:01'),
(7,5,13,9,'2025-12-13',5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-13 06:24:38','2025-12-14 22:55:07'),
(8,13,22,10,'2025-12-13',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-13 18:17:05',NULL),
(9,27,5,11,'2025-12-14',10000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 01:10:48',NULL),
(10,26,4,12,'2025-12-14',5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-14 04:20:01','2025-12-14 04:25:04'),
(11,26,4,13,'2025-12-14',5000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 04:25:31',NULL),
(12,15,25,14,'2025-12-14',23.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 17:04:59',NULL),
(13,28,7,15,'2025-12-14',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-14 17:36:02',NULL),
(14,2,10,16,'2025-12-14',0.00,20000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,20000.00,'cerrada',NULL,'2025-12-14 19:07:22','2025-12-14 23:24:20'),
(15,5,13,17,'2025-12-15',5000.00,5000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'cerrada',NULL,'2025-12-15 01:23:59','2025-12-16 08:53:58'),
(16,2,10,18,'2025-12-15',123456.00,123423.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,-33.00,'cerrada',NULL,'2025-12-15 02:03:30','2025-12-15 02:04:28'),
(17,2,10,19,'2025-12-15',12.00,1.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,-11.00,'cerrada',NULL,'2025-12-15 02:04:33','2025-12-15 02:04:44'),
(18,2,10,20,'2025-12-15',0.00,2000.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,2000.00,'cerrada','La maque','2025-12-15 02:05:13','2025-12-20 01:41:08'),
(19,16,26,21,'2025-12-15',200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-15 20:12:48',NULL),
(20,17,27,22,'2025-12-16',1000000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-16 00:35:29',NULL),
(21,5,13,23,'2025-12-16',5000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-16 08:54:12',NULL),
(22,25,3,24,'2025-12-17',0.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-17 18:33:14',NULL),
(23,18,28,25,'2025-12-17',700.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-17 18:57:00',NULL),
(24,19,29,26,'2025-12-18',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-18 17:04:40',NULL),
(25,15,25,15,'2025-12-19',123.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-19 17:14:42',NULL),
(26,2,10,21,'2025-12-19',1.00,2000.00,35.40,35.40,0.00,0.00,0.00,0.00,0.00,1963.60,'cerrada','Ns','2025-12-19 17:41:03','2025-12-20 01:41:43'),
(27,3,11,5,'2025-12-19',500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-19 17:45:53',NULL),
(28,2,21,22,'2025-12-19',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-19 18:51:29',NULL),
(29,16,26,22,'2025-12-20',3000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-20 00:03:23',NULL),
(30,2,10,23,'2025-12-20',1.00,2000.00,35.40,35.40,0.00,0.00,0.00,0.00,0.00,1963.60,'cerrada',NULL,'2025-12-20 00:23:47','2025-12-20 01:42:40'),
(31,2,10,24,'2025-12-20',200.00,500.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,300.00,'cerrada',NULL,'2025-12-20 02:10:00','2025-12-30 15:46:41'),
(32,27,5,12,'2025-12-20',100000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-20 04:04:43',NULL),
(33,33,39,1,'2025-12-20',500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-20 14:09:33',NULL),
(34,13,22,11,'2025-12-20',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-20 21:48:12',NULL),
(35,4,12,1,'2025-12-20',750.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-20 22:54:49',NULL),
(36,3,11,6,'2025-12-21',500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-21 17:42:33',NULL),
(37,2,10,25,'2025-12-21',100.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-21 17:47:36',NULL),
(38,2,10,26,'2025-12-24',200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-24 00:01:25',NULL),
(39,18,28,26,'2025-12-24',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-24 15:37:14',NULL),
(40,2,10,27,'2025-12-25',2000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-25 02:21:56',NULL),
(41,5,13,24,'2025-12-25',5000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-25 09:42:43',NULL),
(42,15,25,16,'2025-12-25',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-25 22:01:53',NULL),
(43,2,10,28,'2025-12-26',2000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-26 12:37:18',NULL),
(44,27,5,13,'2025-12-27',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-27 18:51:30',NULL),
(45,2,10,29,'2025-12-27',200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-27 19:45:17',NULL),
(46,34,40,1,'2025-12-27',200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-27 20:20:16',NULL),
(47,2,10,30,'2025-12-29',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-29 02:44:06',NULL),
(48,3,11,7,'2025-12-29',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-29 22:17:09',NULL),
(49,2,10,31,'2025-12-30',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-30 00:55:23',NULL),
(50,3,11,8,'2025-12-30',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-30 02:46:44',NULL),
(51,15,25,17,'2025-12-30',123.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-30 20:51:59',NULL),
(52,27,5,14,'2025-12-30',1500.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-30 23:11:48',NULL),
(53,2,10,32,'2025-12-31',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-31 00:01:53',NULL),
(54,35,41,1,'2025-12-31',0.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-31 14:03:27',NULL),
(55,18,28,27,'2025-12-31',50.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-31 14:39:52',NULL),
(56,3,11,9,'2025-12-31',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-31 16:43:23',NULL),
(57,15,25,18,'2025-12-31',12321.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2025-12-31 21:14:59',NULL),
(58,2,10,33,'2026-01-01',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-01 01:06:38',NULL),
(59,27,5,15,'2026-01-01',200.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-01 14:28:38',NULL),
(60,35,41,2,'2026-01-02',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-02 12:11:16',NULL),
(61,2,10,34,'2026-01-02',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-02 12:12:22',NULL),
(62,3,11,10,'2026-01-02',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-02 17:24:42',NULL),
(63,3,44,11,'2026-01-02',2.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-02 22:32:30',NULL),
(64,3,44,12,'2026-01-03',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-03 00:07:52',NULL),
(65,3,11,13,'2026-01-03',1000.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-03 02:19:22',NULL),
(66,27,5,16,'2026-01-03',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-03 03:32:43',NULL),
(67,2,10,35,'2026-01-03',1.00,NULL,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'abierta',NULL,'2026-01-03 16:21:34',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES
(1,27,'asdasd',NULL,1,'2025-12-09 23:07:26'),
(2,2,'Sodas','Kola real',1,'2025-12-10 00:37:47'),
(3,3,'Refrescos','Pequeño 30 grande 75',1,'2025-12-10 01:23:14'),
(4,3,'Pizza suprema','Completa',1,'2025-12-10 01:26:54'),
(5,5,'Cámaras',NULL,1,'2025-12-11 00:19:54'),
(6,5,'DVR',NULL,1,'2025-12-11 00:20:20'),
(8,4,'Perfumería',NULL,1,'2025-12-11 03:28:40'),
(9,4,'Polos de hombre',NULL,1,'2025-12-11 03:28:50'),
(10,15,'asdasd',NULL,1,'2025-12-14 17:30:34'),
(11,16,'vivere',NULL,1,'2025-12-15 20:14:26'),
(12,2,'Viveres',NULL,1,'2025-12-16 12:03:10'),
(13,2,'Viveres 2','Generales',1,'2025-12-20 02:11:00'),
(14,18,'Ropa','Ropa de niño',1,'2025-12-24 15:38:12'),
(15,34,'Jugos santal',NULL,1,'2025-12-27 20:21:29'),
(16,3,'Pizza',NULL,1,'2025-12-30 22:43:56'),
(17,2,'Almacen',NULL,1,'2025-12-31 12:45:50'),
(18,35,'Telas','Telas para tapicería y colchones',1,'2025-12-31 16:19:12'),
(19,35,'Accesorios para muebles','Patas, botones, y terminaciones de muebles y más',1,'2025-12-31 16:19:55');
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(4,27,1,'696-5852846-1','Elvis','Consumidor','849-429-1624','elvis6602@gmail.com','Calle Las Mercedes No. 528','Piantini','Santo Domingo','Distrito Nacional',NULL,NULL,1175.00,0,1,'2025-12-14 01:12:36','2025-12-19 23:30:43'),
(5,15,1,'267-8129761-1','brayan','Consumidor','809-875-7857','brayan1209@outlook.com','Av. Abraham Lincoln No. 572','Naco','Santo Domingo','Distrito Nacional',NULL,NULL,145.14,0,1,'2025-12-14 17:45:16','2025-12-14 17:45:21'),
(6,15,1,'247-7773595-5','brayan','Consumidor','849-428-9955','brayan7466@outlook.com','Calle Las Mercedes No. 362','Naco','Santo Domingo','Distrito Nacional',NULL,NULL,145.14,0,1,'2025-12-14 19:18:10','2025-12-14 19:18:10'),
(7,27,1,'TEMP1766203540730','Juan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7445.00,0,1,'2025-12-20 04:05:40','2025-12-20 04:06:26'),
(8,27,1,'TEMP1766205665943','Juan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0,1,'2025-12-20 04:41:05','2025-12-20 04:41:05'),
(9,33,1,'TEMP1766239854399','Juan Perez',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1534.00,0,1,'2025-12-20 14:10:54','2025-12-20 14:42:17'),
(10,27,1,'TEMP1766861522467','ELVIS',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0,1,'2025-12-27 18:52:02','2025-12-27 18:52:02'),
(11,27,1,'TEMP1766861836713','UU',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0,1,'2025-12-27 18:57:16','2025-12-27 18:57:16'),
(12,15,1,'TEMP1767132663855','asd',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,-213000.00,0,1,'2025-12-30 22:11:03','2025-12-30 22:11:09'),
(13,15,1,'TEMP1767132884481','asdasd',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,-23065.38,0,1,'2025-12-30 22:14:44','2025-12-30 22:15:00'),
(14,15,1,'TEMP1767135625507','asdasdsadsada',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0,1,'2025-12-30 23:00:25','2025-12-30 23:00:25'),
(15,27,1,'TEMP1767136382510','Juan honzales los cacaos al lado panaderia 9095881234',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,68400.00,0,1,'2025-12-30 23:13:02','2025-12-30 23:13:46'),
(16,15,1,'TEMP1767136826788','brayan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,14760.00,0,1,'2025-12-30 23:20:26','2025-12-30 23:21:01'),
(17,2,1,'40215504214','Angel','Batista','8494324597','lav@gmail.com','Valley','Tu','N','Fuarte','2025-12-31','prefiero_no_decir',0.00,0,1,'2025-12-31 14:11:09','2025-12-31 14:11:09'),
(18,2,1,'TEMP1767218349058','brayan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,353882.00,0,1,'2025-12-31 21:59:09','2025-12-31 21:59:42'),
(19,2,1,'TEMP1767295547501','pepe',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,167.00,0,1,'2026-01-01 19:25:47','2026-01-01 19:28:15'),
(20,2,1,'TEMP1767295975481','Juan Emilio',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1065.10,0,1,'2026-01-01 19:32:55','2026-01-01 19:36:40'),
(21,3,1,'TEMP1767399116705','Eliza',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1175.00,0,1,'2026-01-03 00:11:56','2026-01-03 00:12:02'),
(22,3,1,'TEMP1767403816001','Melvin perfumeria',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,405.00,0,1,'2026-01-03 01:30:16','2026-01-03 01:30:56'),
(23,27,1,'TEMP1767411344521','Fryi',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1710.00,0,1,'2026-01-03 03:35:44','2026-01-03 03:35:51');
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
  `metodo_pago` enum('efectivo','tarjeta_debito','tarjeta_credito','transferencia','cheque','mixto') NOT NULL DEFAULT 'efectivo',
  `efectivo_pagado` decimal(10,2) DEFAULT NULL,
  `cambio` decimal(10,2) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(27,27,1,26,'2025-12-15 20:27:27','Despacho completo','cerrado'),
(28,31,1,5,'2025-12-20 04:06:26','Despacho inicial parcial','activo'),
(29,47,1,10,'2025-12-30 22:02:27','Despacho inicial parcial','activo'),
(30,58,1,25,'2025-12-30 23:21:01','Despacho inicial parcial','activo'),
(31,58,2,25,'2025-12-30 23:21:43',NULL,'activo'),
(32,96,1,5,'2026-01-03 03:35:51','Despacho inicial parcial','activo'),
(33,96,2,5,'2026-01-03 03:36:13',NULL,'activo'),
(34,96,3,5,'2026-01-03 03:36:38',NULL,'activo');
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(33,27,33,2),
(34,28,37,1),
(35,28,38,11),
(36,29,54,1),
(37,30,65,1),
(38,31,65,20),
(39,32,105,1),
(40,33,105,1),
(41,34,105,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(33,27,198,2,2,0,34.98,69.96,0.00,69.96,12.59,82.55),
(34,28,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(35,29,198,1,1,0,34.98,34.98,0.00,34.98,6.30,41.28),
(36,30,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(37,31,127,1,1,0,1175.00,1175.00,0.00,1175.00,211.50,1386.50),
(38,31,179,11,11,0,570.00,6270.00,0.00,6270.00,1128.60,7398.60),
(39,32,218,1,1,0,1300.00,1300.00,0.00,1300.00,234.00,1534.00),
(40,33,2,6,6,0,30.00,180.00,0.00,180.00,32.40,212.40),
(41,34,2,19,19,0,30.00,570.00,0.00,570.00,102.60,672.60),
(42,35,59,1,1,0,250.00,250.00,0.00,250.00,45.00,295.00),
(43,36,17,1,1,0,1200.00,1200.00,0.00,1200.00,216.00,1416.00),
(44,37,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(45,38,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(46,39,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(47,40,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(48,41,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(49,42,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(50,43,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(51,44,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(52,45,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(53,46,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(54,47,2,2,1,1,30.00,60.00,0.00,60.00,10.80,70.80),
(55,48,197,1,1,0,123.00,123.00,0.00,123.00,22.14,145.14),
(56,49,197,1,1,0,123.00,123.00,0.00,123.00,24.60,147.60),
(57,50,25,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(58,51,17,1,1,0,1200.00,1200.00,0.00,1200.00,216.00,1416.00),
(59,52,17,1,1,0,1200.00,1200.00,0.00,1200.00,216.00,1416.00),
(60,53,221,1,1,0,500.00,500.00,0.00,500.00,90.00,590.00),
(61,54,221,1,1,0,500.00,500.00,0.00,500.00,90.00,590.00),
(62,55,223,1,1,0,1000.00,1000.00,0.00,1000.00,180.00,1180.00),
(63,56,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(64,57,179,120,120,0,570.00,68400.00,0.00,68400.00,12312.00,80712.00),
(65,58,197,100,21,79,123.00,12300.00,0.00,12300.00,2460.00,14760.00),
(66,59,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(67,60,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(68,61,2,2,2,0,30.00,60.00,0.00,60.00,10.80,70.80),
(69,62,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(70,63,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(71,64,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(72,65,22,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(73,66,4,100,100,0,30.00,3000.00,0.00,3000.00,540.00,3540.00),
(74,67,226,10000,10000,0,29.99,299900.00,0.00,299900.00,53982.00,353882.00),
(75,68,2,5,5,0,30.00,150.00,0.00,150.00,27.00,177.00),
(76,69,199,3,3,0,250.00,750.00,0.00,750.00,135.00,885.00),
(77,69,2,4,4,0,30.00,120.00,0.00,120.00,21.60,141.60),
(78,70,223,1,1,0,1000.00,1000.00,0.00,1000.00,180.00,1180.00),
(79,71,11,1,1,0,650.00,650.00,0.00,650.00,117.00,767.00),
(80,72,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(81,73,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(82,74,17,1,1,0,1200.00,1200.00,0.00,1200.00,216.00,1416.00),
(83,75,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(84,76,2,2,2,0,30.00,60.00,0.00,60.00,10.80,70.80),
(85,77,223,1,1,0,1000.00,1000.00,0.00,1000.00,180.00,1180.00),
(86,78,223,1,1,0,1000.00,1000.00,0.00,1000.00,180.00,1180.00),
(87,79,201,1,1,0,250.00,250.00,0.00,250.00,45.00,295.00),
(88,80,2,1,1,0,30.00,30.00,0.00,30.00,5.40,35.40),
(89,81,235,1,1,0,950.00,950.00,0.00,950.00,171.00,1121.00),
(90,82,17,1,1,0,1200.00,1200.00,0.00,1200.00,216.00,1416.00),
(91,83,265,1,1,0,300.00,300.00,0.00,300.00,54.00,354.00),
(92,84,236,1,1,0,500.00,500.00,0.00,500.00,90.00,590.00),
(93,85,235,1,1,0,950.00,950.00,0.00,950.00,171.00,1121.00),
(94,86,236,1,1,0,500.00,500.00,0.00,500.00,90.00,590.00),
(95,87,3,1,1,0,950.00,950.00,0.00,950.00,171.00,1121.00),
(96,88,231,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(97,89,229,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(98,90,249,1,1,0,350.00,350.00,0.00,350.00,63.00,413.00),
(99,91,231,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(100,91,22,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(101,92,283,1,1,0,350.00,350.00,0.00,350.00,63.00,413.00),
(102,93,261,1,1,0,300.00,300.00,0.00,300.00,54.00,354.00),
(103,94,22,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(104,95,200,1,1,0,750.00,750.00,0.00,750.00,135.00,885.00),
(105,96,179,3,3,0,570.00,1710.00,0.00,1710.00,307.80,2017.80);
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES
(1,'Empresa SuperAdmin','999-99999-9','SUPERADMIN EMPRESA SRL','SuperAdmin Store','Administración del sistema','Calle Principal #123','Sector Central','Santo Domingo','Distrito Nacional',NULL,NULL,'DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-09 22:53:25','2025-12-11 16:21:31'),
(2,'Barra 4 vientos','738-29292-9','Barra 4 vientos','Barra 4 vientos','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295844245','lasmellasserver@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 00:22:34','2025-12-15 13:05:18'),
(3,'Cheesepizza','511-06689-0','Cheesepizza','Cheesepizza','Comercio al por menor','Calle progreso frente a servicentro','La progreso','Nagua','Maria Trinidad Sanchez','8495025126','bmbrayanmartinez@icloud.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-10 01:18:31','2025-12-21 17:46:51'),
(4,'Exclusive Drips','PEND151318','Exclusive Drips','Exclusive Drips','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8292876233','ainhoahernandez04@icloud.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-10 02:02:31','2026-01-01 13:42:07'),
(5,'SentryTech Multiservices','087-00189-5','SentryTech Multiservices','SentryTech Multiservices','Comercio al por menor','Calle Hnas. Mirabal, Esq. Sanchez, Frente  a la Farmacia Abreu','Centro Pueblo','Fantino','Sanchez Ramirez','8096177188','juanrenandelacruz87@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF','Gracias por Elegirnos',NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-10 17:34:04','2026-01-01 13:41:17'),
(13,'Comedor maria','PEND051444','Comedor maria','Comedor maria','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8295844245','manuel23@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-13 18:04:11','2025-12-20 21:50:35'),
(15,'Empresa prueba','PEND381786','Empresa prueba','Empresa prueba','Comercio','Pendiente','Pendiente','Pendiente','Pendiente',NULL,NULL,'DOP','RD$','ITBIS',20.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-14 16:56:21','2025-12-30 22:14:20'),
(16,'conuco ramona','PEND534841','conuco ramona','conuco ramona','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','829 8172975','ramonaescolasticoortega@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-15 20:12:14','2025-12-30 17:19:27'),
(17,'VENDEDOR DE AGUAS DE PATA','PEND279566','VENDEDOR DE AGUAS DE PATA','VENDEDOR DE AGUAS DE PATA','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','829312018','leonkaurhot23@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-16 00:34:39','2026-01-01 19:06:05'),
(18,'D\' paca magica','PEND589076','D\' paca magica','D\' paca magica','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8496395590','anabelfelixgalan@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-17 18:53:09','2025-12-17 18:53:09'),
(19,'Locación de junior','PEND340442','Locación de junior','Locación de junior','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente','8494783337','junior07@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-18 17:02:20','2025-12-20 21:44:40'),
(21,'conuco ramona','182929369','conuco ramona','conuco ramona','Comercio','Por definir','Por definir','Por definir','Por definir','829 8172975','1@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 17:17:45','2025-12-21 03:51:47'),
(25,'CTMP','PEND0429821','CTMP','CTMP','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente',NULL,'emilioperezjavier@live.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 23:30:42','2026-01-01 13:41:38'),
(26,'Stop liquors','PEND0429991','Stop liquors','Stop liquors','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente',NULL,'alfredjuniorguzmancabada@gmai.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 23:30:42','2025-12-31 01:01:36'),
(27,'CENTRO FERRETERO KAYLER','PEND0430064','CENTRO FERRETERO KAYLER','CENTRO FERRETERO KAYLER','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Samaná',NULL,'elvishidalgo1971@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-19 23:30:43','2026-01-03 03:41:11'),
(28,'prueba','PEND0430218','prueba','prueba','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente',NULL,'negrolazo28@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 23:30:43','2025-12-20 21:44:14'),
(29,'Vendedor mayoreo','PEND0430294','Vendedor mayoreo','Vendedor mayoreo','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente',NULL,'zevem17@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 23:30:43','2026-01-01 13:41:03'),
(30,'La frescona','PEND0430327','La frescona','La frescona','Comercio al por menor','Direccion pendiente','Sector pendiente','Municipio pendiente','Provincia pendiente',NULL,'abreusosajeydi@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-19 23:30:43','2025-12-30 17:18:11'),
(31,'Exclusive Drips','PEND151318','Exclusive Drips','Exclusive Drips','Comercio','Por definir','Por definir','Por definir','Por definir','8292876233','ainhoahernandez04@icloud.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-20 00:21:39','2025-12-21 03:48:56'),
(32,'GemCraft Accesories ','012345678','Ha','GemCraft Accesories ','Comercio','Por definir','Por definir','Por definir','Por definir','8099610306','haderjaym@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-20 01:15:44','2025-12-20 01:15:44'),
(33,'Golden long Tech','333555551','MI EMPRESA SRL','Golden long Tech','Comercio','Por definir','Por definir','Por definir','Por definir','8498807415','shinobushopify36@gmail.com','DOP','RD$','ITBIS',2.00,NULL,'#FFFFFF','GRACIAS POR PREFERIRNOS',NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-20 14:08:57','2025-12-20 14:51:57'),
(34,'Colmado jando','001678558','Colmado jando ','Colmado jando','Comercio','Por definir','Por definir','Por definir','Por definir','8298874684','alcequiez01@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'prueba',0,'2025-12-27 20:19:25','2026-01-01 13:40:23'),
(35,'Mueblería Dionis','40224690384','Mueblería','Mueblería Dionis','Mueblería','C/ independencia , salida Cotui','Cueva abajo','Pimentel','Duarte','8293468943','dionimanuelhernadezvargas@gmail.com','DOP','RD$','ITBIS',18.00,NULL,'#FFFFFF','“Gracias por preferir Mueblería Dionis.”',NULL,NULL,NULL,NULL,NULL,NULL,'prueba',1,'2025-12-31 13:05:54','2025-12-31 14:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
INSERT INTO `gastos` VALUES
(1,33,'Compra de insumos',400.00,'Dieta',39,33,NULL,'4 empanadas','2025-12-20 14:36:00'),
(2,33,'Compra de insumos',200.00,'Dieta',39,33,'FAC-001',NULL,'2025-12-20 14:40:53');
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
(1,27,'asdasd',NULL,NULL,NULL,1,'2025-12-09 23:07:33'),
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
(1,'DOP','Peso Dominicano','RD$',1,'2025-12-19 17:08:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=209 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES
(1,2,2,'entrada',100,0,100,'Stock inicial',10,'Creacion de producto','2025-12-10 01:28:43'),
(2,2,4,'entrada',100,0,100,'Stock inicial',10,'Creacion de producto','2025-12-10 02:01:12'),
(3,1,9,'entrada',1,0,1,NULL,9,NULL,'2025-12-10 20:00:33'),
(4,3,11,'entrada',950,0,950,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 21:52:47'),
(5,3,11,'salida',300,950,650,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 21:56:37'),
(6,3,3,'entrada',950,0,950,'Ajuste manual',11,'Actualizacion de producto','2025-12-10 22:06:05'),
(7,3,12,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:08:57'),
(8,3,13,'entrada',350,0,350,'Stock inicial',11,'Creacion de producto','2025-12-10 22:14:02'),
(9,3,17,'entrada',1200,0,1200,'Stock inicial',11,'Creacion de producto','2025-12-10 22:16:37'),
(10,3,22,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:21:02'),
(11,3,25,'entrada',750,0,750,'Stock inicial',11,'Creacion de producto','2025-12-10 22:22:20'),
(12,3,22,'salida',1,750,749,'Venta B0200000000001',11,'Venta registrada - Comprobante Consumidor Final','2025-12-10 23:04:30'),
(13,3,59,'salida',1,250,249,'Venta B0200000000001',11,'Venta registrada - Comprobante Consumidor Final','2025-12-10 23:04:30'),
(14,5,114,'entrada',10,0,10,'Stock inicial',13,'Creacion de producto','2025-12-11 00:16:05'),
(15,5,114,'salida',1,10,9,'Venta B0200000000002',13,'Venta registrada - Comprobante Consumidor Final','2025-12-11 00:21:30'),
(16,4,139,'entrada',50,0,50,'Stock inicial',12,'Creacion de producto','2025-12-11 03:43:02'),
(17,4,141,'entrada',15,0,15,'Stock inicial',12,'Creacion de producto','2025-12-11 03:43:53'),
(18,4,148,'entrada',15,0,15,'Stock inicial',12,'Creacion de producto','2025-12-11 03:47:04'),
(19,4,139,'salida',2,50,48,'Venta B0200000000003',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:48:42'),
(20,4,148,'salida',1,15,14,'Venta B0200000000004',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:49:19'),
(21,4,148,'salida',3,14,11,'Venta B0200000000005',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:50:05'),
(22,4,141,'salida',1,15,14,'Venta B0200000000006',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 03:50:44'),
(23,4,143,'entrada',50,0,50,'Ajuste manual',12,'Ajuste de stock desde panel de productos','2025-12-11 03:52:47'),
(24,4,178,'entrada',40,0,40,'Stock inicial',12,'Creacion de producto','2025-12-11 04:32:14'),
(25,4,178,'salida',2,40,38,'Venta B0200000000009',12,'Venta registrada - Comprobante Consumidor Final','2025-12-11 04:34:32'),
(26,3,22,'devolucion',1,749,750,'Anulacion venta #1',11,'No se hizo ','2025-12-11 22:04:00'),
(27,3,59,'devolucion',1,249,250,'Anulacion venta #1',11,'No se hizo ','2025-12-11 22:04:00'),
(28,30,6,'salida',8,23,15,'Venta B0200000000012',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:54:37'),
(29,30,123,'salida',1,3,2,'Venta B0200000000013',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:56:10'),
(30,30,119,'salida',2,56,54,'Venta B0200000000014',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 22:56:51'),
(31,30,7,'salida',2,15,13,'Venta B0200000000015',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:12:45'),
(32,30,81,'salida',1,8,7,'Venta B0200000000016',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:13:39'),
(33,30,173,'salida',3,17,14,'Venta B0200000000017',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:15:47'),
(34,30,174,'salida',2,8,6,'Venta B0200000000018',9,'Venta registrada - Comprobante Consumidor Final','2025-12-11 23:18:58'),
(35,2,2,'salida',3,100,97,'Venta B0200000000023',10,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:08:07'),
(36,27,179,'salida',1,500,499,'Venta B0200000000024',5,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:11:50'),
(37,15,197,'salida',1,123,122,'Venta B0200000000025',25,'Venta registrada - Comprobante Consumidor Final','2025-12-14 19:18:10'),
(38,2,2,'salida',1,97,96,'Venta B0200000000026',10,'Venta registrada - Comprobante Consumidor Final','2025-12-15 19:09:54'),
(39,16,198,'salida',2,200,198,'Venta B0200000000027',26,'Venta registrada - Comprobante Consumidor Final','2025-12-15 20:27:27'),
(40,2,2,'salida',1,96,95,'B0200000001',10,'Venta VENTA000003','2025-12-19 18:46:20'),
(41,16,198,'salida',1,198,197,'B0200000002',26,'Venta VENTA000002','2025-12-20 00:05:59'),
(42,2,2,'salida',1,95,94,'B0200000003',10,'Venta VENTA000004','2025-12-20 00:24:22'),
(43,2,217,'entrada',200,0,200,'INVENTARIO_INICIAL',10,'Stock inicial del producto','2025-12-20 02:13:56'),
(44,27,127,'salida',1,1,0,'B0100000001',5,'Venta VENTA000010','2025-12-20 04:06:26'),
(45,27,179,'salida',11,499,488,'B0100000001',5,'Venta VENTA000010','2025-12-20 04:06:26'),
(46,33,218,'entrada',5,0,5,'INVENTARIO_INICIAL',39,'Stock inicial del producto','2025-12-20 14:18:16'),
(47,33,218,'salida',1,5,4,'B0100000002',39,'Venta VENTA000001','2025-12-20 14:42:17'),
(48,2,2,'salida',6,94,88,'B0200000004',10,'Venta VENTA000005','2025-12-26 12:38:43'),
(49,2,2,'salida',19,88,69,'B0200000005',10,'Venta VENTA000006','2025-12-27 19:50:59'),
(50,3,59,'salida',1,250,249,'B0200000006',11,'Venta VENTA000004','2025-12-29 22:25:39'),
(51,3,17,'salida',1,1200,1199,'B0200000007',11,'Venta VENTA000005','2025-12-29 22:45:37'),
(52,3,200,'salida',1,749,748,'B0200000008',11,'Venta VENTA000006','2025-12-29 22:56:48'),
(53,3,200,'devolucion',1,748,749,'Venta anulada #37',11,'jjj','2025-12-29 22:59:19'),
(54,3,17,'devolucion',1,1199,1200,'Venta anulada #36',11,'dhkl','2025-12-29 22:59:48'),
(55,3,59,'devolucion',1,249,250,'Venta anulada #35',11,'dndu!f','2025-12-29 23:07:58'),
(56,3,200,'salida',1,749,748,'B0200000009',11,'Venta VENTA000007','2025-12-29 23:41:45'),
(57,3,200,'devolucion',1,748,749,'Venta anulada #38',11,'s','2025-12-29 23:43:28'),
(58,2,2,'salida',1,69,68,'B0200000010',10,'Venta VENTA000007','2025-12-30 08:35:48'),
(59,2,2,'salida',1,68,67,'B0200000011',10,'Venta VENTA000008','2025-12-30 21:12:57'),
(60,2,2,'salida',1,67,66,'B0200000012',10,'Venta VENTA000009','2025-12-30 21:15:00'),
(61,2,2,'salida',1,66,65,'B0200000013',10,'Venta VENTA000010','2025-12-30 21:20:56'),
(62,2,2,'salida',1,65,64,'B0200000014',10,'Venta VENTA000011','2025-12-30 21:29:33'),
(63,2,2,'salida',1,64,63,'B0200000015',10,'Venta VENTA000012','2025-12-30 21:34:27'),
(64,3,200,'salida',1,749,748,'B0200000016',11,'Venta VENTA000008','2025-12-30 21:37:28'),
(65,2,2,'salida',1,63,62,'B0200000017',10,'Venta VENTA000013','2025-12-30 21:41:53'),
(66,2,2,'salida',1,62,61,'B0200000018',10,'Venta VENTA000014','2025-12-30 22:02:27'),
(67,15,197,'salida',1,122,121,'B0100000003',25,'Venta VENTA000003','2025-12-30 22:11:09'),
(68,15,197,'salida',1,121,120,'B0100000004',25,'Venta VENTA000004','2025-12-30 22:15:00'),
(69,3,25,'salida',1,750,749,'B0200000019',11,'Venta VENTA000009','2025-12-30 22:21:11'),
(70,3,17,'salida',1,1200,1199,'B0200000020',11,'Venta VENTA000010','2025-12-30 22:25:41'),
(71,3,17,'salida',1,1199,1198,'B0200000021',11,'Venta VENTA000011','2025-12-30 22:39:17'),
(72,3,200,'devolucion',1,748,749,'Venta anulada #45',11,'y','2025-12-30 22:41:03'),
(73,3,25,'devolucion',1,749,750,'Venta anulada #50',11,'y','2025-12-30 22:41:23'),
(74,3,17,'devolucion',1,1198,1199,'Venta anulada #52',11,'y','2025-12-30 22:41:32'),
(75,3,17,'devolucion',1,1199,1200,'Venta anulada #51',11,'y','2025-12-30 22:41:41'),
(76,3,221,'entrada',1000,0,1000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2025-12-30 22:46:04'),
(77,3,221,'salida',1,1000,999,'B0200000022',11,'Venta VENTA000012','2025-12-30 22:46:53'),
(78,3,221,'salida',1,999,998,'B0200000023',11,'Venta VENTA000013','2025-12-30 22:55:16'),
(79,3,221,'devolucion',1,998,999,'Venta anulada #54',11,'q','2025-12-30 23:01:07'),
(80,3,221,'devolucion',1,999,1000,'Venta anulada #53',11,'s','2025-12-30 23:01:15'),
(81,3,223,'entrada',1,0,1,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2025-12-30 23:03:36'),
(82,3,223,'salida',1,1,0,'B0200000024',11,'Venta VENTA000014','2025-12-30 23:05:04'),
(83,3,200,'salida',1,749,748,'B0200000025',11,'Venta VENTA000015','2025-12-30 23:12:44'),
(84,27,179,'salida',120,488,368,'B0200000026',5,'Venta VENTA000011','2025-12-30 23:13:46'),
(85,15,197,'salida',1,120,119,'B0100000005',25,'Venta VENTA000005','2025-12-30 23:21:01'),
(86,15,197,'salida',20,119,99,'Despacho 2 - Venta 58',25,'Despacho parcial','2025-12-30 23:21:43'),
(87,2,2,'salida',1,61,60,'B0200000027',10,'Venta VENTA000015','2025-12-31 00:02:16'),
(88,2,2,'salida',1,60,59,'B0200000028',10,'Venta VENTA000016','2025-12-31 11:55:55'),
(89,2,2,'salida',2,59,57,'B0200000029',10,'Venta VENTA000017','2025-12-31 12:01:16'),
(90,2,2,'salida',1,57,56,'B0200000030',10,'Venta VENTA000018','2025-12-31 12:34:29'),
(91,2,2,'salida',1,56,55,'B0200000031',10,'Venta VENTA000019','2025-12-31 12:43:13'),
(92,2,224,'entrada',150,0,150,'INVENTARIO_INICIAL',10,'Stock inicial del producto','2025-12-31 12:49:18'),
(93,2,2,'salida',1,55,54,'B0200000032',10,'Venta VENTA000020','2025-12-31 14:37:40'),
(94,3,22,'salida',1,750,749,'B0200000033',11,'Venta VENTA000016','2025-12-31 16:44:15'),
(95,3,223,'devolucion',1,0,1,'Venta anulada #55',11,'e','2025-12-31 16:45:12'),
(96,3,22,'devolucion',1,749,750,'Venta anulada #65',11,'e','2025-12-31 16:45:22'),
(97,3,200,'devolucion',1,748,749,'Venta anulada #56',11,'y','2025-12-31 16:45:43'),
(98,35,225,'entrada',1000,0,1000,'INVENTARIO_INICIAL',41,'Stock inicial del producto','2025-12-31 17:01:51'),
(99,2,4,'salida',100,100,0,'B0200000034',10,'Venta VENTA000021','2025-12-31 21:56:04'),
(100,2,4,'devolucion',100,0,100,'Venta anulada #66',10,'u','2025-12-31 21:56:29'),
(101,2,226,'entrada',100000,0,100000,'INVENTARIO_INICIAL',10,'Stock inicial del producto','2025-12-31 21:58:32'),
(102,2,226,'salida',10000,100000,90000,'B0100000006',10,'Venta VENTA000022','2025-12-31 21:59:42'),
(103,2,2,'salida',5,54,49,'B0200000035',10,'Venta VENTA000023','2026-01-01 19:28:15'),
(104,2,199,'salida',3,25,22,'B0200000036',10,'Venta VENTA000024','2026-01-01 19:36:40'),
(105,2,2,'salida',4,49,45,'B0200000036',10,'Venta VENTA000024','2026-01-01 19:36:40'),
(106,3,223,'salida',1,1,0,'B0200000037',11,'Venta VENTA000017','2026-01-02 17:25:18'),
(107,3,11,'salida',1,1,0,'B0200000038',11,'Venta VENTA000018','2026-01-02 17:32:15'),
(108,2,2,'salida',1,45,44,'B0200000039',10,'Venta VENTA000025','2026-01-02 17:34:25'),
(109,3,200,'salida',1,749,748,'B0200000040',11,'Venta VENTA000019','2026-01-02 17:36:14'),
(110,3,17,'salida',1,1200,1199,'B0200000041',11,'Venta VENTA000020','2026-01-02 17:38:47'),
(111,2,2,'salida',1,44,43,'B0200000042',10,'Venta VENTA000026','2026-01-02 18:33:29'),
(112,2,2,'salida',2,43,41,'B0200000043',10,'Venta VENTA000027','2026-01-02 19:56:12'),
(113,3,17,'devolucion',1,1199,1200,'Venta anulada #74',11,'Q','2026-01-02 21:47:54'),
(114,3,11,'devolucion',1,0,1,'Venta anulada #71',11,'O','2026-01-02 21:48:11'),
(115,3,223,'devolucion',1,0,1,'Venta anulada #70',11,'Q','2026-01-02 21:48:23'),
(116,3,223,'salida',1,1,0,'B0200000044',11,'Venta VENTA000021','2026-01-02 22:05:07'),
(117,3,223,'devolucion',1,0,1,'Venta anulada #77',11,'Q','2026-01-02 22:06:16'),
(118,3,223,'salida',1,1,0,'B0200000045',11,'Venta VENTA000022','2026-01-02 22:10:00'),
(119,3,223,'entrada',1000000000,0,1000000000,NULL,11,NULL,'2026-01-02 22:12:55'),
(120,3,13,'entrada',100000000,1,100000001,NULL,11,NULL,'2026-01-02 22:13:40'),
(121,3,201,'salida',1,250,249,'B0200000046',11,'Venta VENTA000023','2026-01-02 22:16:53'),
(122,3,13,'entrada',100000000,100000001,200000001,NULL,11,NULL,'2026-01-02 22:35:36'),
(123,3,13,'entrada',1000000,200000001,201000001,NULL,11,NULL,'2026-01-02 22:35:57'),
(124,3,201,'entrada',1000000,249,1000249,NULL,11,NULL,'2026-01-02 22:36:48'),
(125,3,201,'entrada',1000000,1000249,2000249,NULL,11,NULL,'2026-01-02 22:42:23'),
(126,3,201,'entrada',1000000,2000249,3000249,NULL,11,NULL,'2026-01-02 22:42:53'),
(127,3,17,'entrada',1000000,1200,1001200,NULL,11,NULL,'2026-01-02 22:43:21'),
(128,3,201,'entrada',1000000,3000249,4000249,NULL,11,NULL,'2026-01-02 22:45:00'),
(129,2,2,'salida',1,41,40,'B0200000047',10,'Venta VENTA000028','2026-01-02 23:08:43'),
(130,3,227,'entrada',1000000,0,1000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:25:06'),
(131,3,228,'entrada',1000000000,0,1000000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:27:46'),
(132,3,229,'entrada',1000000,0,1000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:28:11'),
(133,3,230,'entrada',100000000,0,100000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:28:54'),
(134,3,231,'entrada',1000000,0,1000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:29:35'),
(135,3,232,'entrada',1000000,0,1000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:29:49'),
(136,3,233,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:31:14'),
(137,3,234,'entrada',900000000,0,900000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:31:17'),
(138,3,235,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:32:40'),
(139,3,236,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:33:34'),
(140,3,237,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:35:40'),
(141,3,238,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:35:44'),
(142,3,239,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:36:35'),
(143,3,240,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:36:46'),
(144,3,241,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:37:29'),
(145,3,242,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:37:38'),
(146,3,243,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:38:44'),
(147,3,244,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:38:51'),
(148,3,245,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:39:30'),
(149,3,246,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:39:38'),
(150,3,247,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:40:46'),
(151,3,248,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:41:35'),
(152,3,249,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:42:51'),
(153,3,250,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:43:15'),
(154,3,251,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:43:42'),
(155,3,252,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:44:07'),
(156,3,253,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:44:28'),
(157,3,254,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:44:58'),
(158,3,255,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:45:07'),
(159,3,256,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:45:48'),
(160,3,257,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:45:59'),
(161,3,258,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:46:20'),
(162,3,259,'entrada',900000000,0,900000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:46:48'),
(163,3,260,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:47:13'),
(164,3,261,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:47:50'),
(165,3,262,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:47:57'),
(166,3,263,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:48:27'),
(167,3,264,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:48:40'),
(168,3,265,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:49:58'),
(169,3,266,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:50:51'),
(170,3,267,'entrada',900000000,0,900000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:51:07'),
(171,3,268,'entrada',1000000,0,1000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:51:31'),
(172,3,269,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:52:08'),
(173,3,270,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:52:09'),
(174,3,271,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:52:53'),
(175,3,272,'entrada',90000000,0,90000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:53:25'),
(176,3,273,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:55:37'),
(177,3,274,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:56:25'),
(178,3,275,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:57:30'),
(179,3,276,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:58:33'),
(180,3,277,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-02 23:59:51'),
(181,3,278,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:00:40'),
(182,3,279,'entrada',9000000,0,9000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:02:03'),
(183,3,280,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:02:12'),
(184,3,281,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:04:09'),
(185,3,282,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:05:20'),
(186,3,283,'entrada',100000000,0,100000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:06:00'),
(187,3,284,'entrada',10000000,0,10000000,'INVENTARIO_INICIAL',11,'Stock inicial del producto','2026-01-03 00:06:49'),
(188,3,201,'devolucion',1,4000249,4000250,'Venta anulada #79',44,'q','2026-01-03 00:08:00'),
(189,3,223,'devolucion',1,1000000000,1000000001,'Venta anulada #78',44,'a','2026-01-03 00:08:07'),
(190,3,235,'salida',1,9000000,8999999,'B0200000048',44,'Venta VENTA000024','2026-01-03 00:12:02'),
(191,3,17,'salida',1,1001200,1001199,'B0200000049',44,'Venta VENTA000025','2026-01-03 00:19:15'),
(192,3,265,'salida',1,9000000,8999999,'B0200000050',44,'Venta VENTA000026','2026-01-03 00:21:42'),
(193,3,236,'salida',1,9000000,8999999,'B0200000051',44,'Venta VENTA000027','2026-01-03 00:35:35'),
(194,3,235,'salida',1,8999999,8999998,'B0200000052',44,'Venta VENTA000028','2026-01-03 00:45:18'),
(195,3,236,'salida',1,8999999,8999998,'B0200000053',44,'Venta VENTA000029','2026-01-03 00:53:31'),
(196,3,3,'salida',1,1,0,'B0200000054',44,'Venta VENTA000030','2026-01-03 01:01:36'),
(197,3,231,'salida',1,1000000,999999,'B0200000055',44,'Venta VENTA000031','2026-01-03 01:16:44'),
(198,3,229,'salida',1,1000000,999999,'B0200000056',44,'Venta VENTA000032','2026-01-03 01:27:08'),
(199,3,249,'salida',1,90000000,89999999,'B0200000057',44,'Venta VENTA000033','2026-01-03 01:30:56'),
(200,3,231,'salida',1,999999,999998,'B0200000058',44,'Venta VENTA000034','2026-01-03 01:41:49'),
(201,3,22,'salida',1,750,749,'B0200000058',44,'Venta VENTA000034','2026-01-03 01:41:49'),
(202,3,283,'salida',1,100000000,99999999,'B0200000059',44,'Venta VENTA000035','2026-01-03 02:26:57'),
(203,3,261,'salida',1,9000000,8999999,'B0200000060',44,'Venta VENTA000036','2026-01-03 02:27:48'),
(204,3,22,'salida',1,749,748,'B0200000061',44,'Venta VENTA000037','2026-01-03 02:28:52'),
(205,3,200,'salida',1,748,747,'B0200000062',44,'Venta VENTA000038','2026-01-03 02:39:13'),
(206,27,179,'salida',1,368,367,'B0100000007',5,'Venta VENTA000012','2026-01-03 03:35:51'),
(207,27,179,'salida',1,367,366,'Despacho 2 - Venta 96',5,'Despacho parcial','2026-01-03 03:36:13'),
(208,27,179,'salida',1,366,365,'Despacho 3 - Venta 96',5,'Despacho parcial','2026-01-03 03:36:38');
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
(1,'generico','Acceso al dashboard','dashboard.view','Ver dashboard principal',1,'2025-12-19 17:08:35'),
(2,'reportes','Ver reportes','reportes.view','Acceso a módulo de reportes',1,'2025-12-19 17:08:35'),
(3,'reportes','Exportar reportes','reportes.export','Exportar reportes a PDF/Excel',1,'2025-12-19 17:08:35'),
(4,'configuracion','Ver configuración','configuracion.view','Acceso a configuración',1,'2025-12-19 17:08:35'),
(5,'configuracion','Editar configuración','configuracion.edit','Modificar configuración',1,'2025-12-19 17:08:35'),
(6,'ventas','Ver ventas','ventas.view','Ver listado de ventas',1,'2025-12-19 17:08:35'),
(7,'ventas','Crear ventas','ventas.create','Realizar nuevas ventas',1,'2025-12-19 17:08:35'),
(8,'ventas','Editar ventas','ventas.edit','Modificar ventas',1,'2025-12-19 17:08:35'),
(9,'ventas','Anular ventas','ventas.delete','Anular ventas',1,'2025-12-19 17:08:35'),
(10,'clientes','Ver clientes','clientes.view','Ver listado de clientes',1,'2025-12-19 17:08:35'),
(11,'clientes','Crear clientes','clientes.create','Registrar nuevos clientes',1,'2025-12-19 17:08:35'),
(12,'clientes','Editar clientes','clientes.edit','Modificar datos de clientes',1,'2025-12-19 17:08:35'),
(13,'clientes','Eliminar clientes','clientes.delete','Eliminar clientes',1,'2025-12-19 17:08:35'),
(14,'productos','Ver productos','productos.view','Ver listado de productos',1,'2025-12-19 17:08:35'),
(15,'productos','Crear productos','productos.create','Registrar nuevos productos',1,'2025-12-19 17:08:35'),
(16,'productos','Editar productos','productos.edit','Modificar productos',1,'2025-12-19 17:08:35'),
(17,'productos','Eliminar productos','productos.delete','Eliminar productos',1,'2025-12-19 17:08:35'),
(18,'inventario','Ver inventario','inventario.view','Ver inventario',1,'2025-12-19 17:08:35'),
(19,'inventario','Ajustar inventario','inventario.adjust','Realizar ajustes de inventario',1,'2025-12-19 17:08:35'),
(20,'caja','Abrir caja','caja.open','Abrir caja',1,'2025-12-19 17:08:35'),
(21,'caja','Cerrar caja','caja.close','Cerrar caja',1,'2025-12-19 17:08:35'),
(22,'caja','Ver movimientos caja','caja.view','Ver movimientos de caja',1,'2025-12-19 17:08:35'),
(23,'compras','Ver compras','compras.view','Ver listado de compras',1,'2025-12-19 17:08:35'),
(24,'compras','Crear compras','compras.create','Registrar nuevas compras',1,'2025-12-19 17:08:35'),
(25,'proveedores','Ver proveedores','proveedores.view','Ver listado de proveedores',1,'2025-12-19 17:08:35'),
(26,'proveedores','Crear proveedores','proveedores.create','Registrar nuevos proveedores',1,'2025-12-19 17:08:35');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plataforma_config`
--

DROP TABLE IF EXISTS `plataforma_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plataforma_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_plataforma` varchar(200) NOT NULL DEFAULT 'Punto de Venta RD',
  `logo_url` varchar(255) DEFAULT NULL,
  `email_contacto` varchar(100) DEFAULT NULL,
  `telefono_contacto` varchar(20) DEFAULT NULL,
  `telefono_whatsapp` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `color_primario` varchar(7) DEFAULT '#3B82F6',
  `color_secundario` varchar(7) DEFAULT '#1E40AF',
  `copyright` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plataforma_config`
--

LOCK TABLES `plataforma_config` WRITE;
/*!40000 ALTER TABLE `plataforma_config` DISABLE KEYS */;
INSERT INTO `plataforma_config` VALUES
(1,'ISIWEEK',NULL,'angelluisbm9@gmail.com','8494324597','8494324597','Calle Hernán cabral casa 102','#3B82F6','#1E40AF','© 2026 ISIWEEK Angel Luis Batista Mendoza , All Right Reserved.','2025-12-19 17:08:35','2026-01-01 14:37:28'),
(2,'Punto de Venta RD','https://cdn.isiweek.com/uploads/76832c01-2ff6-44ea-ade5-c7aaec4f52fe.jpg','admin@puntoventa.com',NULL,NULL,NULL,'#3B82F6','#1E40AF','© 2025 IziWeek. Todos los derechos reservados.','2025-12-09 22:53:23','2025-12-09 22:53:23');
/*!40000 ALTER TABLE `plataforma_config` ENABLE KEYS */;
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
  `imagen_url` varchar(1000) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=285 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES
(2,2,'7330042999392','REFR-30042998-4803','Refresco','Coca-Cola',2,NULL,2,20.00,30.00,25.00,25.00,6,40,5,100,NULL,1,1,NULL,'LT-20251210-033793955',NULL,'2025-12-10 01:28:43','2026-01-02 23:08:43'),
(3,3,'7330128282910','SUPR-30128282-0808','Pizza Suprema de 12 pedazo',NULL,4,NULL,1,950.00,950.00,950.00,950.00,950,0,950,950,NULL,0,1,NULL,'LT-20251210-041644493',NULL,'2025-12-10 01:29:52','2026-01-03 01:01:36'),
(4,2,'7331753556554','CON-31753556-0647','Refresco','Uva Kola Real',2,NULL,2,20.00,30.00,25.00,25.00,6,100,5,100,NULL,1,1,NULL,'LT-20251210-751200751',NULL,'2025-12-10 02:01:12','2025-12-31 21:56:29'),
(6,30,'7396572258717','BHA-96572258-9583','Bhama','Mediana',NULL,NULL,NULL,134.00,160.00,NULL,NULL,6,15,5,100,NULL,0,1,NULL,'LT-20251210-569084376',NULL,'2025-12-10 19:56:39','2025-12-19 23:30:43'),
(7,30,'7396606712064','BHAM-96606711-7959','Bhama','Pequeña',NULL,NULL,NULL,89.00,110.00,NULL,NULL,6,13,5,100,NULL,0,1,NULL,'LT-20251210-604304028',NULL,'2025-12-10 19:57:05','2025-12-19 23:30:43'),
(9,1,'7396729572935','AGU-96729571-1223','Agua planeta azul',NULL,NULL,NULL,NULL,10.00,15.00,NULL,NULL,6,1,5,100,NULL,0,1,NULL,'LT-20251210-714116134',NULL,'2025-12-10 19:59:12','2025-12-19 17:08:43'),
(11,3,'7403286415101','PIZZ-03286414-8700','Pizza suprema de 8 pedazo','Suprema',4,NULL,NULL,650.00,650.00,650.00,650.00,650,1,5,100,NULL,0,1,NULL,'LT-20251210-272931876',NULL,'2025-12-10 21:49:18','2026-01-02 21:48:11'),
(12,3,'7404416261200','PIZZ-04416261-5081','Pizza suprema de 4 pedazo',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,1,350,350,NULL,0,1,NULL,'LT-20251210-411350650',NULL,'2025-12-10 22:08:57','2025-12-19 17:08:43'),
(13,3,'7404645907125','CARZ-04645907-3764','Calzón supremo',NULL,NULL,NULL,NULL,350.00,350.00,350.00,350.00,350,201000001,350,350,NULL,0,1,NULL,'LT-20251210-572173528',NULL,'2025-12-10 22:14:02','2026-01-02 22:35:57'),
(17,3,'7404926033004','MET-04926033-3357','Metro pizza suprema 16 pedazos',NULL,NULL,NULL,NULL,1200.00,1200.00,1200.00,1200.00,1200,1001199,1200,1200,NULL,0,1,NULL,'LT-20251210-922287877',NULL,'2025-12-10 22:16:37','2026-01-03 00:19:15'),
(22,3,'7405054697384','PIZZ-05054697-8882','Pizza de 12 pedazos de jamón',NULL,NULL,NULL,1,750.00,750.00,750.00,750.00,750,748,750,750,NULL,0,1,NULL,'LT-20251210-041069694',NULL,'2025-12-10 22:21:02','2026-01-03 02:28:52'),
(25,3,'7405273104812','PD1-05273103-6492','Pizza de 12 pedazos de maíz',NULL,NULL,NULL,1,750.00,750.00,750.00,750.00,750,750,750,750,NULL,0,1,NULL,'LT-20251210-269092455',NULL,'2025-12-10 22:22:20','2025-12-30 22:41:23'),
(59,3,'7407281755441','BRE-07281755-4399','Breadstiks',NULL,NULL,NULL,NULL,250.00,250.00,250.00,250.00,250,250,5,100,NULL,0,0,NULL,'LT-20251210-278493111',NULL,'2025-12-10 22:55:50','2025-12-29 23:07:58'),
(81,30,'7409635524048','MAC-09635524-6104','Mack Albert 350 ml',NULL,NULL,NULL,NULL,290.00,350.00,NULL,NULL,6,7,1,100,NULL,0,1,NULL,'LT-20251210-628713087',NULL,'2025-12-10 23:35:00','2025-12-19 23:30:43'),
(114,5,'7412027296234','DVR-12027295-3003','XVR UNV 4 Canales','DVR Marca UNV',NULL,NULL,1,1980.00,2500.00,2360.00,2200.00,2,9,2,100,NULL,1,1,NULL,'LT-20251211-022318830',NULL,'2025-12-11 00:16:05','2025-12-19 17:08:43'),
(119,30,'7413086715567','ENE-13086715-7388','Energy 911',NULL,NULL,NULL,NULL,39.00,50.00,NULL,NULL,6,54,1,100,NULL,0,1,NULL,'LT-20251211-078519658',NULL,'2025-12-11 00:32:00','2025-12-19 23:30:43'),
(123,30,'7413541985915','BRU-13541983-8105','Brugal añejo 700ml',NULL,NULL,NULL,NULL,575.00,700.00,NULL,NULL,6,2,1,100,NULL,0,1,NULL,'LT-20251211-491451076',NULL,'2025-12-11 00:39:35','2025-12-19 23:30:43'),
(127,27,'7413801757692','BAR-13801757-8709','Barceló imperial 700ml',NULL,NULL,NULL,NULL,800.00,1175.00,NULL,NULL,6,0,1,100,NULL,0,1,NULL,'LT-20251211-793939557',NULL,'2025-12-11 00:44:03','2025-12-20 04:06:26'),
(139,4,'7424528078377','LAP-24528077-0946','Lapto Dell',NULL,8,5,1,300.00,600.00,500.00,450.00,6,46,5,100,NULL,0,1,NULL,'LT-20251211-523748221',NULL,'2025-12-11 03:43:02','2025-12-19 17:08:43'),
(141,4,'7424589959193','CAM-24589958-5084','Camisa',NULL,9,3,1,1650.00,3000.00,2500.00,2200.00,6,12,5,100,NULL,0,1,NULL,'LT-20251211-587216294',NULL,'2025-12-11 03:43:53','2025-12-19 17:08:43'),
(143,4,'7424640125953','POL-24640124-6114','Polo natica',NULL,9,3,1,1650.00,2500.00,2200.00,1.00,6,48,5,100,NULL,0,1,NULL,'LT-20251211-638419560',NULL,'2025-12-11 03:44:34','2025-12-19 17:08:43'),
(148,4,'7424714572689','T-SH-24714571-3673','T-shirt',NULL,9,5,1,1250.00,2200.00,1650.00,1500.00,6,10,5,100,NULL,0,1,NULL,'LT-20251211-699246857',NULL,'2025-12-11 03:47:04','2025-12-19 17:08:43'),
(173,30,'7425969448435','KOLA-25969447-0840','Kola real 400 ml',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,14,5,100,NULL,0,1,NULL,'LT-20251211-962923627',NULL,'2025-12-11 04:06:33','2025-12-19 23:30:43'),
(174,30,'7426010269903','MIN-26010268-3470','Minute maid 355',NULL,NULL,NULL,NULL,11.00,15.00,NULL,NULL,6,6,2,100,NULL,0,1,NULL,'LT-20251211-997251424',NULL,'2025-12-11 04:07:21','2025-12-19 23:30:43'),
(178,4,'7427440147063','JEA-27440147-1251','jeans de hombre',NULL,NULL,NULL,NULL,1650.00,2800.00,2500.00,2400.00,6,36,5,100,NULL,0,1,NULL,'LT-20251211-435603396',NULL,'2025-12-11 04:32:14','2025-12-19 17:08:43'),
(179,27,'Cem','CEM-74844322-3529','Cemento gris fda',NULL,1,1,1,510.00,570.00,560.00,540.00,50,365,5,1000,NULL,0,1,NULL,'LT-20251214-840148605',NULL,'2025-12-14 01:15:57','2026-01-03 03:36:38'),
(196,15,'7734281999396','ASDA-34281838-2083','asdasdsad','asdasdsad',10,6,7,123.00,123.00,NULL,NULL,6,123,5,100,NULL,1,0,NULL,'LT-20251214-279791270',NULL,'2025-12-14 17:44:49','2025-12-19 17:08:43'),
(197,15,'7736996341442','ASD-36996339-7157','asdasdsad',NULL,NULL,NULL,NULL,122.96,123.00,NULL,NULL,6,99,5,100,NULL,1,1,NULL,'LT-20251214-972511540',NULL,'2025-12-14 18:30:14','2025-12-30 23:21:43'),
(198,16,'7829695594272','PLA-29695593-5486','platano','verde',11,NULL,NULL,24.99,34.98,NULL,NULL,6,197,19,100,NULL,1,1,NULL,'LT-20251215-689446658',NULL,'2025-12-15 20:19:17','2025-12-20 00:05:59'),
(199,2,'7886624654899','GUIN-86624653-6555','Guineo','Verde',12,NULL,1,200.00,250.00,NULL,NULL,6,22,5,100,NULL,1,1,NULL,'LT-20251216-615776752',NULL,'2025-12-16 12:05:17','2026-01-01 19:36:40'),
(200,3,'','','Pizza 12 pedazos jamón',NULL,NULL,NULL,NULL,750.00,750.00,NULL,NULL,6,747,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2026-01-03 02:39:13'),
(201,3,'','','Breadstiks',NULL,NULL,NULL,NULL,250.00,250.00,NULL,NULL,6,4000250,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2026-01-03 00:08:00'),
(202,5,'','','DVR 4 canales',NULL,NULL,NULL,NULL,1980.00,2500.00,NULL,NULL,6,9,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(203,4,'','','Laptop',NULL,NULL,NULL,NULL,300.00,600.00,NULL,NULL,6,46,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(204,4,'','','Camisa',NULL,NULL,NULL,NULL,1650.00,3000.00,NULL,NULL,6,12,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(205,4,'','','Polo',NULL,NULL,NULL,NULL,1650.00,2500.00,NULL,NULL,6,48,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(206,4,'','','Jeans',NULL,NULL,NULL,NULL,1650.00,2800.00,NULL,NULL,6,36,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(207,1,'','','Bhama pequeña',NULL,NULL,NULL,NULL,89.00,110.00,NULL,NULL,6,13,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(208,1,'','','Mack Albert',NULL,NULL,NULL,NULL,290.00,350.00,NULL,NULL,6,7,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(209,1,'','','Brugal añejo',NULL,NULL,NULL,NULL,575.00,700.00,NULL,NULL,6,2,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(210,1,'','','Barceló Imperial',NULL,NULL,NULL,NULL,800.00,1175.00,NULL,NULL,6,1,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(211,1,'','','Energy 911',NULL,NULL,NULL,NULL,39.00,50.00,NULL,NULL,6,54,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(212,1,'','','Kola Real 400ml',NULL,NULL,NULL,NULL,16.00,25.00,NULL,NULL,6,14,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(213,1,'','','Minute Maid',NULL,NULL,NULL,NULL,11.00,15.00,NULL,NULL,6,6,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(214,1,'','','Cemento',NULL,NULL,NULL,NULL,510.00,570.00,NULL,NULL,6,499,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(215,15,'','','Producto prueba',NULL,NULL,NULL,NULL,123.00,123.00,NULL,NULL,6,122,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(216,16,'','','Platano',NULL,NULL,NULL,NULL,24.99,34.98,NULL,NULL,6,198,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-19 17:08:43','2025-12-19 17:08:43'),
(217,2,'994113160729','P-3110','Plátano maduro','Plátano fia',13,NULL,1,25.00,35.00,NULL,NULL,6,200,20,100,NULL,1,1,NULL,NULL,NULL,'2025-12-20 02:13:56','2025-12-20 02:13:56'),
(218,33,'489440312043','T-7683','Teclado Gamesir G7','Teclado mecanico negro, de switch rojo, 60%',NULL,NULL,1,640.00,1300.00,1250.00,NULL,6,4,2,100,NULL,1,1,NULL,NULL,NULL,'2025-12-20 14:18:16','2025-12-20 14:42:17'),
(219,34,'278210979582','L-1756','limon','Limón verde',NULL,NULL,1,10.00,15.00,NULL,NULL,6,0,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-27 20:23:59','2025-12-27 20:26:44'),
(220,3,'760966148617','P-4682','Pizza de 8 pedazos jamón',NULL,NULL,NULL,6,500.00,500.00,NULL,NULL,6,0,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-30 22:06:32','2025-12-30 22:06:32'),
(221,3,'360541626992','P-8507','Pizza de 8 pedazos de jamón',NULL,16,NULL,1,500.00,500.00,NULL,NULL,6,1000,5,100,NULL,1,1,NULL,NULL,NULL,'2025-12-30 22:46:04','2025-12-30 23:01:15'),
(222,3,'892352161849','U-9169','Martes especial dos pizza de 12 pedazos más un refresco',NULL,NULL,NULL,1,1000.00,1000.00,1000.00,NULL,6,0,1000000,1000000,NULL,1,1,NULL,NULL,NULL,'2025-12-30 22:51:38','2026-01-02 22:00:53'),
(223,3,'959420107662','E-9455','Especial de pizza de 12 pedazos más y refresco',NULL,NULL,NULL,1,1000.00,1000.00,1000.00,1000.00,6,1000000001,1000000,1000000,NULL,1,0,NULL,NULL,NULL,'2025-12-30 23:03:36','2026-01-03 00:08:07'),
(224,2,'978838986908','T-8883','Taladro','Makita',17,NULL,1,1000.00,1500.00,NULL,NULL,6,150,10,100,NULL,1,1,NULL,NULL,NULL,'2025-12-31 12:49:18','2025-12-31 12:49:18'),
(225,35,'718647544843','T-1886','Tela','Tela Holanda',NULL,NULL,1,105.00,160.00,145.00,155.00,20,1000,200,5000,NULL,1,1,NULL,NULL,'Al lado de la oficina','2025-12-31 17:01:51','2025-12-31 17:01:51'),
(226,2,'669748378948','P-7542','prueba','asdasdasdsadsad',17,NULL,6,20.00,29.99,NULL,NULL,6,90000,5,100,'https://cdn.isiweek.com/uploads/a40a734b-9de5-4ce4-ba01-83047bb1a988.jpeg',1,1,NULL,NULL,NULL,'2025-12-31 21:58:32','2025-12-31 21:59:42'),
(227,3,'607261623962','P-4865','Pizza de 12 pedazos de boloñesa',NULL,16,NULL,6,800.00,800.00,NULL,NULL,0,1000000,1000000,1000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:25:06','2026-01-02 23:25:06'),
(228,3,'732281319050','P-9383','Pizza de 12 pedazos de pollo',NULL,16,NULL,6,800.00,800.00,NULL,NULL,0,1000000000,100000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:27:46','2026-01-02 23:27:46'),
(229,3,'228547058674','P-6829','Pizza de 12 pedazo de maíz',NULL,NULL,NULL,6,750.00,750.00,NULL,NULL,0,999999,1000000,1000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:28:11','2026-01-03 01:27:08'),
(230,3,'329844915697','PIZ-3306','Pizza de 12 pedazos De tocineta',NULL,16,NULL,6,750.00,750.00,NULL,NULL,0,100000000,1000000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:28:54','2026-01-02 23:28:54'),
(231,3,'468621156395','P-3118','Pizza de 12 pedazo de pepperoni',NULL,NULL,NULL,6,750.00,750.00,NULL,NULL,0,999998,1000000,1000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:29:35','2026-01-03 01:41:49'),
(232,3,'930194289685','PIZ-1691','Pizza de 12 pedazos De peperonni',NULL,16,NULL,6,750.00,750.00,NULL,NULL,0,1000000,1000000,1000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:29:49','2026-01-02 23:29:49'),
(233,3,'351601847444','P-6623','Pizza de 12 pedazo de mega queso',NULL,NULL,NULL,6,750.00,750.00,NULL,NULL,0,9000000,9000000,9000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:31:14','2026-01-02 23:31:14'),
(234,3,'801586606589','PIZ-2082','Pizza de 12 pedazos De mega queso',NULL,16,NULL,6,750.00,750.00,NULL,NULL,0,900000000,90000000,90000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:31:17','2026-01-02 23:31:17'),
(235,3,'374859177840','PIZ-9310','Pizza de 12 pedazos suprema de pollo',NULL,16,NULL,6,950.00,950.00,NULL,NULL,0,8999998,9000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:32:40','2026-01-03 00:45:18'),
(236,3,'983994664718','P-7592','Pizza de 8 pedazo de maíz',NULL,NULL,NULL,6,500.00,500.00,NULL,NULL,6,8999998,9000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:33:34','2026-01-03 00:53:31'),
(237,3,'806577515945','PIZ-4300','Pizza de 12 pedazos Camarones a la crema',NULL,16,NULL,6,1200.00,1200.00,NULL,NULL,0,9000000,9000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:35:40','2026-01-02 23:35:40'),
(238,3,'318195576663','P-6887','Pizza de 8 pedazo de pepperoni',NULL,NULL,NULL,6,500.00,500.00,NULL,NULL,6,10000000,10000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:35:44','2026-01-02 23:35:44'),
(239,3,'955507326873','PIZ-1301','Pizza de 12 pedazos Napolitana',NULL,16,NULL,6,900.00,900.00,NULL,NULL,0,9000000,9000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:36:35','2026-01-02 23:36:35'),
(240,3,'346688633946','P-5469','Pizza de 8 pedazo mega queso',NULL,NULL,NULL,6,500.00,500.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:36:46','2026-01-02 23:36:46'),
(241,3,'548928445691','P-7961','Pizza de 8 pedazo boloñesa',NULL,NULL,NULL,6,550.00,550.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:37:29','2026-01-02 23:37:29'),
(242,3,'376385089629','PIZ-8833','Pizza de 12 pedazos Vegetales',NULL,16,NULL,6,900.00,900.00,NULL,NULL,0,9000000,5000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:37:38','2026-01-02 23:37:38'),
(243,3,'350788670346','P-2578','Pizza de 8 pedazo tocineta',NULL,NULL,NULL,6,500.00,500.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:38:44','2026-01-02 23:38:44'),
(244,3,'831873228212','PIZ-2704','Pizza de 12 pedazos  Especial carne',NULL,16,NULL,6,950.00,950.00,NULL,NULL,0,9000000,50000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:38:51','2026-01-02 23:38:51'),
(245,3,'192341005911','P-7749','Pizza de 8 pedazo de pollo',NULL,NULL,NULL,6,550.00,550.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:39:30','2026-01-02 23:39:30'),
(246,3,'619335059131','PIZ-8803','Pizza de 12 pedazos Hawaiana',NULL,16,NULL,6,900.00,900.00,900.00,900.00,0,9000000,5000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:39:38','2026-01-02 23:39:38'),
(247,3,'176865362349','P-4937','Pizza de 8 pedazo jamón y maíz',NULL,NULL,NULL,6,550.00,550.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:40:46','2026-01-02 23:40:46'),
(248,3,'653143238853','P-4317','Pizza de 4 pedazos suprema de pollo',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,90000000,50000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:41:35','2026-01-02 23:41:35'),
(249,3,'257110374256','PIZ-2934','Pizza de 4 pedazos Pollo a la crema',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,89999999,5000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:42:51','2026-01-03 01:30:56'),
(250,3,'589574541296','P-7018','Pizza de 8 pedazo suprema de pollo',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:43:15','2026-01-02 23:43:15'),
(251,3,'803921082710','PIZ-2209','Pizza de 4 pedazos Camarones a la crema',NULL,16,NULL,6,450.00,450.00,NULL,NULL,0,9000000,5000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:43:42','2026-01-02 23:43:42'),
(252,3,'683521250641','P-1110','Pizza de 8 pedazo pollo a la crema',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:44:07','2026-01-02 23:44:07'),
(253,3,'634088319345','PIZ-2105','Pizza de 4 pedazos Napolitana',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,90000000,5000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:44:28','2026-01-02 23:44:28'),
(254,3,'633585629971','P-5702','Pizza de 8 pedazo camarones a la crema',NULL,NULL,NULL,6,850.00,850.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:44:58','2026-01-02 23:44:58'),
(255,3,'638421833199','PIZ-5959','Pizza de 4 pedazos De vegetales',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,90000000,5000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:45:07','2026-01-02 23:45:07'),
(256,3,'170640829316','P-9920','Pizza de 8 pedazo napolitana',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:45:48','2026-01-02 23:45:48'),
(257,3,'648874566336','PIZ-1539','Pizza de 4 pedazos Especial de carne',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,90000000,50000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:45:59','2026-01-02 23:45:59'),
(258,3,'693430899299','P-3870','Pizza de 8 pedazo vegetales',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,5,100,NULL,1,1,NULL,NULL,NULL,'2026-01-02 23:46:20','2026-01-02 23:46:20'),
(259,3,'906885349658','PIZ-4957','Pizza de 4 pedazos Hawaiana',NULL,16,NULL,6,350.00,350.00,NULL,NULL,0,900000000,50000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:46:48','2026-01-02 23:46:48'),
(260,3,'663210227878','P-4391','Pizza de 8 pedazo',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:47:13','2026-01-02 23:47:13'),
(261,3,'162982794363','PIZ-1854','Pizza de 4 pedazos De jamon',NULL,16,NULL,6,300.00,300.00,NULL,NULL,0,8999999,50000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:47:50','2026-01-03 02:27:48'),
(262,3,'529974088906','P-8479','Pizza de 8 pedazo especial de carne',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:47:57','2026-01-02 23:47:57'),
(263,3,'966812164446','PIZ-2366','Pizza de 4 pedazos De maiz',NULL,16,NULL,6,300.00,300.00,NULL,NULL,0,9000000,50000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:48:27','2026-01-02 23:48:27'),
(264,3,'402588036662','P-2828','Pizza de 8 pedazo hawaiana',NULL,NULL,NULL,6,650.00,650.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:48:40','2026-01-02 23:48:40'),
(265,3,'828317663229','PIZ-5128','Pizza de 4 pedazos De peperonni',NULL,16,NULL,6,300.00,300.00,NULL,NULL,0,8999999,50000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:49:58','2026-01-03 00:21:42'),
(266,3,'770688815395','C-3532','Calzón de jamón',NULL,NULL,NULL,6,300.00,300.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:50:51','2026-01-02 23:50:51'),
(267,3,'355467014077','PIZ-7406','Pizza de 4 pedazos De mega queso',NULL,16,NULL,6,300.00,300.00,NULL,NULL,0,900000000,90000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:51:07','2026-01-02 23:51:07'),
(268,3,'496945490362','C-8304','Calzón de maíz',NULL,NULL,NULL,6,300.00,300.00,NULL,NULL,6,1000000,1000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:51:31','2026-01-02 23:51:31'),
(269,3,'996753310623','C-5698','Calzón de pepperoni',NULL,NULL,NULL,6,300.00,300.00,NULL,NULL,6,10000000,10000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:52:08','2026-01-02 23:52:08'),
(270,3,'605268720515','PIZ-3681','Pizza de 4 pedazos De boloñesa',NULL,16,NULL,6,325.00,325.00,NULL,NULL,0,90000000,500000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:52:09','2026-01-02 23:52:09'),
(271,3,'319202358015','C-3814','Calzón de mega queso',NULL,NULL,NULL,6,300.00,300.00,NULL,NULL,6,10000000,1000000,100000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:52:53','2026-01-02 23:52:53'),
(272,3,'488327303062','PIZ-9153','Pizza de 4 pedazos De tocineta',NULL,16,NULL,6,300.00,300.00,NULL,NULL,0,90000000,50000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:53:25','2026-01-02 23:53:25'),
(273,3,'224384876513','C-3116','Calzón de boloñesa',NULL,NULL,NULL,6,325.00,325.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:55:37','2026-01-02 23:55:37'),
(274,3,'984140457602','C-2643','Calzón de tocineta',NULL,NULL,NULL,6,300.00,300.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:56:25','2026-01-02 23:56:25'),
(275,3,'657996273048','C-4116','Calzón de pollo',NULL,NULL,NULL,6,325.00,325.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:57:30','2026-01-02 23:57:30'),
(276,3,'612220457311','C-5302','Calzón de jamón y maíz',NULL,NULL,NULL,6,325.00,325.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:58:33','2026-01-02 23:58:33'),
(277,3,'903018423244','C-8994','Calzón supremo de pollo',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-02 23:59:51','2026-01-02 23:59:51'),
(278,3,'379759703998','C-5377','Calzón de pollo a la crema',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:00:40','2026-01-03 00:00:40'),
(279,3,'298790257286','PIZ-3071','Pizza de 4 pedazos Pollo',NULL,16,NULL,6,325.00,325.00,NULL,NULL,6,9000000,600000000,1000000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:02:03','2026-01-03 00:02:03'),
(280,3,'294230192102','C-9834','Calzón de camarones a la crema',NULL,NULL,NULL,6,450.00,450.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:02:12','2026-01-03 00:02:12'),
(281,3,'306330667338','C-3619','Calzón de especial de carne',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:04:09','2026-01-03 00:04:09'),
(282,3,'668348746097','C-1089','Calzón napolitano',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:05:20','2026-01-03 00:05:20'),
(283,3,'675962507086','C-6263','Calzón de vegetales',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,99999999,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:06:00','2026-01-03 02:26:57'),
(284,3,'650213796514','C-8071','Calzón hawaiano',NULL,NULL,NULL,6,350.00,350.00,NULL,NULL,6,10000000,10000000,10000000,NULL,0,1,NULL,NULL,NULL,'2026-01-03 00:06:49','2026-01-03 00:06:49');
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
(1,'vendedor','Vendedor con permisos limitados',1,'2025-12-19 17:08:35'),
(2,'cajero','Cajero con acceso a caja y ventas',1,'2025-12-19 17:08:35'),
(3,'inventario','Encargado de inventario',1,'2025-12-19 17:08:35');
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
(1,1,21,'2025-12-19 17:08:35'),
(2,1,20,'2025-12-19 17:08:35'),
(3,1,22,'2025-12-19 17:08:35'),
(4,1,11,'2025-12-19 17:08:35'),
(5,1,10,'2025-12-19 17:08:35'),
(6,1,1,'2025-12-19 17:08:35'),
(7,1,14,'2025-12-19 17:08:35'),
(8,1,7,'2025-12-19 17:08:35'),
(9,1,6,'2025-12-19 17:08:35'),
(16,2,21,'2025-12-19 17:08:35'),
(17,2,20,'2025-12-19 17:08:35'),
(18,2,22,'2025-12-19 17:08:35'),
(19,2,10,'2025-12-19 17:08:35'),
(20,2,1,'2025-12-19 17:08:35'),
(21,2,14,'2025-12-19 17:08:35'),
(22,2,7,'2025-12-19 17:08:35'),
(23,2,6,'2025-12-19 17:08:35'),
(31,3,24,'2025-12-19 17:08:35'),
(32,3,23,'2025-12-19 17:08:35'),
(33,3,1,'2025-12-19 17:08:35'),
(34,3,19,'2025-12-19 17:08:35'),
(35,3,18,'2025-12-19 17:08:35'),
(36,3,15,'2025-12-19 17:08:35'),
(37,3,16,'2025-12-19 17:08:35'),
(38,3,14,'2025-12-19 17:08:35'),
(39,3,26,'2025-12-19 17:08:35'),
(40,3,25,'2025-12-19 17:08:35');
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
  `empresa_id` int(11) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_empresa` (`empresa_id`,`name`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_name` (`name`),
  KEY `idx_empresa` (`empresa_id`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `settings_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,NULL,'app_logo','https://cdn.isiweek.com/uploads/76832c01-2ff6-44ea-ade5-c7aaec4f52fe.jpg','2025-12-19 17:08:43',1);
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
  `cedula` varchar(20) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_registro`
--

LOCK TABLES `solicitudes_registro` WRITE;
/*!40000 ALTER TABLE `solicitudes_registro` DISABLE KEYS */;
INSERT INTO `solicitudes_registro` VALUES
(1,'Barra 4 vientos','PEND26154347','lasmellasserver@gmail.com','$2b$10$nyS6VQ4igyeha1lzNR02A.kys6Nui2QmMZkT1kflbNVOczCUNewNK','8295844245','Barra 4 vientos','PEND154347','Barra 4 vientos','rechazada','2025-12-10 00:22:34','2025-12-19 17:39:04','No'),
(2,'Cheesepizza','PEND29511066','bmbrayanmartinez@icloun.com','$2b$10$mX0OYQ5pURF6j6wlgP.fiezzd7ac8s37OI1uxNid8SwlDCQtNhFCq','8495025126','Cheesepizza','PEND511066','Cheesepizza','aprobada','2025-12-10 01:18:31','2025-12-19 17:18:23',NULL),
(3,'Exclusive Drips','PEND32151318','ainhoahernandez04@icloud.com','$2b$10$Sq7g7WAxh3e34n7AbIoyP.OCNJZpGSUck5Yo1y1ZpUy.d9zjyETFC','8292876233','Exclusive Drips','PEND151318','Exclusive Drips','aprobada','2025-12-10 02:02:31','2025-12-20 00:21:39',NULL),
(4,'SentryTech Multiservices ','PEND88044802','juanrenandelacruz87@gmail.com','$2b$10$9ygReirC07OTlZzzgp2Zzu7k8zQ84GxahyIoxukCA9GB274T4fVWC','8096177188','SentryTech Multiservices ','PEND044802','SentryTech Multiservices ','aprobada','2025-12-10 17:34:04','2025-12-19 17:18:18',NULL),
(5,'Tupapa','PEND11083317','prueba2@gmail.com','$2b$10$RQaqZXy8lQqZxOpOoN0viewxW75AJ0EWNTP1Ck5jekwOmvVDDlAMe','8295543767','Tupapa','PEND083317','Tupapa','rechazada','2025-12-10 23:58:03','2025-12-19 17:38:50','No'),
(6,'D\'Vicell','PEND56179796','frankelis071@gmail.com','$2b$10$qU.UWnumxm8W6k6WLB9l7eUm2QzuTQQR49g2xh366m1Kwc4ArBYmy','8293086775','D\'Vicell','PEND179796','D\'Vicell','rechazada','2025-12-11 12:29:39','2025-12-20 00:21:34','Si\n'),
(7,'Pruebal','PEND70707852','elpruebal@gmail.com','$2b$10$15ABb/KFwlHkwUf0DDAqV.W.hEHFHodiMLxuPIOnp62XdOdolp6CS','8292191548','Pruebal','PEND707852','Pruebal','rechazada','2025-12-11 16:31:47','2025-12-20 00:21:26','Si'),
(8,'Klk','PEND00712155','mendoza@gmail.com','$2b$10$roZHK5kVsDMAo763kmTmtOYoktXLf0T1DjbMKGk4VjhgS13dp50.y','8295844245','Klk','PEND712155','Klk','rechazada','2025-12-12 00:51:52','2025-12-19 17:37:26','No'),
(9,'Universidad Nacional San Luis Gonzaga','PEND06800956','giancarlos@gmail.com','$2b$10$rIShttmaXqIRqgeiEEjQT.M0f0ajWD2IosJn7Sh3G9Rgklu3JFUwm','957786282','Universidad Nacional San Luis Gonzaga','PEND800956','Universidad Nacional San Luis Gonzaga','rechazada','2025-12-12 02:33:20','2025-12-19 17:37:20','No'),
(10,'SmartCities','PEND13082838','infoeliasar12@gmail.com','$2b$10$WDdjYfBL5mL12ZddQylW0OEqmYc8t5a06GfOvc6o6PWcTHLh.O.vy','916367507','SmartCities','PEND082838','SmartCities','rechazada','2025-12-12 04:18:02','2025-12-19 17:18:04','Jaja'),
(11,'Comedor maria','PEND49051444','manuel@gmail.com','$2b$10$SP.UbVjUiyu.l5YukTa7Mun.eaVDP3DRjw.4qMnCLfo.gj3S.D0I.','8295844245','Comedor maria','PEND051444','Comedor maria','rechazada','2025-12-13 18:04:11','2025-12-20 00:21:18','Si'),
(12,'Comedor maria','PEND49273060','manuel2@gmail.com','$2b$10$/LzTbcOlQWEvO2koJhGBlesh0x0MFPetHElFrJg4LfeUX7rSaPPQK','84597643484','Comedor maria','PEND273060','Comedor maria','rechazada','2025-12-13 18:07:53','2025-12-19 17:37:04','No'),
(13,'conuco ramona','PEND29534841','ramonaescolasticoortega@gmail.com','$2b$10$46Y2SazV1Ch7LpBz9ETXyOh50iylQ8puc15U9GrMIlE8Afn94xvCy','829 8172975','conuco ramona','PEND534841','conuco ramona','aprobada','2025-12-15 20:12:14','2025-12-19 17:17:45',NULL),
(14,'VENDEDOR DE AGUAS DE PATA','PEND45279566','leonkaurhot23@gmail.com','$2b$10$Eko7iuRPtepydwDWqh11hudkFxJp3/gytoQmtNhmeX0basAq85cPy','829312018','VENDEDOR DE AGUAS DE PATA','PEND279566','VENDEDOR DE AGUAS DE PATA','aprobada','2025-12-16 00:34:39','2025-12-19 17:18:48',NULL),
(15,'D\' paca magica','PEND97589076','anabelfelixgalan@gmail.com','$2b$10$Z.WbPpSiI3.GvNH77XZKSO4kfmHFo1FzE0FQ5q2E50iFvmnZCCla.','8496395590','D\' paca magica','PEND589076','D\' paca magica','aprobada','2025-12-17 18:53:09','2025-12-19 17:17:25',NULL),
(16,'Locación de junior','PEND77340442','junior07@gmail.com','$2b$10$P27mrvISODZc9hnJskg0OeVaysQJkRWwDhDV9lSHHV7Q1wzLkCQku','8494783337','Locación de junior','PEND340442','Locación de junior','rechazada','2025-12-18 17:02:20','2025-12-19 17:17:39','Jaja'),
(17,'Haderjay Marte Mendoza ','07100630818','haderjaym@gmail.com','$2b$12$A0Aispg/FCMT3RRFavy4/ee0p7YzPNkGKk3xaH2mvYZdhXrgXGRRK','8099610306','GemCraft Accesories ','012345678','Ha','aprobada','2025-12-20 01:13:13','2025-12-20 01:15:44',NULL),
(18,'marcos perez','12876534','mariano@gmail.com','$2b$12$lAACnFKxSXOOyaa.ZqsgNeS/CxZCcvBx/n8U9Nb8yDuekR4/6B5Iu','1238766453','Marianos agent, C.A','12387465-1','empresa','rechazada','2025-12-20 01:38:45','2025-12-20 01:49:29','No se quién eres'),
(19,'Abel Alfred Hochmair Nuñez ','40240930525','shinobushopify36@gmail.com','$2b$12$YVmyN7k6btfA6Qf2oFfJeeP2fvYAuf1ulx5fMsvEI.0b3oyemnlFq','8098462670','Golden long Tech ','333555551','MI EMPRESA SRL ','aprobada','2025-12-20 14:07:54','2025-12-20 14:08:57',NULL),
(20,'Naruto','402-1550421-4','naruto@gmail.com','$2b$12$wYJb/P/UaewVUebkPUp3y.oI9ckIPmrtEw.eF5pfTdOFK3yavWJae','8495025126','BRAZZERS','PEND511066','BRAZZERS','rechazada','2025-12-20 21:40:42','2025-12-20 21:41:57','Sí '),
(21,'Colmado','07100428098','alcequiez01@gmail.com','$2b$12$KLbyp/JiUeQPR9cezFW93ebzqNC5dhK7nXniJ422mYlRdsY48KG6C','8298874684','Colmado jando','001678558','Colmado jando ','aprobada','2025-12-27 20:19:15','2025-12-27 20:19:25',NULL);
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
(1,'B01','Comprobante Credito Fiscal','B01',1,10000000,8,1,1,1,1),
(2,'B02','Comprobante Consumidor Final','B02',1,10000000,63,0,0,0,1),
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
(2,'ML','Mililitro','ml',0),
(3,'GR','Gramo','gr',0),
(6,'CJ','Caja','cj',0),
(7,'PQ','Paquete','pq',0),
(8,'SET','Set/Conjunto','set',0);
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
  `empresa_id` int(11) DEFAULT NULL,
  `rol_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,1,NULL,'ANGEL LUIS BATISTA MENDOZA','40215504214','angelluisbm9@gmail.com','https://cdn.isiweek.com/uploads/4706be2c-0341-479c-92e8-a04957c0b238.png','$2b$12$Wo5n9e6tsiiYOUI0yCBYJ.aCiKQvZrn5JfSM/DWZYw8EPoTrG3u.y','superadmin',1,'2025-12-08 10:38:52','2026-01-01 14:18:43'),
(3,25,NULL,'CTMP','PEND93804511','emilioperezjavier@live.com','https://api.dicebear.com/7.x/bottts/svg?seed=Sophie','$2b$10$BG0tXb4JxHyrkmq0nUe.her8g3OU80b6r4rTwrtuGIcyoP7AIxejW','admin',1,'2025-12-09 23:01:45','2025-12-19 23:30:42'),
(4,26,NULL,'Stop liquors','PEND95912795','alfredjuniorguzmancabada@gmai.com',NULL,'$2b$10$tGYYWzGtqksmuUsdVL5sduUlXcNwXDX80/Pa8OKIFk2QbvOI4BBsS','admin',0,'2025-12-09 23:01:45','2025-12-31 01:00:26'),
(5,27,NULL,'CENTRO FERRETERO KAYLER','PEND05035479','elvishidalgo1971@gmail.com',NULL,'$2b$10$L4rBwCaOFQYHMEYR5x5U/.z48IDCx0L4GTlsrGVAu5p1cQjc5VcYq','admin',1,'2025-12-09 23:01:45','2025-12-19 23:30:43'),
(7,28,1,'prueba','402-1550421-4','negrolazo28@gmail.com',NULL,'$2b$10$ZZp8YMgU43SMENgy8sqKNOEa92pyQDolr9nfV/XDRE0y/7ZJcDLkO','vendedor',1,'2025-12-09 23:01:45','2025-12-19 23:30:43'),
(8,29,1,'Vendedor mayoreo','123-4567890-1','zevem17@gmail.com',NULL,'$2b$10$r6xYuqqZucISbmnudgVu5e0gUanLRWXSXXeWtutno6EcH4doOG9S.','vendedor',1,'2025-12-09 23:01:45','2025-12-19 23:30:43'),
(9,30,NULL,'La frescona','PEND90214289','abreusosajeydi@gmail.com',NULL,'$2b$10$1vpswNNpnl/AhTQNgBUq..F0qhbBZeHC64OzdjXXMO7uzyBlgSnGi','admin',1,'2025-12-09 23:01:45','2025-12-19 23:30:43'),
(10,2,NULL,'Barra 4 vientos','40271719929','lasmellasserver@gmail.com','https://cdn.isiweek.com/uploads/295cee6e-8569-400e-a311-654428ddd9e0.png','$2b$10$xAz6b3IC.1uQeppF.sJmtuiH3a50QJYAfMiRarqFpCAlATydZfsBi','admin',1,'2025-12-10 00:22:34','2025-12-29 02:54:34'),
(11,3,NULL,'Cheesepizza','40212381335','bmbrayanmartinez@icloud.com','https://api.dicebear.com/7.x/bottts/svg?seed=Aneka','$2b$10$mX0OYQ5pURF6j6wlgP.fiezzd7ac8s37OI1uxNid8SwlDCQtNhFCq','admin',1,'2025-12-10 01:18:31','2025-12-15 17:28:05'),
(12,4,NULL,'Exclusive Drips','PEND3215131g','ainhoahernahndez04@icloud.com',NULL,'$2b$10$Sq7g7WAxh3e34n7AbIoyP.OCNJZpGSUck5Yo1y1ZpUy.d9zjyETFC','admin',1,'2025-12-10 02:02:31','2025-12-21 03:47:40'),
(13,5,NULL,'SentryTech Multiservices','08700189569','juanrenandelacruz87@gmail.com','https://api.dicebear.com/7.x/bottts/svg?seed=SentryTech%20Multiservices','$2b$10$9ygReirC07OTlZzzgp2Zzu7k8zQ84GxahyIoxukCA9GB274T4fVWC','admin',1,'2025-12-10 17:34:04','2025-12-11 07:04:43'),
(21,2,1,'Vendedor','402-1550421-4','somos@gmail.com',NULL,'$2b$10$a3ii8rAT9kPmt/3vwkHcPuSD.AIhxawcNc3L7TJqaUod75UzUnpZ6','vendedor',0,'2025-12-13 01:45:36','2025-12-20 21:54:10'),
(22,13,NULL,'Comedor maria','PEND49051444','manuel@gmail.com',NULL,'$2b$10$YJSjCYer6IegOi6YOn018uqta4RKK6aRT8cO532MZB0pq4sDqTr5.','admin',1,'2025-12-13 18:04:11','2025-12-16 00:48:30'),
(24,1,NULL,'Super Admin Pruebas','000-0000000-0','root2@admin.com',NULL,'$2b$12$k6K/3sxl/6A1s4wBR7iJnulKFCsLe7GqIFBwEhwx8NpgaL8cCbAta','superadmin',1,'2025-12-14 16:55:02','2025-12-14 16:55:02'),
(25,15,NULL,'prueba','123-1231231-2','prueba@gmail.com','https://cdn.isiweek.com/uploads/df4a874d-ccf8-43a2-a2da-a31d22b71079.png','$2b$10$Wm7v6zL1SsQ9bN0/z74Zvei1AhNuuO2yMLXZv3UtyWyZWZIfXItmC','admin',1,'2025-12-14 16:56:21','2025-12-19 17:24:28'),
(26,16,NULL,'conuco ramona','PEND29534841','ramonaescolasticoortega@gmail.com',NULL,'$2b$10$46Y2SazV1Ch7LpBz9ETXyOh50iylQ8puc15U9GrMIlE8Afn94xvCy','admin',1,'2025-12-15 20:12:14','2025-12-15 20:12:20'),
(27,17,NULL,'VENDEDOR DE AGUAS DE PATA','402-1901351-9','leonkaurhot23@gmail.com',NULL,'$2b$10$Eko7iuRPtepydwDWqh11hudkFxJp3/gytoQmtNhmeX0basAq85cPy','superadmin',1,'2025-12-16 00:34:39','2025-12-16 00:44:15'),
(28,18,NULL,'D\' paca magica','PEND97589076','anabelfelixgalan@gmail.com',NULL,'$2b$10$Z.WbPpSiI3.GvNH77XZKSO4kfmHFo1FzE0FQ5q2E50iFvmnZCCla.','admin',1,'2025-12-17 18:53:09','2025-12-17 18:53:39'),
(29,19,NULL,'Locación de junior','PEND77340442','junior07@gmail.com',NULL,'$2b$10$P27mrvISODZc9hnJskg0OeVaysQJkRWwDhDV9lSHHV7Q1wzLkCQku','admin',1,'2025-12-18 17:02:20','2025-12-20 00:19:05'),
(30,NULL,NULL,'Super Administrador','000-0000000-0','admin@gmail.com',NULL,'$2b$12$fNt4pjqp6An26WLrOQi0LOYTg7H0XaZvH7vcibVtZsptbjpLcwMgS','superadmin',1,'2025-12-19 17:14:36','2025-12-19 21:53:04'),
(31,NULL,NULL,'Brayan Super Admin','000-0000000-1','brayan@gmail.com',NULL,'$2b$12$fNt4pjqp6An26WLrOQi0LOYTg7H0XaZvH7vcibVtZsptbjpLcwMgS','superadmin',1,'2025-12-19 17:14:36','2025-12-19 21:53:04'),
(33,21,NULL,'conuco ramona','PEND29534841','ramonaescolasticoortega@gmail.com',NULL,'$2b$10$46Y2SazV1Ch7LpBz9ETXyOh50iylQ8puc15U9GrMIlE8Afn94xvCy','admin',1,'2025-12-19 17:17:45','2025-12-19 17:17:45'),
(37,31,NULL,'Exclusive Drips','PEND32151318','ainhoahernandez04@icloud.com',NULL,'$2b$10$Sq7g7WAxh3e34n7AbIoyP.OCNJZpGSUck5Yo1y1ZpUy.d9zjyETFC','admin',1,'2025-12-20 00:21:39','2025-12-20 00:21:39'),
(38,32,NULL,'Haderjay Marte Mendoza ','07100630818','haderjaym@gmail.com',NULL,'$2b$12$A0Aispg/FCMT3RRFavy4/ee0p7YzPNkGKk3xaH2mvYZdhXrgXGRRK','admin',1,'2025-12-20 01:15:44','2025-12-20 01:15:44'),
(39,33,NULL,'Abel Alfred Hochmair Nuñez','40240930525','shinobushopify36@gmail.com',NULL,'$2b$10$t6FSvx00hvSzjanvadO5qeG6ca6c6O4gdtxF/Y8IjtjtrjNLc42yy','admin',0,'2025-12-20 14:08:57','2025-12-31 01:00:36'),
(40,34,NULL,'Colmado','07100428098','alcequiez01@gmail.com',NULL,'$2b$12$KLbyp/JiUeQPR9cezFW93ebzqNC5dhK7nXniJ422mYlRdsY48KG6C','admin',1,'2025-12-27 20:19:25','2025-12-27 20:19:25'),
(41,35,NULL,'Dionis Hernández vargas','40224690384','dionimanuelhernadezvargas@gmail.com',NULL,'$2b$10$rDUGFzhWEbVY5O7sEj8UhuxrZoTJG3fysAnbo/zcCj.wGkrIs0.Bq','admin',1,'2025-12-31 13:10:35','2025-12-31 13:10:35'),
(42,35,2,'Rumilky','402-1234408-5','loammyr_17.20@icloud.com',NULL,'$2b$10$84FXiOySvHr5kK0xJAjo6OU5Rh/YrTQKVwkf5I1aCkdq6oeOixbzW','vendedor',1,'2025-12-31 14:42:49','2025-12-31 14:42:49'),
(43,15,1,'brayan','21312312312321','prueba2@gmail.com',NULL,'$2b$10$3ukX06cPp5BmWkqwehQJVusPmwJmh8rJ1t89DQdghw/Uy/ssyHVrm','vendedor',1,'2025-12-31 21:15:31','2025-12-31 21:15:31'),
(44,3,2,'Kiara','00202938314','bm5267909@gmail.com',NULL,'$2b$10$SRqdaShIkeHkNaBmj61waemCLgLr7wwviBrMIKs5I6gZjdj6wCU2G','vendedor',1,'2026-01-02 22:31:46','2026-01-02 22:31:46');
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
  `tipo` varchar(50) DEFAULT NULL,
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
  KEY `idx_venta` (`venta_id`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha_creacion`),
  CONSTRAINT `venta_extras_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venta_extras_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venta_extras_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_extras`
--

LOCK TABLES `venta_extras` WRITE;
/*!40000 ALTER TABLE `venta_extras` DISABLE KEYS */;
INSERT INTO `venta_extras` VALUES
(1,19,3,11,'ingrediente','Pepperoni',1.00,150.00,0,18.00,150.00,0.00,150.00,NULL,'2025-12-13 15:38:18'),
(2,36,3,11,'delivery','Tomate',1.00,25.00,0,18.00,25.00,0.00,25.00,NULL,'2025-12-29 22:45:37'),
(3,37,3,11,'delivery','Pepperoni',1.00,125.00,0,18.00,125.00,0.00,125.00,NULL,'2025-12-29 22:56:48'),
(4,38,3,11,'ingrediente','Pepperoni',1.00,125.00,0,18.00,125.00,0.00,125.00,NULL,'2025-12-29 23:41:45'),
(5,54,3,11,'otro','Peperonni  100 delivery25',1.00,125.00,0,18.00,125.00,0.00,125.00,NULL,'2025-12-30 22:55:16'),
(6,55,3,11,'otro','Una de pollo y una de pepperoni',1.00,50.00,0,18.00,50.00,0.00,50.00,NULL,'2025-12-30 23:05:04'),
(7,69,2,10,'delivery','El concho',1.00,75.00,1,18.00,75.00,13.50,88.50,'Me cago en ti','2026-01-01 19:36:40'),
(8,72,2,10,'ingrediente','Cola',1.00,25.00,0,18.00,25.00,0.00,25.00,NULL,'2026-01-02 17:34:25'),
(9,81,3,44,'otro','Borde.de queso y delivery',1.00,225.00,0,18.00,225.00,0.00,225.00,NULL,'2026-01-03 00:12:02'),
(10,82,3,44,'delivery','Delivery',1.00,50.00,0,18.00,50.00,0.00,50.00,NULL,'2026-01-03 00:19:15'),
(11,83,3,44,'delivery','Delivery',1.00,25.00,0,18.00,25.00,0.00,25.00,NULL,'2026-01-03 00:21:42'),
(12,87,3,44,'otro','Delivery',1.00,25.00,0,18.00,25.00,0.00,25.00,NULL,'2026-01-03 01:01:36'),
(13,89,3,44,'otro','Jamon',1.00,50.00,0,18.00,50.00,0.00,50.00,NULL,'2026-01-03 01:27:08'),
(14,90,3,44,'otro','Deliery y refresco',1.00,55.00,0,18.00,55.00,0.00,55.00,NULL,'2026-01-03 01:30:56'),
(15,92,3,44,'otro','Delivery',1.00,55.00,0,18.00,55.00,0.00,55.00,NULL,'2026-01-03 02:26:57'),
(16,93,3,44,'otro','Delivery',1.00,25.00,0,18.00,25.00,0.00,25.00,NULL,'2026-01-03 02:27:48'),
(17,94,3,44,'otro','Miaz.',1.00,50.00,0,18.00,50.00,0.00,50.00,NULL,'2026-01-03 02:28:52'),
(18,95,3,44,'otro','Pepperoni y pollo',1.00,150.00,0,18.00,150.00,0.00,150.00,NULL,'2026-01-03 02:39:13');
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
  `caja_id` int(11) DEFAULT NULL,
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
  KEY `idx_caja` (`caja_id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`tipo_comprobante_id`) REFERENCES `tipos_comprobante` (`id`),
  CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `ventas_ibfk_4` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ventas_ibfk_5` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES
(1,3,2,'B0200000000001','V-00000001',11,NULL,NULL,1000.00,0.00,1000.00,0.00,1000.00,'efectivo','completa',1,1050.00,50.00,'anulada','No se hizo ',NULL,'01','1',NULL,'no_enviado','jamón y peperonni','2025-12-10 23:04:30'),
(2,5,2,'B0200000000002','V-00000001',13,2,2,2500.00,0.00,2500.00,450.00,2950.00,'efectivo','completa',1,3000.00,50.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 00:21:30'),
(3,4,2,'B0200000000003','V-00000001',12,NULL,NULL,1200.00,0.00,1200.00,216.00,1416.00,'efectivo','completa',1,2000.00,584.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:48:42'),
(4,4,2,'B0200000000004','V-00000002',12,NULL,NULL,2200.00,0.00,2200.00,396.00,2596.00,'efectivo','completa',1,3000.00,404.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:49:19'),
(5,4,2,'B0200000000005','V-00000003',12,NULL,3,6600.00,0.00,6600.00,1188.00,7788.00,'tarjeta_credito','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:50:05'),
(6,4,2,'B0200000000006','V-00000004',12,NULL,NULL,3000.00,0.00,3000.00,540.00,3540.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado','Reserva','2025-12-11 03:50:44'),
(7,4,2,'B0200000000007','V-00000005',12,NULL,NULL,8300.00,0.00,8300.00,0.00,8300.00,'efectivo','completa',1,8500.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 03:56:03'),
(8,4,2,'B0200000000008','V-00000006',12,NULL,NULL,3600.00,17.28,3582.72,0.00,3582.72,'efectivo','completa',1,4000.00,417.28,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:22:34'),
(9,4,2,'B0200000000009','V-00000007',12,NULL,3,5600.00,0.00,5600.00,0.00,5600.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado','cuenta de reservas.','2025-12-11 04:34:32'),
(10,4,2,'B0200000000010','V-00000008',12,NULL,NULL,2800.00,0.00,2800.00,0.00,2800.00,'efectivo','completa',1,3000.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:35:23'),
(11,4,2,'B0200000000011','V-00000009',12,NULL,NULL,5300.00,0.00,5300.00,0.00,5300.00,'efectivo','completa',1,6000.00,700.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 04:36:23'),
(12,30,2,'B0200000000012','V-00000001',9,1,NULL,1280.00,0.00,1280.00,0.00,1280.00,'efectivo','completa',1,1280.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:54:37'),
(13,30,2,'B0200000000013','V-00000002',9,1,NULL,700.00,0.00,700.00,0.00,700.00,'efectivo','completa',1,700.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:56:10'),
(14,30,2,'B0200000000014','V-00000003',9,1,NULL,100.00,0.00,100.00,0.00,100.00,'efectivo','completa',1,100.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 22:56:51'),
(15,30,2,'B0200000000015','V-00000004',9,1,NULL,220.00,0.00,220.00,0.00,220.00,'efectivo','completa',1,220.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:12:45'),
(16,30,2,'B0200000000016','V-00000005',9,1,NULL,350.00,0.00,350.00,0.00,350.00,'efectivo','completa',1,350.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:13:39'),
(17,30,2,'B0200000000017','V-00000006',9,1,NULL,75.00,0.00,75.00,0.00,75.00,'efectivo','completa',1,75.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:15:47'),
(18,30,2,'B0200000000018','V-00000007',9,1,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,30.00,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-11 23:18:58'),
(19,3,2,'B0200000000019','V-00000002',11,3,NULL,750.00,0.00,900.00,0.00,900.00,'efectivo','completa',1,1000.00,100.00,'anulada','No se realizó ',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-13 15:38:18'),
(20,3,2,'B0200000000020','V-00000003',11,3,NULL,250.00,0.00,250.00,0.00,250.00,'efectivo','completa',1,1000.00,750.00,'anulada','No',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-13 16:43:49'),
(21,27,2,'B0200000000021','V-00000008',5,9,4,1175.00,0.00,1175.00,0.00,1175.00,'efectivo','completa',1,2000.00,825.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 01:12:36'),
(22,15,2,'B0200000000022','V-00000001',25,12,5,123.00,0.00,123.00,22.14,145.14,'efectivo','completa',1,2333.00,2187.86,'anulada','asd',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 17:45:18'),
(23,2,2,'B0200000000023','V-00000001',10,14,NULL,90.00,0.00,90.00,16.20,106.20,'efectivo','completa',1,2500.00,2393.80,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:08:07'),
(24,27,2,'B0200000000024','V-00000009',5,9,NULL,570.00,0.00,570.00,0.00,570.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:11:50'),
(25,15,2,'B0200000000025','V-00000002',25,12,6,123.00,0.00,123.00,22.14,145.14,'efectivo','completa',1,2322.97,2177.83,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-14 19:18:10'),
(26,2,2,'B0200000000026','V-00000002',10,16,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-15 19:09:54'),
(27,16,2,'B0200000000027','V-00000001',26,19,NULL,69.96,0.00,69.96,12.59,82.55,'efectivo','completa',1,500.00,417.45,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-15 20:27:27'),
(28,2,2,'B0200000001','VENTA000003',10,26,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,200.00,164.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-19 18:46:20'),
(29,16,2,'B0200000002','VENTA000002',26,29,NULL,34.98,0.00,34.98,6.30,41.28,'efectivo','completa',1,499.99,458.71,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-20 00:05:59'),
(30,2,2,'B0200000003','VENTA000004',10,30,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,308.00,272.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-20 00:24:22'),
(31,27,1,'B0100000001','VENTA000010',5,32,7,7445.00,0.00,7445.00,0.00,7445.00,'efectivo','parcial',0,20000.00,12555.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-20 04:06:26'),
(32,33,1,'B0100000002','VENTA000001',39,33,9,1300.00,0.00,1300.00,234.00,1534.00,'efectivo','completa',1,2000.00,466.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-20 14:42:17'),
(33,2,2,'B0200000004','VENTA000005',10,43,NULL,180.00,0.00,180.00,32.40,212.40,'efectivo','completa',1,10000.00,9787.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-26 12:38:43'),
(34,2,2,'B0200000005','VENTA000006',10,45,NULL,570.00,0.00,570.00,102.60,672.60,'efectivo','completa',1,20888.00,20215.40,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-27 19:50:59'),
(35,3,2,'B0200000006','VENTA000004',11,48,NULL,250.00,0.00,250.00,0.00,250.00,'efectivo','completa',1,300.00,50.00,'anulada','dndu!f',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-29 22:25:39'),
(36,3,2,'B0200000007','VENTA000005',11,48,NULL,1225.00,0.00,1225.00,0.00,1225.00,'efectivo','completa',1,5000.00,3775.00,'anulada','dhkl',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-29 22:45:37'),
(37,3,2,'B0200000008','VENTA000006',11,48,NULL,875.00,0.00,875.00,135.00,1010.00,'efectivo','completa',1,2000.00,990.00,'anulada','jjj',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-29 22:56:48'),
(38,3,2,'B0200000009','VENTA000007',11,48,NULL,875.00,0.00,875.00,135.00,1010.00,'efectivo','completa',1,2000.00,990.00,'anulada','s',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-29 23:41:45'),
(39,2,2,'B0200000010','VENTA000007',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,208.00,172.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 08:35:48'),
(40,2,2,'B0200000011','VENTA000008',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:12:57'),
(41,2,2,'B0200000012','VENTA000009',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:15:00'),
(42,2,2,'B0200000013','VENTA000010',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:20:56'),
(43,2,2,'B0200000014','VENTA000011',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,658.00,622.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:29:33'),
(44,2,2,'B0200000015','VENTA000012',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,700.00,664.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:34:27'),
(45,3,2,'B0200000016','VENTA000008',11,50,NULL,750.00,1000.00,-250.00,135.00,-115.00,'efectivo','completa',1,0.00,0.00,'anulada','y',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:37:28'),
(46,2,2,'B0200000017','VENTA000013',10,49,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,500.00,464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 21:41:53'),
(47,2,2,'B0200000018','VENTA000014',10,49,NULL,60.00,0.00,60.00,10.80,70.80,'efectivo','parcial',0,800.00,729.20,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:02:27'),
(48,15,1,'B0100000003','VENTA000003',25,51,12,123.00,213123.00,-213000.00,0.00,-213000.00,'efectivo','completa',1,2131231.00,2344231.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:11:09'),
(49,15,1,'B0100000004','VENTA000004',25,51,13,123.00,23212.98,-23089.98,24.60,-23065.38,'efectivo','completa',1,3213.00,26278.38,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:15:00'),
(50,3,2,'B0200000019','VENTA000009',11,50,NULL,750.00,0.00,750.00,0.00,750.00,'efectivo','completa',1,1000.00,250.00,'anulada','y',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:21:11'),
(51,3,2,'B0200000020','VENTA000010',11,50,NULL,1200.00,0.00,1200.00,0.00,1200.00,'efectivo','completa',1,1500.00,300.00,'anulada','y',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:25:41'),
(52,3,2,'B0200000021','VENTA000011',11,50,NULL,1200.00,0.00,1200.00,0.00,1200.00,'efectivo','completa',1,1500.00,300.00,'anulada','y',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:39:17'),
(53,3,2,'B0200000022','VENTA000012',11,50,NULL,500.00,0.00,500.00,0.00,500.00,'efectivo','completa',1,1000.00,500.00,'anulada','s',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:46:53'),
(54,3,2,'B0200000023','VENTA000013',11,50,NULL,625.00,0.00,625.00,0.00,625.00,'efectivo','completa',1,2000.00,1375.00,'anulada','q',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 22:55:16'),
(55,3,2,'B0200000024','VENTA000014',11,50,NULL,1050.00,2000.00,-950.00,0.00,-950.00,'efectivo','completa',1,0.00,0.00,'anulada','e',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 23:05:04'),
(56,3,2,'B0200000025','VENTA000015',11,50,NULL,750.00,1000.00,-250.00,0.00,-250.00,'efectivo','completa',1,0.00,0.00,'anulada','y',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 23:12:44'),
(57,27,2,'B0200000026','VENTA000011',5,52,15,68400.00,0.00,68400.00,0.00,68400.00,'transferencia','completa',1,NULL,NULL,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 23:13:46'),
(58,15,1,'B0100000005','VENTA000005',25,51,16,12300.00,0.00,12300.00,2460.00,14760.00,'efectivo','parcial',0,123000.00,108240.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-30 23:21:01'),
(59,2,2,'B0200000027','VENTA000015',10,53,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,500.00,470.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 00:02:16'),
(60,2,2,'B0200000028','VENTA000016',10,53,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,600.00,570.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 11:55:55'),
(61,2,2,'B0200000029','VENTA000017',10,53,NULL,60.00,0.00,60.00,10.80,70.80,'efectivo','completa',1,600.00,529.20,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 12:01:16'),
(62,2,2,'B0200000030','VENTA000018',10,53,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,500.00,470.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 12:34:29'),
(63,2,2,'B0200000031','VENTA000019',10,53,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,2000.00,1970.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 12:43:13'),
(64,2,2,'B0200000032','VENTA000020',10,53,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,1000.00,970.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 14:37:40'),
(65,3,2,'B0200000033','VENTA000016',11,56,NULL,750.00,0.00,750.00,0.00,750.00,'efectivo','completa',1,1000.00,250.00,'anulada','e',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 16:44:15'),
(66,2,2,'B0200000034','VENTA000021',10,53,NULL,3000.00,0.00,3000.00,0.00,3000.00,'efectivo','completa',1,5000.00,2000.00,'anulada','u',NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 21:56:04'),
(67,2,1,'B0100000006','VENTA000022',10,53,18,299900.00,0.00,299900.00,53982.00,353882.00,'efectivo','completa',1,2999000.00,2645118.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2025-12-31 21:59:42'),
(68,2,2,'B0200000035','VENTA000023',10,58,19,150.00,10.00,140.00,27.00,167.00,'efectivo','completa',1,500.00,333.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-01 19:28:15'),
(69,2,2,'B0200000036','VENTA000024',10,58,20,945.00,50.00,895.00,170.10,1065.10,'efectivo','completa',1,2000.00,934.90,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-01 19:36:40'),
(70,3,2,'B0200000037','VENTA000017',11,62,NULL,1000.00,0.00,1000.00,0.00,1000.00,'efectivo','completa',1,2000.00,1000.00,'anulada','Q',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 17:25:18'),
(71,3,2,'B0200000038','VENTA000018',11,62,NULL,650.00,0.00,650.00,0.00,650.00,'efectivo','completa',1,1000.00,350.00,'anulada','O',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 17:32:15'),
(72,2,2,'B0200000039','VENTA000025',10,61,NULL,55.00,0.00,55.00,0.00,55.00,'efectivo','completa',1,500.00,445.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 17:34:25'),
(73,3,2,'B0200000040','VENTA000019',11,62,NULL,750.00,0.00,750.00,0.00,750.00,'efectivo','completa',1,1000.00,250.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 17:36:14'),
(74,3,2,'B0200000041','VENTA000020',11,62,NULL,1200.00,0.00,1200.00,0.00,1200.00,'efectivo','completa',1,2000.00,800.00,'anulada','Q',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 17:38:47'),
(75,2,2,'B0200000042','VENTA000026',10,61,NULL,30.00,0.00,30.00,5.40,35.40,'efectivo','completa',1,2500.00,2464.60,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 18:33:29'),
(76,2,2,'B0200000043','VENTA000027',10,61,NULL,60.00,0.00,60.00,0.00,60.00,'efectivo','completa',1,2000.00,1940.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 19:56:12'),
(77,3,2,'B0200000044','VENTA000021',11,62,NULL,1000.00,0.00,1000.00,0.00,1000.00,'efectivo','completa',1,2000.00,1000.00,'anulada','Q',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 22:05:07'),
(78,3,2,'B0200000045','VENTA000022',11,62,NULL,1000.00,0.00,1000.00,0.00,1000.00,'efectivo','completa',1,2000.00,1000.00,'anulada','a',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 22:10:00'),
(79,3,2,'B0200000046','VENTA000023',11,62,NULL,250.00,0.00,250.00,0.00,250.00,'efectivo','completa',1,500.00,250.00,'anulada','q',NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 22:16:53'),
(80,2,2,'B0200000047','VENTA000028',10,61,NULL,30.00,0.00,30.00,0.00,30.00,'efectivo','completa',1,500.00,470.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-02 23:08:43'),
(81,3,2,'B0200000048','VENTA000024',44,64,21,1175.00,0.00,1175.00,0.00,1175.00,'efectivo','completa',1,2000.00,825.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:12:02'),
(82,3,2,'B0200000049','VENTA000025',44,64,NULL,1250.00,0.00,1250.00,0.00,1250.00,'efectivo','completa',1,2000.00,750.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:19:15'),
(83,3,2,'B0200000050','VENTA000026',44,64,NULL,325.00,0.00,325.00,0.00,325.00,'efectivo','completa',1,500.00,175.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:21:42'),
(84,3,2,'B0200000051','VENTA000027',44,64,NULL,500.00,0.00,500.00,0.00,500.00,'efectivo','completa',1,1000.00,500.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:35:35'),
(85,3,2,'B0200000052','VENTA000028',44,64,NULL,950.00,0.00,950.00,0.00,950.00,'efectivo','completa',1,1000.00,50.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:45:18'),
(86,3,2,'B0200000053','VENTA000029',44,64,NULL,500.00,0.00,500.00,0.00,500.00,'efectivo','completa',1,550.00,50.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 00:53:31'),
(87,3,2,'B0200000054','VENTA000030',44,64,NULL,975.00,0.00,975.00,0.00,975.00,'efectivo','completa',1,1000.00,25.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 01:01:36'),
(88,3,2,'B0200000055','VENTA000031',44,64,NULL,750.00,0.00,750.00,0.00,750.00,'efectivo','completa',1,1000.00,250.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 01:16:44'),
(89,3,2,'B0200000056','VENTA000032',44,64,NULL,800.00,0.00,800.00,0.00,800.00,'efectivo','completa',1,1000.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 01:27:08'),
(90,3,2,'B0200000057','VENTA000033',44,64,22,405.00,0.00,405.00,0.00,405.00,'efectivo','completa',1,500.00,95.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 01:30:56'),
(91,3,2,'B0200000058','VENTA000034',44,64,NULL,1500.00,0.00,1500.00,0.00,1500.00,'efectivo','completa',1,2000.00,500.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 01:41:49'),
(92,3,2,'B0200000059','VENTA000035',44,64,NULL,405.00,0.00,405.00,0.00,405.00,'efectivo','completa',1,500.00,95.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 02:26:57'),
(93,3,2,'B0200000060','VENTA000036',44,64,NULL,325.00,0.00,325.00,0.00,325.00,'efectivo','completa',1,500.00,175.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 02:27:48'),
(94,3,2,'B0200000061','VENTA000037',44,64,NULL,800.00,0.00,800.00,0.00,800.00,'efectivo','completa',1,1000.00,200.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 02:28:52'),
(95,3,2,'B0200000062','VENTA000038',44,64,NULL,900.00,0.00,900.00,0.00,900.00,'efectivo','completa',1,1000.00,100.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 02:39:13'),
(96,27,1,'B0100000007','VENTA000012',5,66,23,1710.00,0.00,1710.00,0.00,1710.00,'efectivo','parcial',0,2000.00,290.00,'emitida',NULL,NULL,'01','1',NULL,'no_enviado',NULL,'2026-01-03 03:35:51');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-03 16:47:58
