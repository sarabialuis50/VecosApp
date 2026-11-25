import sys

filepath = r'c:\Users\luis.sarabia\MenuPro\frontend\src\pages\dashboard\ConfiguracionPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix headers
content = content.replace('className="hidden md:table-cell px-6 py-4 text-left text-[10px]', 'className="hidden md:table-cell px-6 py-4 text-left text-[10px]')
content = content.replace('className="px-4 md:px-5 py-4 text-left text-[10px]', 'className="px-4 py-4 text-left text-[10px]')
content = content.replace('className="hidden lg:table-cell px-4 py-4 text-left text-[10px]', 'className="hidden lg:table-cell px-4 py-4 text-left text-[10px]')
content = content.replace('className="px-4 md:px-5 py-4 text-left text-[10px]', 'className="px-4 py-4 text-left text-[10px]')
content = content.replace('className="hidden md:table-cell px-4 py-4 text-left text-[10px]', 'className="hidden md:table-cell px-4 py-4 text-left text-[10px]')
content = content.replace('className="px-4 md:px-6 py-4 text-right text-[10px]', 'className="px-6 py-4 text-right text-[10px]')

# Fix cells
# Imagen
content = content.replace('className="hidden md:table-cell px-4 py-4"', 'className="hidden md:table-cell px-6 py-4"')
content = content.replace('className="hidden md:table-cell px-8 py-4"', 'className="hidden md:table-cell px-6 py-4"')
# Producto
content = content.replace('className="px-4 md:px-5 py-4"', 'className="px-4 py-4"')
content = content.replace('className="px-4 md:px-6 py-4"', 'className="px-4 py-4"')
# Categoría
content = content.replace('className="hidden lg:table-cell px-4 py-4"', 'className="hidden lg:table-cell px-4 py-4"')
# Precio
# Already handled by Producto pattern if identical, but let's be specific
# Estado
content = content.replace('className="hidden md:table-cell px-4 py-4"', 'className="hidden md:table-cell px-4 py-4"')
# Acciones
content = content.replace('className="px-4 md:px-6 py-4 text-right"', 'className="px-6 py-4 text-right"')
content = content.replace('className="px-4 md:px-8 py-4 text-right"', 'className="px-6 py-4 text-right"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final cleanup done.")
