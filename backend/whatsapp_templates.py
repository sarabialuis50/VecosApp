import json
import logging

logger = logging.getLogger(__name__)

# --- CONFIGURACIÓN DE IDS DE TWILIO ---
# REEMPLAZA estos valores con los 'Content SID' que te asigne Twilio (ej: HXxxxxxxxx...)
TWILIO_SIDS = {
    "resumen_pedido": "HX3b0b28d7f591bf6e93c2e80e9e5a2005",    # Plantilla: resumen_del_pedido (19 variables verticales)
    "fidelidad": "HX23628ad40f0211a1379819bf608de21b",           # Plantilla: notificacion_fidelidad_v1
    "cumpleanos": "HX1f5542e7ab4c3a77f396a6a70fef1658",          # Plantilla: felicitacion_cumple_negocio
    "campana_marketing": "HX4e4cf9232106524f8a3f412c1baecc96",   # Plantilla: campana_masiva_custom
    "codigo_verificacion": "HX42003eb243fd020dbeaa9d9b983e7ea4",              # Plantilla: verificacion_otp
    "asignacion_repartidor": "HX1743ee41809bd9c543ab1e5393ea7645",             # Plantilla: asignacion_repartidor
    "seguimiento_cliente": "HX3659bc5dccb53e716316f42582cf45b4"               # Plantilla: seguimiento_cliente
}

def get_template_data(template_key, **kwargs):
    """
    Prepara el Content SID y las variables dinámicas para Twilio.
    """
    sid = TWILIO_SIDS.get(template_key)
    if not sid or sid == "PENDIENTE":
        return None, None
    
    # Función auxiliar para limpiar y truncar valores (evita fallos de Twilio por longitud o caracteres)
    def sanitize_val(val, truncate_len=None):
        if val is None: return ""
        if not isinstance(val, str): val = str(val)
        # Preserve newlines for formatting
        cleaned = val.strip()
        return cleaned[:truncate_len] if truncate_len else cleaned

    variables = {}

    if template_key == "asignacion_repartidor":
        # Variable names in Content SID HX1743ee41809bd9c543ab1e5393ea7645
        # variables: {{1}} Repartidor, {{2}} Negocio, {{3}} Cliente, {{4}} Telefono Cliente, {{5}} Dirección, {{6}} ID Pedido, {{7}} Link
        variables = {
            "1": sanitize_val(kwargs.get("repartidor_nombre", "Repartidor"), 60),
            "2": sanitize_val(kwargs.get("negocio_nombre", "Nuestro Negocio"), 60),
            "3": sanitize_val(kwargs.get("cliente_nombre", "Cliente"), 60),
            "4": sanitize_val(kwargs.get("cliente_telefono", "N/A"), 30),
            "5": sanitize_val(kwargs.get("direccion_entrega", "Ver en mapa"), 300),
            "6": sanitize_val(kwargs.get("order_id_corto", "N/A"), 30),
            "7": sanitize_val(kwargs.get("link_seguimiento", "https://menuia.co"), 150)
        }
    
    elif template_key == "seguimiento_cliente":
        # Variable names in Content SID HX3659bc5dccb53e716316f42582cf45b4
        # variables: {{1}} Cliente, {{2}} Negocio, {{3}} Repartidor, {{4}} Telefono Repartidor, {{5}} Dirección, {{6}} ID Pedido, {{7}} Link
        variables = {
            "1": sanitize_val(kwargs.get("cliente_nombre", "Cliente"), 60),
            "2": sanitize_val(kwargs.get("negocio_nombre", "Nuestro Negocio"), 60),
            "3": sanitize_val(kwargs.get("repartidor_nombre", "Repartidor"), 60),
            "4": sanitize_val(kwargs.get("repartidor_telefono", "N/A"), 30),
            "5": sanitize_val(kwargs.get("direccion_entrega", "Ver en mapa"), 300),
            "6": sanitize_val(kwargs.get("order_id_corto", "N/A"), 30),
            "7": sanitize_val(kwargs.get("link_seguimiento", "https://menuia.co"), 150)
        }

    elif template_key == "resumen_pedido":
        # ── Plantilla: resumen_del_pedido (HX3b0b28d7f591bf6e93c2e80e9e5a2005) ──
        # 19 variables individuales (formato vertical)
        # {{1}}  Nombre del negocio
        # {{2}}  ID del Pedido
        # {{3}}  Nombre del cliente
        # {{4}}  Teléfono del cliente
        # {{5}}  Nombre producto (detalle del pedido)
        # {{6}}  Tamaños
        # {{7}}  Adicionales
        # {{8}}  Opciones
        # {{9}}  Observación del pedido
        # {{10}} Método de Entrega
        # {{11}} Dirección
        # {{12}} Distancia
        # {{13}} Observación de entrega
        # {{14}} Método de Pago
        # {{15}} Subtotal
        # {{16}} Costo del envío
        # {{17}} Total
        # {{18}} Fecha y hora
        # {{19}} URL de seguimiento
        variables = {
            "1":  sanitize_val(kwargs.get("negocio_nombre", "Nuestro Negocio"), 80),
            "2":  sanitize_val(kwargs.get("pedido_id", "N/A"), 40),
            "3":  sanitize_val(kwargs.get("cliente_nombre", "Cliente"), 80),
            "4":  sanitize_val(kwargs.get("cliente_telefono", "N/A"), 30),
            "5":  sanitize_val(kwargs.get("detalle_productos", "Sin productos"), 800),
            "6":  sanitize_val(kwargs.get("tamanos", ""), 200),
            "7":  sanitize_val(kwargs.get("adicionales", ""), 300),
            "8":  sanitize_val(kwargs.get("opciones", ""), 300),
            "9":  sanitize_val(kwargs.get("observacion_pedido", ""), 300),
            "10": sanitize_val(kwargs.get("metodo_entrega", "Domicilio"), 80),
            "11": sanitize_val(kwargs.get("direccion", "N/A"), 300),
            "12": sanitize_val(kwargs.get("distancia", "N/A"), 30),
            "13": sanitize_val(kwargs.get("observacion_entrega", ""), 300),
            "14": sanitize_val(kwargs.get("metodo_pago", "Efectivo"), 60),
            "15": sanitize_val(kwargs.get("subtotal", "$0"), 30),
            "16": sanitize_val(kwargs.get("costo_envio", "$0"), 30),
            "17": sanitize_val(kwargs.get("total", "$0"), 30),
            "18": sanitize_val(kwargs.get("fecha", ""), 100),
            "19": sanitize_val(kwargs.get("link_seguimiento", "https://menuia.co"), 250),
        }

    elif template_key == "fidelidad":
        # variables: {{1}} Cliente, {{2}} Acción, {{3}} Negocio, {{4}} Puntos
        # Variable names in Content SID HX23628ad40f0211a1379819bf608de21b
        variables = {
            "1": kwargs.get("cliente_nombre", "Cliente"),
            "2": kwargs.get("accion", "Has ganado puntos"),
            "3": kwargs.get("negocio_nombre", "Nuestro Negocio"),
            "4": str(kwargs.get("puntos", 0))
        }

    elif template_key == "cumpleanos":
        # variables: {{1}} Cliente, {{2}} Negocio
        # Variable names in Content SID HX1f5542e7ab4c3a77f396a6a70fef1658
        variables = {
            "1": kwargs.get("cliente_nombre", "Cumpleañero"),
            "2": kwargs.get("negocio_nombre", "Nuestro Negocio")
        }

    elif template_key == "campana_marketing":
        # variables: {{1}} Cliente, {{2}} Negocio, {{3}} Mensaje, {{4}} Link
        # Variable names in Content SID HX4e4cf9232106524f8a3f412c1baecc96
        variables = {
            "1": kwargs.get("cliente_nombre", "Cliente"),
            "2": kwargs.get("negocio_nombre", "Nuestro Negocio"),
            "3": kwargs.get("mensaje_personalizado", ""),
            "4": kwargs.get("link", "https://menuia.co")
        }

    elif template_key == "codigo_verificacion":
        # variables: {{1}} OTP Code, {{2}} Negocio
        # Variable names in Content SID HX42003eb243fd020dbeaa9d9b983e7ea4
        variables = {
            "1": kwargs.get("otp_code", ""),
            "2": kwargs.get("negocio_nombre", "Menu.IA")
        }

    return sid, variables
