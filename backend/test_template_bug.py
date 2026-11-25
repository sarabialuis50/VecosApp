template = "- Si el nombre del cliente es '{customer_name if customer_name else 'cliente'}' (o desconocido)..."
try:
    print(template.format(customer_name="Luis"))
except Exception as e:
    print(f"FAILED: {e}")
