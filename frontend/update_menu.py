import re

file_path = r"c:\Users\luis.sarabia\MenuPro\frontend\src\pages\public\MenuPublico.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace 1: Import dietary icons if missing (it's already imported in block: Vegan, Wheat, etc. But let's add Flame, Leaf)
# Instead of relying on imports that might not exist, I will use emojis.

# Replace 2: Inject emojis into ProductCard
target_card = """        <div className="flex items-center justify-between mb-1 md:mb-4">
          <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1.5 rounded-full bg-[#4ADE80]/10 text-[8px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-wider">
            {product.categoria}
          </div>"""

replacement_card = """        <div className="flex items-center justify-between mb-1 md:mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1.5 rounded-full bg-[#4ADE80]/10 text-[8px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-wider">
              {product.categoria}
            </div>
            {product.is_vegan && <div title="Vegano" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 text-[8px] md:text-[10px] font-bold border border-green-100">🌱 <span className="hidden md:inline">Vegano</span></div>}
            {product.is_vegetarian && <div title="Vegetariano" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-600 text-[8px] md:text-[10px] font-bold border border-yellow-100">🥗 <span className="hidden md:inline">Vege</span></div>}
            {product.is_gluten_free && <div title="Sin Gluten" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[8px] md:text-[10px] font-bold border border-orange-100">🌾 <span className="hidden md:inline">Sin Gluten</span></div>}
            {product.is_spicy && <div title="Picante" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[8px] md:text-[10px] font-bold border border-red-100">🌶️ <span className="hidden md:inline">Picante</span></div>}
          </div>"""

content = content.replace(target_card, replacement_card)

# Replace 3: Inject emojis into Product Detail Modal
target_modal = """                      <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[10px] font-black text-[#22C55E] uppercase tracking-wider mb-2">
                          {selectedProduct.categoria}
                        </div>"""

replacement_modal = """                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[10px] font-black text-[#22C55E] uppercase tracking-wider">
                            {selectedProduct.categoria}
                          </div>
                          {selectedProduct.is_vegan && <div title="Vegano" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-50 text-green-600 text-[11px] font-black border border-green-100 uppercase tracking-widest">🌱 Vegano</div>}
                          {selectedProduct.is_vegetarian && <div title="Vegetariano" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-50 text-yellow-600 text-[11px] font-black border border-yellow-100 uppercase tracking-widest">🥗 Vegetariano</div>}
                          {selectedProduct.is_gluten_free && <div title="Sin Gluten" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 text-orange-600 text-[11px] font-black border border-orange-100 uppercase tracking-widest">🌾 Sin Gluten</div>}
                          {selectedProduct.is_spicy && <div title="Picante" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-600 text-[11px] font-black border border-red-100 uppercase tracking-widest">🌶️ Picante</div>}
                          {selectedProduct.prep_time_minutes > 0 && <div title="Tiempo de Preparación" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-black border border-blue-100 uppercase tracking-widest">⏱️ {selectedProduct.prep_time_minutes} min</div>}
                        </div>"""

content = content.replace(target_modal, replacement_modal)

# Verify replacement worked
if target_card not in content and target_modal not in content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("MenuPublico.jsx successfully updated.")
else:
    print("Could not find targets to replace in MenuPublico.jsx")
