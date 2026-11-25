import re

file_path = r"c:\Users\luis.sarabia\MenuPro\frontend\src\pages\dashboard\ConfiguracionPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update productForm initial state
content = content.replace("""    const [productForm, setProductForm] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        etiqueta: '',
        imagen: '',
        disponible: true,
        destacado: false,
        oferta_porcentaje: '',
        modificadores: []
    });""", """    const [productForm, setProductForm] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        etiqueta: '',
        imagen: '',
        disponible: true,
        destacado: false,
        oferta_porcentaje: '',
        modificadores: [],
        is_vegan: false,
        is_vegetarian: false,
        is_gluten_free: false,
        is_spicy: false,
        prep_time_minutes: '',
        allergens: []
    });""")


# 2. Update openAddProduct
content = content.replace("""        const initial = {
            nombre: '',
            descripcion: '',
            precio: '',
            categoria: categories[0] || 'Entradas',
            etiqueta: '',
            imagen: '',
            disponible: true,
            destacado: false,
            oferta_porcentaje: '',
            modificadores: []
        };""", """        const initial = {
            nombre: '',
            descripcion: '',
            precio: '',
            categoria: categories[0] || 'Entradas',
            etiqueta: '',
            imagen: '',
            disponible: true,
            destacado: false,
            oferta_porcentaje: '',
            modificadores: [],
            is_vegan: false,
            is_vegetarian: false,
            is_gluten_free: false,
            is_spicy: false,
            prep_time_minutes: '',
            allergens: []
        };""")


# 3. Update openEditProduct
content = content.replace("""        const initial = {
            nombre: product.nombre,
            descripcion: product.descripcion || '',
            precio: (product.precio_original || product.precio).toString(),
            categoria: catName,
            etiqueta: product.etiqueta || '',
            imagen: product.imagen || '',
            disponible: product.disponible,
            destacado: product.destacado || false,
            oferta_porcentaje: product.oferta_porcentaje?.toString() || '',
            modificadores: product.modificadores || []
        };""", """        const initial = {
            nombre: product.nombre,
            descripcion: product.descripcion || '',
            precio: (product.precio_original || product.precio).toString(),
            categoria: catName,
            etiqueta: product.etiqueta || '',
            imagen: product.imagen || '',
            disponible: product.disponible,
            destacado: product.destacado || false,
            oferta_porcentaje: product.oferta_porcentaje?.toString() || '',
            modificadores: product.modificadores || [],
            is_vegan: product.is_vegan || false,
            is_vegetarian: product.is_vegetarian || false,
            is_gluten_free: product.is_gluten_free || false,
            is_spicy: product.is_spicy || false,
            prep_time_minutes: product.prep_time_minutes?.toString() || '',
            allergens: product.allergens || []
        };""")


# 4. Update menuItemPayload
content = content.replace("""            const menuItemPayload = {
                name: payload.name,
                description: payload.description,
                base_price: payload.base_price,
                precio_original: payload.precio_original,
                oferta_porcentaje: payload.oferta_porcentaje,
                category: payload.category,
                image_url: payload.image_url,
                available: payload.available,
                is_recommended: payload.is_recommended,
                currency: 'COP'
            };""", """            const menuItemPayload = {
                name: payload.name,
                description: payload.description,
                base_price: payload.base_price,
                precio_original: payload.precio_original,
                oferta_porcentaje: payload.oferta_porcentaje,
                category: payload.category,
                image_url: payload.image_url,
                available: payload.available,
                is_recommended: payload.is_recommended,
                currency: 'COP',
                is_vegan: productForm.is_vegan,
                is_vegetarian: productForm.is_vegetarian,
                is_gluten_free: productForm.is_gluten_free,
                is_spicy: productForm.is_spicy,
                prep_time_minutes: productForm.prep_time_minutes ? parseInt(productForm.prep_time_minutes) : null,
                allergens: productForm.allergens
            };""")

# 5. Add UI elements to the form
# Identify where to inject. Before <div className="space-y-2"> for "Descripción / Ingredientes"
ui_injection_target = """                                <div className="space-y-2">
                                    <Label className="font-bold">Descripción / Ingredientes</Label>
                                    <Textarea
                                        value={productForm.descripcion}"""

ui_injection_replacement = """                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={productForm.is_vegan}
                                            onCheckedChange={val => setProductForm({ ...productForm, is_vegan: val })}
                                            className="data-[state=checked]:bg-[#22C55E] scale-75"
                                        />
                                        <Label className="text-xs font-bold text-gray-600">Vegano 🌱</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={productForm.is_vegetarian}
                                            onCheckedChange={val => setProductForm({ ...productForm, is_vegetarian: val })}
                                            className="data-[state=checked]:bg-yellow-500 scale-75"
                                        />
                                        <Label className="text-xs font-bold text-gray-600">Vegetariano 🥗</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={productForm.is_gluten_free}
                                            onCheckedChange={val => setProductForm({ ...productForm, is_gluten_free: val })}
                                            className="data-[state=checked]:bg-blue-400 scale-75"
                                        />
                                        <Label className="text-xs font-bold text-gray-600">Sin Gluten 🌾</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={productForm.is_spicy}
                                            onCheckedChange={val => setProductForm({ ...productForm, is_spicy: val })}
                                            className="data-[state=checked]:bg-red-500 scale-75"
                                        />
                                        <Label className="text-xs font-bold text-gray-600">Picante 🌶️</Label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">Tiempo de Prep. (Minutos)</Label>
                                    <Input
                                        type="number"
                                        value={productForm.prep_time_minutes}
                                        onChange={e => setProductForm({ ...productForm, prep_time_minutes: e.target.value })}
                                        className="h-12 w-32 rounded-2xl bg-gray-50 border-gray-100"
                                        placeholder="Ej: 15"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">Descripción / Ingredientes</Label>
                                    <Textarea
                                        value={productForm.descripcion}"""

content = content.replace(ui_injection_target, ui_injection_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ConfiguracionPage.jsx updated via python script.")
