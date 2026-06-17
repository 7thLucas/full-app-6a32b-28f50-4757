Crea una aplicación completa de TMS (Transportation Management System) para una empresa de servicios de transporte y logística de productos químicos en Argentina, con alrededor de 35 camiones de distintas variaciones.

Tipos de operaciones (separar claramente para KPIs y reportes):
- Distribución: El cliente entrega hoja de ruta; los camiones salen a repartir a múltiples clientes. Registrar hoja de ruta, clientes visitados, entregas, km, tiempos.
- Puerto: 
  - Carga suelta consolidada en pallets.
  - Contenedores (20 pies y 40 pies).
  - Isotanques.
  Separar estas subcategorías para reportes y KPIs independientes.
- Viajes de material técnico: Transportes especiales de equipo/material técnico, que también se prefacturan. Mantenerlos en una categoría separada.

Funcionalidades principales:
- Gestión de envíos/cargas: registro de órdenes, clientes, origen/destino (incluyendo puerto), vehículos/flota (35 camiones), conductores, fechas, estado (pendiente, en tránsito, entregado), tipo de carga (químicos, con campos para peligrosidad si aplica).
- Optimización básica de rutas (Google Maps si posible).
- Tracking en tiempo real.
- Prefacturación automática: al completar un viaje, calcular costos (flete, peajes, combustible, adicionales, etc.) según tarifas por cliente, km, tipo de operación o contenedor. Generar prefactura detallada con subtotales e impuestos.
- NO incluir facturación electrónica AFIP, solo prefacturación.
- Exportación a Tango Software: generar Excel/CSV con formato compatible para importar a Tango (campos como cliente, comprobante, importe neto, IVA, total, descripción de servicios, tipo de operación, etc.). Botón para descargar o enviar por email.
- Dashboard con KPIs separados por tipo: distribución, puerto (pallets/contenedores/isotanques), material técnico. Incluir envíos por día/semana, costos promedio, ocupación de flota, ingresos proyectados, etc.
- Usuarios: admin, operadores, conductores (acceso mobile).
- Base de datos propia, opción de sincronizar con Google Sheets.

La app debe ser web y mobile responsive, segura para manejo de químicos, escalable y fácil de usar. Pregúntame detalles adicionales (tarifas, campos específicos de Tango, flujos actuales) si hace falta.