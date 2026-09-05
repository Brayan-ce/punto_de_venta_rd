-- ============================================
-- MIGRACIÓN: Sistema de Términos y Condiciones
-- Fecha: 2026-01-13
-- Descripción: Implementación profesional de gestión de términos y condiciones
-- ============================================

-- Tabla para almacenar versiones de términos y condiciones
CREATE TABLE IF NOT EXISTS terminos_condiciones
(
    id             INT AUTO_INCREMENT PRIMARY KEY,
    version        VARCHAR(20)  NOT NULL UNIQUE,
    titulo         VARCHAR(255) NOT NULL,
    contenido      LONGTEXT     NOT NULL,
    activo         BOOLEAN   DEFAULT FALSE,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activo (activo),
    INDEX idx_version (version)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
    COMMENT ='Almacena las diferentes versiones de términos y condiciones';

-- Tabla para registrar aceptaciones de usuarios
CREATE TABLE IF NOT EXISTS usuarios_terminos
(
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    terminos_id INT NOT NULL,
    aceptado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (terminos_id) REFERENCES terminos_condiciones (id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_terminos (terminos_id),
    INDEX idx_usuario_terminos (usuario_id, terminos_id),
    UNIQUE KEY unique_user_terms (usuario_id, terminos_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
    COMMENT ='Registro de aceptación de términos por usuario';

-- =====================================================
-- 3. AGREGAR CAMPOS A solicitudes_registro (MariaDB Safe)
-- =====================================================

-- acepto_terminos
SET @existe := (SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'solicitudes_registro'
                  AND COLUMN_NAME = 'acepto_terminos');

SET @sql := IF(
        @existe = 0,
        'ALTER TABLE solicitudes_registro
         ADD COLUMN acepto_terminos BOOLEAN DEFAULT FALSE AFTER razon_social',
        'SELECT 1'
            );

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- terminos_version
SET @existe := (SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'solicitudes_registro'
                  AND COLUMN_NAME = 'terminos_version');

SET @sql := IF(
        @existe = 0,
        'ALTER TABLE solicitudes_registro
         ADD COLUMN terminos_version VARCHAR(20) AFTER acepto_terminos',
        'SELECT 1'
            );

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ip_registro
SET @existe := (SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'solicitudes_registro'
                  AND COLUMN_NAME = 'ip_registro');

SET @sql := IF(
        @existe = 0,
        'ALTER TABLE solicitudes_registro
         ADD COLUMN ip_registro VARCHAR(45) AFTER terminos_version',
        'SELECT 1'
            );

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. INSERTAR VERSIÓN INICIAL DE TÉRMINOS (CORREGIDO)
-- =====================================================

INSERT INTO terminos_condiciones (version, titulo, contenido, activo)
VALUES ('1.0',
        'Términos y Condiciones de Uso - IziWeek POS',
        '# TÉRMINOS Y CONDICIONES DE USO
        ## Sistema de Punto de Venta IziWeek

        **Última actualización:** 13 de enero de 2026
        **Versión:** 1.0

        ---

        ## 1. ACEPTACIÓN DE LOS TÉRMINOS

        Al registrarse y utilizar el sistema IziWeek POS, usted acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.

        La aceptación de estos términos crea un contrato legal vinculante entre usted (el usuario) y IziWeek.

        ---

        ## 2. DESCRIPCIÓN DEL SERVICIO

        IziWeek es un sistema de punto de venta (POS) basado en la nube, diseñado para la gestión empresarial integral que incluye:

        - ✅ Gestión de ventas e inventario en tiempo real
        - ✅ Control y administración de empleados
        - ✅ Facturación electrónica conforme a normativas locales
        - ✅ Reportes y análisis de negocio
        - ✅ Gestión de clientes y programas de fidelización
        - ✅ Control de caja y múltiples puntos de venta

        ---

        ## 3. REGISTRO Y CUENTA DE USUARIO

        ### 3.1 Requisitos de Registro

        Para utilizar IziWeek, usted debe:

        - Ser mayor de 18 años y tener capacidad legal para contratar
        - Proporcionar información veraz, exacta y actualizada
        - Representar legalmente a la empresa que registra
        - Mantener la confidencialidad de sus credenciales de acceso
        - Notificar inmediatamente cualquier uso no autorizado de su cuenta

        ### 3.2 Proceso de Aprobación

        - Todas las solicitudes de registro son revisadas manualmente
        - La aprobación no es automática ni garantizada
        - Nos reservamos el derecho de rechazar cualquier solicitud sin obligación de justificación
        - El proceso de aprobación puede tomar entre 24 y 72 horas hábiles

        ### 3.3 Responsabilidad de la Cuenta

        Usted es totalmente responsable de:

        - Todas las actividades realizadas bajo su cuenta
        - Mantener sus credenciales seguras
        - Cualquier pérdida o daño derivado del uso no autorizado de su cuenta

        ---

        ## 4. USO ACEPTABLE DEL SERVICIO

        ### 4.1 Usos Permitidos

        El usuario se compromete a utilizar IziWeek exclusivamente para:

        - Gestión legítima de operaciones comerciales
        - Registro de transacciones reales
        - Cumplimiento de obligaciones fiscales y contables

        ### 4.2 Usos Prohibidos

        Está estrictamente prohibido:

        - ❌ Utilizar el sistema para actividades ilegales o fraudulentas
        - ❌ Compartir credenciales de acceso con terceros no autorizados
        - ❌ Intentar vulnerar la seguridad del sistema
        - ❌ Realizar ingeniería inversa del software
        - ❌ Usar el servicio para competir con IziWeek
        - ❌ Sobrecargar o interferir con la infraestructura del servicio
        - ❌ Crear transacciones falsas o manipular datos
        - ❌ Violar derechos de propiedad intelectual

        ### 4.3 Consecuencias del Incumplimiento

        El incumplimiento de estas normas puede resultar en:

        - Suspensión inmediata de la cuenta
        - Terminación permanente del servicio
        - Acciones legales según corresponda
        - Reporte a autoridades competentes

        ---

        ## 5. DATOS Y PRIVACIDAD

        ### 5.1 Recopilación de Datos

        IziWeek recopila y procesa:

        - Datos de registro empresarial (RNC, razón social)
        - Información de contacto
        - Datos de transacciones comerciales
        - Información de clientes
        - Datos de uso del sistema

        ### 5.2 Uso de la Información

        Los datos se utilizan para:

        - Proveer y mejorar el servicio
        - Cumplir con obligaciones legales y fiscales
        - Generar reportes y análisis
        - Comunicaciones relacionadas con el servicio
        - Prevención de fraude

        ### 5.3 Protección de Datos

        Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos, incluyendo:

        - Cifrado de datos en tránsito y en reposo
        - Control de acceso basado en roles
        - Auditorías de seguridad regulares
        - Respaldos automáticos diarios

        Para más detalles, consulte nuestra **Política de Privacidad**.

        ---

        ## 6. PROPIEDAD INTELECTUAL

        ### 6.1 Derechos de IziWeek

        IziWeek retiene todos los derechos de propiedad intelectual sobre:

        - El software y su código fuente
        - La interfaz de usuario y diseño
        - Marcas, logos y nombre comercial
        - Documentación y materiales de capacitación
        - Metodologías y procesos

        ### 6.2 Licencia de Uso

        Se le otorga una licencia limitada, no exclusiva, no transferible y revocable para usar IziWeek conforme a estos términos.

        ### 6.3 Datos del Usuario

        Usted retiene la propiedad de todos los datos que ingresa al sistema. IziWeek no reclama propiedad sobre sus datos comerciales.

        ---

        ## 7. PRECIOS Y PAGOS

        ### 7.1 Modelo de Suscripción

        IziWeek opera bajo un modelo de suscripción mensual o anual según el plan contratado.

        ### 7.2 Facturación

        - Las suscripciones se facturan por adelantado
        - Los pagos se procesan automáticamente según el ciclo elegido
        - Los precios pueden cambiar con 30 días de aviso previo

        ### 7.3 Reembolsos

        - No se ofrecen reembolsos por períodos parciales de servicio
        - La cancelación de la suscripción no genera derecho a reembolso
        - Se aplicarán políticas especiales en caso de fallas graves del servicio

        ---

        ## 8. DISPONIBILIDAD Y SOPORTE

        ### 8.1 Disponibilidad del Servicio

        Nos esforzamos por mantener una disponibilidad del 99.5%, sin embargo:

        - No garantizamos disponibilidad ininterrumpida
        - Puede haber mantenimientos programados
        - No somos responsables por interrupciones fuera de nuestro control

        ### 8.2 Soporte Técnico

        Ofrecemos soporte técnico a través de:

        - Chat en línea (horario laboral)
        - Correo electrónico
        - WhatsApp (según plan contratado)
        - Base de conocimientos y documentación

        ---

        ## 9. LIMITACIÓN DE RESPONSABILIDAD

        ### 9.1 Uso Bajo su Propio Riesgo

        El servicio se proporciona "tal cual" sin garantías de ningún tipo.

        ### 9.2 Limitaciones

        En la máxima medida permitida por la ley:

        - No somos responsables por daños indirectos, incidentales o consecuentes
        - Nuestra responsabilidad máxima se limita al monto pagado en los últimos 12 meses
        - No garantizamos resultados comerciales específicos

        ### 9.3 Indemnización

        Usted acepta indemnizar y mantener indemne a IziWeek de cualquier reclamo derivado de su uso del servicio.

        ---

        ## 10. TERMINACIÓN DEL SERVICIO

        ### 10.1 Terminación por el Usuario

        Puede cancelar su suscripción en cualquier momento desde su cuenta.

        ### 10.2 Terminación por IziWeek

        Podemos terminar o suspender su cuenta si:

        - Incumple estos términos
        - Su pago está vencido
        - Detectamos actividad fraudulenta
        - Lo requiere la ley

        ### 10.3 Efectos de la Terminación

        Al terminar el servicio:

        - Se revoca inmediatamente su acceso
        - Tiene 30 días para exportar sus datos
        - Después de 30 días, sus datos pueden ser eliminados permanentemente

        ---

        ## 11. MODIFICACIONES A LOS TÉRMINOS

        ### 11.1 Derecho a Modificar

        Nos reservamos el derecho de modificar estos términos en cualquier momento.

        ### 11.2 Notificación

        Le notificaremos sobre cambios materiales mediante:

        - Correo electrónico
        - Aviso en el sistema
        - Notificación en el inicio de sesión

        ### 11.3 Aceptación de Cambios

        El uso continuado del servicio después de la notificación constituye aceptación de los nuevos términos.

        ---

        ## 12. LEY APLICABLE Y JURISDICCIÓN

        Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa se resolverá en los tribunales competentes de Santo Domingo.

        ---

        ## 13. DISPOSICIONES GENERALES

        ### 13.1 Integridad del Acuerdo

        Estos términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre las partes.

        ### 13.2 Divisibilidad

        Si alguna disposición se considera inválida, las demás permanecen en pleno vigor.

        ### 13.3 Renuncia

        La falta de ejercicio de un derecho no constituye renuncia al mismo.

        ### 13.4 Cesión

        No puede transferir sus derechos bajo estos términos sin nuestro consentimiento escrito.

        ---

        ## 14. CONTACTO

        Para preguntas sobre estos términos, contáctenos:

        - **Email:** legal@iziweek.com
        - **Teléfono:** +1 (809) 000-0000
        - **Dirección:** Santo Domingo, República Dominicana

        ---

        **Última revisión:** 13 de enero de 2026
        **Versión:** 1.0
        **Vigencia:** Inmediata

        ---

        *Al hacer clic en "Acepto los Términos y Condiciones", usted reconoce que ha leído, comprendido y aceptado estar legalmente vinculado por estos términos.*',
        TRUE)
ON DUPLICATE KEY UPDATE contenido = VALUES(contenido),
                        activo    = TRUE;

UPDATE terminos_condiciones
SET contenido = REGEXP_REPLACE(contenido, '\n[[:space:]]+', '\n')
WHERE activo = TRUE;

-- =====================================================
-- 5. PROCEDIMIENTO: obtener_terminos_activos
-- =====================================================
DROP PROCEDURE IF EXISTS obtener_terminos_activos;
DELIMITER //

CREATE PROCEDURE obtener_terminos_activos()
BEGIN
    SELECT id, version, titulo, contenido, creado_en
    FROM terminos_condiciones
    WHERE activo = TRUE
    ORDER BY creado_en DESC
    LIMIT 1;
END //

DELIMITER ;

-- =====================================================
-- 6. PROCEDIMIENTO: registrar_aceptacion_terminos
-- =====================================================
DROP PROCEDURE IF EXISTS registrar_aceptacion_terminos;
DELIMITER //

CREATE PROCEDURE registrar_aceptacion_terminos(
    IN p_usuario_id INT,
    IN p_terminos_id INT,
    IN p_ip VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    INSERT INTO usuarios_terminos (usuario_id, terminos_id, ip_address, user_agent)
    VALUES (p_usuario_id, p_terminos_id, p_ip, p_user_agent)
    ON DUPLICATE KEY UPDATE aceptado_en = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- 7. FUNCIÓN: usuario_acepto_terminos_actuales
-- =====================================================
DROP FUNCTION IF EXISTS usuario_acepto_terminos_actuales;
DELIMITER //

CREATE FUNCTION usuario_acepto_terminos_actuales(p_usuario_id INT)
    RETURNS BOOLEAN
    DETERMINISTIC
BEGIN
    DECLARE acepto BOOLEAN DEFAULT FALSE;

    SELECT EXISTS (SELECT 1
                   FROM usuarios_terminos ut
                            INNER JOIN terminos_condiciones tc ON ut.terminos_id = tc.id
                   WHERE ut.usuario_id = p_usuario_id
                     AND tc.activo = TRUE)
    INTO acepto;

    RETURN acepto;
END //

DELIMITER ;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================