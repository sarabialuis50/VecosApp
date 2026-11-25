import re
import os

path = r'c:\Users\luis.sarabia\MenuPro\frontend\src\pages\dashboard\ConfiguracionPage.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the row cells
row_pattern = re.compile(
    r'(<td className="px-8 py-4">.*?</td>\s+)'  # Imagen cell
    r'(<td className="px-6 py-4">.*?{p\.nombre}.*?</td>\s+)'  # Producto cell
    r'(<td className="px-6 py-4">.*?p\.categoria.*?</td>\s+)'  # Categoria cell
    r'(<td className="px-6 py-4">.*?formatCurrency\(p\.precio\).*?</td>\s+)'  # Precio cell
    r'(<td className="px-6 py-4">.*?Switch.*?</td>\s+)'  # Estado cell
    r'(<td className="px-8 py-4 text-right">.*?Trash2.*?</td>)', # Acciones cell
    re.DOTALL
)

def replacement(match):
    # This is a bit complex for a single regex replacement, but let's try to reconstruct the cells
    # I'll use placeholders if needed, but since I know the structure I can just rewrite it
    
    # We want: 
    # 1. Image (hidden md)
    # 2. Product (rich on mobile)
    # 3. Category (hidden lg)
    # 4. Price
    # 5. Status (hidden md)
    # 6. Actions (with small switch on mobile)
    
    return """<td className="hidden md:table-cell px-8 py-4">
                                                        <div className="size-14 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                                                            <img
                                                                src={p.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                alt={p.nombre}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="md:hidden size-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                                                                <img
                                                                    src={p.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                                                                    className="w-full h-full object-cover"
                                                                    alt={p.nombre}
                                                                />
                                                            </div>
                                                            <div className="space-y-0.5 min-w-0">
                                                                <div className="font-black text-[#111814] text-sm group-hover:text-[#13ec6d] transition-colors truncate">
                                                                    {p.nombre}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {p.etiqueta && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#111824] text-[8px] font-black text-white uppercase tracking-widest">
                                                                            {p.etiqueta}
                                                                        </span>
                                                                    )}
                                                                    <span className={`md:hidden text-[9px] font-black uppercase tracking-tight ${p.disponible ? 'text-[#13ec6d]' : 'text-red-400'}`}>
                                                                        {p.disponible ? 'Disponible' : 'Agotado'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-[#618972] uppercase tracking-tighter">
                                                            {typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <span className="font-black text-[#111814] text-sm md:text-base tracking-tighter">
                                                            {formatCurrency(p.precio)}
                                                        </span>
                                                    </td>
                                                    <td className="hidden md:table-cell px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${p.disponible ? 'text-[#13ec6d]' : 'text-red-400'}`}>
                                                                {p.disponible ? 'Disponible' : 'Agotado'}
                                                            </span>
                                                            <Switch
                                                                checked={p.disponible}
                                                                className="data-[state=checked]:bg-[#13ec6d]"
                                                                onCheckedChange={async (val) => {
                                                                    try {
                                                                        await api().put(`/products/${slug}/${p.id}`, { disponible: val });
                                                                        fetchInitialData();
                                                                        toast.success(val ? 'Activado' : 'Pausado');
                                                                    } catch (e) { toast.error('Error'); }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                                            <Switch
                                                                checked={p.disponible}
                                                                className="md:hidden scale-75 data-[state=checked]:bg-[#13ec6d]"
                                                                onCheckedChange={async (val) => {
                                                                    try {
                                                                        await api().put(`/products/${slug}/${p.id}`, { disponible: val });
                                                                        fetchInitialData();
                                                                        toast.success(val ? 'Activado' : 'Pausado');
                                                                    } catch (e) { toast.error('Error'); }
                                                                }}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditProduct(p)}
                                                                className="size-8 md:size-9 rounded-xl text-gray-400 hover:text-[#13ec6d] hover:bg-[#13ec6d]/5 transition-all"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteProduct(p.id)}
                                                                className="size-8 md:size-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>"""

new_content = row_pattern.sub(replacement, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced table cells with responsive version.")
