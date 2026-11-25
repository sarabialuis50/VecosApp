import re

filepath = r'c:\Users\luis.sarabia\MenuPro\frontend\src\pages\dashboard\ConfiguracionPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert search bar and filters
search_bar_insertion = """                            {/* Búsqueda y Filtros */}
                            <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar producto por nombre..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-12 pl-11 rounded-2xl bg-white border-gray-100 font-medium placeholder:text-gray-400 focus:ring-[#13ec6d]/20 transition-shadow"
                                    />
                                </div>
                                <div className="w-full md:w-64">
                                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                                        <SelectTrigger className="h-12 rounded-2xl bg-white border-gray-100 font-bold text-[#111814]">
                                            <SelectValue placeholder="Categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                            <SelectItem value="all" className="font-bold">Todas las categorías</SelectItem>
                                            {categories.map((cat) => {
                                                const name = typeof cat === 'object' ? cat.nombre : cat;
                                                return (
                                                    <SelectItem key={name} value={name} className="font-bold">{name}</SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
"""

# Insert before <div className="overflow-x-auto scrollbar-hide">
target_div = r'<div className="overflow-x-auto scrollbar-hide">'
if search_bar_insertion not in content:
    content = content.replace(target_div, search_bar_insertion + "\n" + target_div)

# 2. Fix table header paddings
header_pattern = r'<thead>\s+<tr className="bg-gray-50/50">\s+<th className="hidden md:table-cell px-8 py-4.*?Imagen</th>\s+<th className="px-4 md:px-6 py-4.*?Producto</th>\s+<th className="hidden lg:table-cell px-6 py-4.*?Categoría</th>\s+<th className="px-4 md:px-6 py-4.*?Precio</th>\s+<th className="hidden md:table-cell px-6 py-4.*?Estado</th>\s+<th className="px-4 md:px-6 py-4.*?Acciones</th>\s+</tr>\s+</thead>'

new_header = """<thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="hidden md:table-cell px-6 py-4 text-left text-[10px] font-black text-[#618972] uppercase tracking-widest">Imagen</th>
                                            <th className="px-4 md:px-5 py-4 text-left text-[10px] font-black text-[#618972] uppercase tracking-widest">Producto</th>
                                            <th className="hidden lg:table-cell px-4 py-4 text-left text-[10px] font-black text-[#618972] uppercase tracking-widest">Categoría</th>
                                            <th className="px-4 md:px-5 py-4 text-left text-[10px] font-black text-[#618972] uppercase tracking-widest">Precio</th>
                                            <th className="hidden md:table-cell px-4 py-4 text-left text-[10px] font-black text-[#618972] uppercase tracking-widest">Estado</th>
                                            <th className="px-4 md:px-6 py-4 text-right text-[10px] font-black text-[#618972] uppercase tracking-widest">Acciones</th>
                                        </tr>
                                    </thead>"""

content = re.sub(header_pattern, new_header, content, flags=re.DOTALL)

# 3. Fix row cell paddings (already modified in the file, but let's ensure they match the header)
# Use global string replacements for the cell classes
row_replacements = [
    ('className="hidden md:table-cell px-8 py-4"', 'className="hidden md:table-cell px-6 py-4"'),
    ('className="px-4 md:px-6 py-4"', 'className="px-4 md:px-5 py-4"'),
    ('className="hidden lg:table-cell px-6 py-4"', 'className="hidden lg:table-cell px-4 py-4"'),
    ('className="hidden md:table-cell px-6 py-4"', 'className="hidden md:table-cell px-4 py-4"'),
    ('className="px-4 md:px-8 py-4 text-right"', 'className="px-4 md:px-6 py-4 text-right"'),
]

for old, new in row_replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated file successfully.")
