import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  Upload,
  FolderPlus,
  UtensilsCrossed,
  ExternalLink,
  Tag,
  Sparkles,
  Apple,
  Maximize,
  PlusCircle,
  ListChecks,
  Clock,
  Star,
  Flame,
  ChefHat
} from 'lucide-react';
import {
  INGREDIENT_CATEGORIES,
  loadMenuIngredientsLocal,
  evaluateProductIngredients,
  getIngredientCategoryMeta,
} from '@/utils/menuIngredients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const defaultCategories = ['Ejecutivos', 'Preparados del Día', 'Asados', 'Vaqueritos', 'Picadas', 'Bebidas'];
const defaultTags = ['Recomendado', 'Más Vendido', 'Nuevo', 'Oferta', 'Picante'];

const defaultImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
];

const categoryEmojis = ['🍽️', '🍔', '🥩', '🍲', '🥗', '🍕', '🌮', '🥤', '🍰', '☕', '🍤', '🍝'];

const emptyFormData = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  etiqueta: '',
  imagen_url: '',
  disponible: true,
  destacado: false,
  oferta_porcentaje: '',
  prep_time_minutes: '',
  nutri_kcal: '',
  nutri_proteina: '',
  nutri_carbohidratos: '',
  nutri_grasa: '',
  tamanos: [],
  modificadores: [],
  opciones: [],
  menu_item_ingredients: []
};

export default function CatalogoPage() {
  const { slug = 'vecos' } = useParams();
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState(defaultTags);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Dish Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAIDesc, setGeneratingAIDesc] = useState(false);
  const [generatingAIImg, setGeneratingAIImg] = useState(false);
  const [analyzingNutrition, setAnalyzingNutrition] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(emptyFormData);

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🍽️');
  const [editingCategoryOriginal, setEditingCategoryOriginal] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Tag Management Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagOriginal, setEditingTagOriginal] = useState(null);
  const [savingTag, setSavingTag] = useState(false);

  // Ingredients Management Modal State (Opción A: switch rápido dentro de Menú)
  const [ingredients, setIngredients] = useState(() => loadMenuIngredientsLocal());
  const [isIngredientsModalOpen, setIsIngredientsModalOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState('acompanante');
  const [savingIngredient, setSavingIngredient] = useState(false);
  const [bulkAssignCategory, setBulkAssignCategory] = useState('Ejecutivos');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTags();
    fetchIngredients();
  }, [slug]);

  const fetchIngredients = async () => {
    try {
      const res = await api().get('/menu-ingredients');
      if (Array.isArray(res.data)) {
        setIngredients(res.data);
      }
    } catch {
      setIngredients(loadMenuIngredientsLocal());
    }
  };

  const handleCreateIngredient = async (e) => {
    e.preventDefault();
    const cleanName = newIngredientName.trim();
    if (!cleanName) {
      toast.error('Escribe el nombre del ingrediente');
      return;
    }
    setSavingIngredient(true);
    try {
      const res = await api().post('/menu-ingredients', {
        name: cleanName,
        category: newIngredientCategory,
        is_available: true,
      });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success(`Ingrediente "${cleanName}" creado`);
        setNewIngredientName('');
        fetchIngredients();
      }
    } catch {
      toast.error('Error al crear ingrediente');
    } finally {
      setSavingIngredient(false);
    }
  };

  const handleToggleIngredientAvailability = async (ing) => {
    const nextVal = !ing.is_available;
    setIngredients((prev) =>
      prev.map((item) => (item.id === ing.id ? { ...item, is_available: nextVal } : item))
    );
    try {
      await api().put(`/menu-ingredients/${ing.id}`, { is_available: nextVal });
      toast.success(
        nextVal
          ? `"${ing.name}" marcado como Disponible`
          : `"${ing.name}" marcado como Agotado`
      );
    } catch {
      setIngredients((prev) =>
        prev.map((item) => (item.id === ing.id ? { ...item, is_available: !nextVal } : item))
      );
      toast.error('No se pudo actualizar el ingrediente');
    }
  };

  const handleBulkAssignIngredient = async (ing, action = 'add') => {
    const targetCat = bulkAssignCategory || categoryNames[0];
    if (!targetCat) return;
    try {
      const res = await api().post('/menu-ingredients/bulk-assign-category', {
        category: targetCat,
        ingredient_id: ing.id,
        action,
        is_required: false,
      });
      const count = res.data?.affected ?? 0;
      toast.success(
        action === 'add'
          ? `"${ing.name}" asociado a ${count} platos de ${targetCat}`
          : `"${ing.name}" quitado de ${count} platos de ${targetCat}`
      );
      fetchProducts();
    } catch {
      toast.error('No se pudo aplicar el cambio a la categoría');
    }
  };

  const handleDeleteIngredient = async (ing) => {
    if (!window.confirm(`¿Eliminar "${ing.name}" de la lista de ingredientes?`)) return;
    try {
      await api().delete(`/menu-ingredients/${ing.id}`);
      toast.success(`Ingrediente "${ing.name}" eliminado`);
      fetchIngredients();
      fetchProducts();
    } catch {
      toast.error('Error al eliminar ingrediente');
    }
  };

  const toggleProductIngredient = (ing) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.menu_item_ingredients) ? prev.menu_item_ingredients : [];
      const exists = current.some((l) => String(l.ingredient_id) === String(ing.id));
      if (exists) {
        return {
          ...prev,
          menu_item_ingredients: current.filter((l) => String(l.ingredient_id) !== String(ing.id)),
        };
      }
      const catMeta = getIngredientCategoryMeta(ing.category);
      return {
        ...prev,
        menu_item_ingredients: [
          ...current,
          {
            ingredient_id: ing.id,
            is_required: catMeta.defaultRequired,
            quantity: 1,
            unit: 'porcion',
          },
        ],
      };
    });
  };

  const toggleProductIngredientRequired = (ingId) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.menu_item_ingredients) ? prev.menu_item_ingredients : [];
      return {
        ...prev,
        menu_item_ingredients: current.map((l) =>
          String(l.ingredient_id) === String(ingId) ? { ...l, is_required: !l.is_required } : l
        ),
      };
    });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api().get(`/products/${slug}`);
      const raw = response.data || [];
      const normalized = raw.map(p => ({
        ...p,
        id: p.id,
        nombre: p.nombre || p.name || 'Sin Nombre',
        descripcion: p.descripcion || p.description || '',
        precio: p.precio ?? p.price ?? 0,
        categoria: typeof p.categoria === 'object' ? p.categoria?.nombre : (p.categoria || p.category || 'General'),
        etiqueta: p.etiqueta || '',
        imagen_url: p.imagen_url || p.imagen || p.image_url || '',
        disponible: p.disponible ?? p.available ?? true,
        destacado: !!p.destacado,
        oferta_porcentaje: p.oferta_porcentaje || '',
        prep_time_minutes: p.prep_time_minutes || '',
        nutri_kcal: p.nutri_kcal || '',
        nutri_proteina: p.nutri_proteina || '',
        nutri_carbohidratos: p.nutri_carbohidratos || '',
        nutri_grasa: p.nutri_grasa || '',
        tamanos: Array.isArray(p.tamanos) ? p.tamanos : [],
        modificadores: Array.isArray(p.modificadores) ? p.modificadores : [],
        opciones: Array.isArray(p.opciones) ? p.opciones : [],
      }));
      setProducts(normalized);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api().get(`/categories/${slug}`);
      const raw = response.data || [];
      const list = raw
        .map(c => typeof c === 'string' ? { nombre: c, icono: '🍽️' } : { nombre: c.nombre || c.name, icono: c.icono || '🍽️' })
        .filter(c => c.nombre);
      setCategories(list.length > 0 ? list : defaultCategories.map(n => ({ nombre: n, icono: '🍽️' })));
    } catch (error) {
      setCategories(defaultCategories.map(n => ({ nombre: n, icono: '🍽️' })));
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api().get(`/tags/${slug}`);
      const raw = response.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        setTags(raw.map(t => typeof t === 'string' ? t : t.nombre).filter(Boolean));
      } else {
        setTags(defaultTags);
      }
    } catch {
      setTags(defaultTags);
    }
  };

  const categoryNames = categories.map(c => c.nombre);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyFormData,
      categoria: categoryNames[0] || 'Ejecutivos del Día',
      imagen_url: defaultImages[Math.floor(Math.random() * defaultImages.length)],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: (product.precio ?? '').toString(),
      categoria: product.categoria || categoryNames[0] || '',
      etiqueta: product.etiqueta || '',
      imagen_url: product.imagen_url || '',
      disponible: product.disponible ?? true,
      destacado: !!product.destacado,
      oferta_porcentaje: product.oferta_porcentaje ? product.oferta_porcentaje.toString() : '',
      prep_time_minutes: product.prep_time_minutes ? product.prep_time_minutes.toString() : '',
      nutri_kcal: product.nutri_kcal ? product.nutri_kcal.toString() : '',
      nutri_proteina: product.nutri_proteina || '',
      nutri_carbohidratos: product.nutri_carbohidratos || '',
      nutri_grasa: product.nutri_grasa || '',
      tamanos: JSON.parse(JSON.stringify(product.tamanos || [])),
      modificadores: JSON.parse(JSON.stringify(product.modificadores || [])),
      opciones: JSON.parse(JSON.stringify(product.opciones || [])),
      menu_item_ingredients: JSON.parse(JSON.stringify(product.menu_item_ingredients || [])),
    });
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, imagen_url: event.target.result }));
    };
    reader.readAsDataURL(file);

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await api().post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, imagen_url: res.data.url }));
      }
      toast.success('Imagen cargada');
    } catch {
      toast.success('Imagen lista');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.nombre.trim()) {
      toast.error('Asigna primero un nombre al plato');
      return;
    }
    setGeneratingAIDesc(true);
    try {
      const res = await api().post('/ai/generate-product-description', {
        nombre: formData.nombre
      });
      if (res.data?.description) {
        setFormData(prev => ({ ...prev, descripcion: res.data.description }));
        toast.success('¡Descripción generada con IA!');
      }
    } catch {
      toast.error('No se pudo generar la descripción con IA');
    } finally {
      setGeneratingAIDesc(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!formData.nombre.trim()) {
      toast.error('Asigna un nombre al plato para generar su imagen');
      return;
    }
    setGeneratingAIImg(true);
    try {
      const res = await api().post('/ai/generate-product-image', {
        nombre: formData.nombre,
        descripcion: formData.descripcion || ''
      });
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, imagen_url: res.data.url }));
        toast.success('¡Imagen generada por IA con éxito!');
      }
    } catch {
      toast.error('Error al generar imagen con IA');
    } finally {
      setGeneratingAIImg(false);
    }
  };

  const handleAnalyzeNutrition = async () => {
    if (!formData.nombre.trim()) {
      toast.error('Ingresa al menos el nombre del plato');
      return;
    }
    setAnalyzingNutrition(true);
    try {
      const res = await api().post('/ai/nutrition', {
        name: formData.nombre,
        description: formData.descripcion || ''
      });
      setFormData(prev => ({
        ...prev,
        nutri_kcal: res.data?.kcal ? String(res.data.kcal) : '',
        nutri_proteina: res.data?.proteina || '',
        nutri_carbohidratos: res.data?.carbohidratos || '',
        nutri_grasa: res.data?.grasa || ''
      }));
      toast.success('Información nutricional estimada por IA');
    } catch {
      toast.error('Error al estimar información nutricional');
    } finally {
      setAnalyzingNutrition(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre del plato es obligatorio');
      return;
    }
    const basePrice = parseFloat(formData.precio || '0');
    if (isNaN(basePrice)) {
      toast.error('Ingresa un precio válido');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: basePrice,
        categoria: formData.categoria || categoryNames[0] || 'General',
        etiqueta: formData.etiqueta && formData.etiqueta !== 'none' ? formData.etiqueta : '',
        imagen: formData.imagen_url,
        imagen_url: formData.imagen_url,
        disponible: formData.disponible,
        destacado: formData.destacado,
        oferta_porcentaje: formData.oferta_porcentaje ? parseInt(formData.oferta_porcentaje, 10) : null,
        prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes, 10) : null,
        nutri_kcal: formData.nutri_kcal ? parseInt(formData.nutri_kcal, 10) : null,
        nutri_proteina: formData.nutri_proteina || null,
        nutri_carbohidratos: formData.nutri_carbohidratos || null,
        nutri_grasa: formData.nutri_grasa || null,
        tamanos: formData.tamanos || [],
        modificadores: formData.modificadores || [],
        opciones: formData.opciones || [],
        menu_item_ingredients: formData.menu_item_ingredients || [],
      };

      if (editingProduct) {
        await api().put(`/products/${slug}/${editingProduct.id}`, payload);
        toast.success('Plato actualizado exitosamente');
      } else {
        await api().post(`/products/${slug}`, payload);
        toast.success('Plato creado exitosamente');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al guardar plato';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este plato del menú?')) return;

    try {
      await api().delete(`/products/${slug}/${productId}`);
      toast.success('Plato eliminado');
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch {
      toast.error('Error al eliminar plato');
    }
  };

  const toggleAvailability = async (product) => {
    const newStatus = !product.disponible;
    try {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, disponible: newStatus } : p));
      await api().put(`/products/${slug}/${product.id}`, { disponible: newStatus });
      toast.success(newStatus ? 'Plato disponible' : 'Plato marcado como agotado');
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, disponible: !newStatus } : p));
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) {
      toast.error('Escribe el nombre de la categoría');
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategoryOriginal) {
        await api().put(`/categories/${slug}`, {
          old_name: editingCategoryOriginal,
          nombre: catName,
          icono: newCategoryIcon
        }).catch(() => {});
        setCategories(prev => prev.map(c =>
          c.nombre === editingCategoryOriginal ? { nombre: catName, icono: newCategoryIcon } : c
        ));
        toast.success('Categoría actualizada');
      } else {
        if (categoryNames.includes(catName)) {
          toast.error('Esta categoría ya existe');
          setSavingCategory(false);
          return;
        }
        await api().post(`/categories/${slug}`, { nombre: catName, icono: newCategoryIcon }).catch(() => {});
        setCategories(prev => [...prev, { nombre: catName, icono: newCategoryIcon }]);
        toast.success('Categoría creada exitosamente');
      }
      setNewCategoryName('');
      setNewCategoryIcon('🍽️');
      setEditingCategoryOriginal(null);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`¿Eliminar la categoría "${catName}"?`)) return;
    try {
      await api().delete(`/categories/${slug}?nombre=${encodeURIComponent(catName)}`).catch(() => {});
      setCategories(prev => prev.filter(c => c.nombre !== catName));
      toast.success('Categoría eliminada');
    } catch {
      setCategories(prev => prev.filter(c => c.nombre !== catName));
      toast.success('Categoría eliminada');
    }
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();
    const tagVal = newTagName.trim();
    if (!tagVal) {
      toast.error('Escribe el nombre de la etiqueta');
      return;
    }
    setSavingTag(true);
    try {
      if (editingTagOriginal) {
        await api().put(`/tags/${slug}`, { old_name: editingTagOriginal, nombre: tagVal }).catch(() => {});
        setTags(prev => prev.map(t => (t === editingTagOriginal ? tagVal : t)));
        toast.success('Etiqueta renombrada');
      } else {
        if (tags.includes(tagVal)) {
          toast.error('Esta etiqueta ya existe');
          setSavingTag(false);
          return;
        }
        await api().post(`/tags/${slug}`, { nombre: tagVal }).catch(() => {});
        setTags(prev => [...prev, tagVal]);
        toast.success('Etiqueta creada');
      }
      setNewTagName('');
      setEditingTagOriginal(null);
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (tagVal) => {
    if (!window.confirm(`¿Eliminar la etiqueta "${tagVal}"?`)) return;
    await api().delete(`/tags/${slug}?nombre=${encodeURIComponent(tagVal)}`).catch(() => {});
    setTags(prev => prev.filter(t => t !== tagVal));
    toast.success('Etiqueta eliminada');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value));
  };

  const formatPriceInput = (val) => {
    if (!val && val !== 0) return '';
    const num = val.toString().replace(/\D/g, '');
    return num ? parseInt(num, 10).toLocaleString('es-CO') : '';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.categoria || 'Otras Especialidades';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-[#4ADE80]/15 flex items-center justify-center text-[#22C55E] shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase truncate">
                Gestión de Menú
              </h1>
              <p className="text-xs text-gray-400 font-medium truncate">
                {products.length} platos registrados en {categories.length} categorías
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/menu', '_blank')}
              className="h-9 px-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-[11px] uppercase tracking-wider hover:bg-gray-50 gap-1.5 shadow-none"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              Ver Menú
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-9 px-3 rounded-xl border border-[#4ADE80]/60 text-[#15803D] hover:bg-[#4ADE80]/10 font-bold text-[11px] uppercase tracking-wider gap-1.5 shadow-none"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#22C55E]" />
              Categorías ({categories.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(true)}
              className="h-9 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[11px] uppercase tracking-wider gap-1.5 shadow-none"
            >
              <Tag className="w-3.5 h-3.5 text-[#22C55E]" />
              Etiquetas ({tags.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIngredientsModalOpen(true)}
              className={`h-9 px-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider gap-1.5 shadow-none ${
                ingredients.some((i) => !i.is_available)
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Acompañantes / Ingred. ({ingredients.length})
              {ingredients.filter((i) => !i.is_available).length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black">
                  {ingredients.filter((i) => !i.is_available).length} agot.
                </span>
              )}
            </Button>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="h-9 px-4 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-[11px] uppercase tracking-wider shadow-md shadow-[#4ADE80]/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Plato
            </Button>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar plato por nombre o ingredientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-white border-2 border-gray-100 font-medium text-sm focus-visible:ring-[#4ADE80]"
              />
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterCategory('all')}
              className={`h-9 px-4 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                filterCategory === 'all'
                  ? 'bg-[#111814] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todas ({products.length})
            </button>
            {categories.map((catObj) => {
              const cat = catObj.nombre;
              const count = products.filter(p => p.categoria === cat).length;
              const isSelected = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`h-9 px-4 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#4ADE80] text-[#111814] shadow-md shadow-[#4ADE80]/20'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{catObj.icono}</span>
                  <span>{cat} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
          </div>
        )}

        {/* Empty State */}
        {!loading && Object.keys(groupedProducts).length === 0 && (
          <Card className="rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center bg-white">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">No se encontraron platos</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Intenta buscar con otro término.' : 'Comienza agregando los primeros platos a tu menú.'}
            </p>
            <Button
              onClick={openCreateModal}
              className="mt-6 h-11 px-6 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase tracking-wider gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Plato
            </Button>
          </Card>
        )}

        {/* Grouped Dishes Grid */}
        {!loading && Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                <h2 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-wider">
                  {category}
                </h2>
                <span className="text-xs font-bold text-gray-400">({categoryProducts.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence>
                {categoryProducts.map((product) => {
                  const ingEval = evaluateProductIngredients(product, ingredients);
                  const effectivelySoldOut = !product.disponible || ingEval.soldOut;
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-white rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between hover:shadow-xl ${
                        effectivelySoldOut ? 'border-red-100 bg-red-50/20 opacity-85' : 'border-gray-100'
                      }`}
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                          {product.imagen_url || product.imagen ? (
                            <img
                              src={product.imagen_url || product.imagen}
                              alt={product.nombre}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/images/hero-almuerzo.jpg';
                              }}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                              <ImageIcon className="w-10 h-10 mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Sin foto</span>
                            </div>
                          )}

                          <Badge
                            title={
                              ingEval.soldOut
                                ? `Agotado por ingrediente: ${ingEval.missingNames.join(', ')}`
                                : undefined
                            }
                            className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider border-none ${
                              effectivelySoldOut ? 'bg-red-500 text-white' : 'bg-[#22C55E] text-white'
                            }`}
                          >
                            {!product.disponible
                              ? 'Inactivo'
                              : ingEval.soldOut
                                ? 'Agotado (Ingred.)'
                                : 'Disponible'}
                          </Badge>

                          {product.etiqueta && (
                            <Badge className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-[#C86414] text-white border-none shadow-sm">
                              {product.etiqueta}
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-black text-base text-gray-900 tracking-tight truncate flex-1" title={product.nombre}>
                              {product.nombre}
                            </h3>
                            {product.destacado && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
                            {product.descripcion || 'Sin descripción detallada.'}
                          </p>

                          {/* Micro Badges: 3 columns x 2 rows (4 nutritional + prep time + discount) */}
                          {(product.nutri_kcal > 0 || product.nutri_proteina || product.nutri_carbohidratos || product.nutri_grasa || product.prep_time_minutes > 0 || product.oferta_porcentaje > 0) && (
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {product.nutri_kcal > 0 && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-[9px] font-black text-[#C86414] whitespace-nowrap">
                                  🔥 {product.nutri_kcal} kcal
                                </span>
                              )}
                              {product.nutri_proteina && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-black text-rose-700 whitespace-nowrap">
                                  🥩 {product.nutri_proteina} prot
                                </span>
                              )}
                              {product.nutri_carbohidratos && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-[9px] font-black text-amber-700 whitespace-nowrap">
                                  🍚 {product.nutri_carbohidratos} carb
                                </span>
                              )}
                              {product.nutri_grasa && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[9px] font-black text-emerald-700 whitespace-nowrap">
                                  🥑 {product.nutri_grasa} grasa
                                </span>
                              )}
                              {product.prep_time_minutes > 0 && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 whitespace-nowrap">
                                  ⏱️ {product.prep_time_minutes} min
                                </span>
                              )}
                              {product.oferta_porcentaje > 0 && (
                                <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-[9px] font-black text-red-600 whitespace-nowrap">
                                  🔥 -{product.oferta_porcentaje}%
                                </span>
                              )}
                            </div>
                          )}

                          <p className="font-black text-lg text-[#15803D] pt-1">
                            {formatCurrency(product.precio)}
                          </p>
                        </div>
                      </div>

                      {/* Footer Controls */}
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.disponible}
                            onCheckedChange={() => toggleAvailability(product)}
                          />
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                            {product.disponible ? 'Activo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                            title="Editar plato"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* DIALOG: FULL LEGACY PRODUCT MODAL (TAMAÑOS, OPCIONES, ADICIONALES, NUTRICIÓN IA) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="rounded-[2.5rem] max-w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-2 border-[#4ADE80]/20 shadow-2xl">
            <DialogHeader className="p-6 md:p-8 pb-4 bg-gray-50 border-b border-gray-100 shrink-0">
              <DialogTitle className="text-xl md:text-2xl font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#22C55E]" />
                {editingProduct ? 'Editar Plato' : 'Nuevo Plato'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Configura detalles, información nutricional estimada por IA, tamaños, adicionales y opciones.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[78vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                {/* Nombre y Precio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-700">Nombre del Plato *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 font-semibold"
                      placeholder="Ej: Hamburguesa Suprema"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-700">Precio Base (COP) *</Label>
                    <Input
                      type="text"
                      value={formatPriceInput(formData.precio)}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, precio: raw });
                      }}
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 font-black text-[#15803D]"
                      placeholder="25.000"
                    />
                  </div>
                </div>

                {/* Descripción + Imagen con IA */}
                <div className="space-y-4 p-5 rounded-3xl border border-[#4ADE80]/25 bg-emerald-50/15">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-gray-800">Descripción / Ingredientes</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateAIDescription}
                        disabled={generatingAIDesc || !formData.nombre}
                        className="h-7 px-2.5 text-[#15803D] hover:bg-emerald-100/70 font-black text-[10px] gap-1.5 rounded-lg"
                      >
                        {generatingAIDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingAIDesc ? 'GENERANDO...' : 'DESCRIBIR CON IA'}
                      </Button>
                    </div>
                    <Textarea
                      value={formData.descripcion}
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      className="rounded-xl bg-white border-gray-200 min-h-[85px] text-xs"
                      placeholder="Detalla lo que incluye el plato, ingredientes o preparación..."
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-gray-800">Imagen del Plato</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAIImage}
                          disabled={generatingAIImg || uploadingImage}
                          className="h-8 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black gap-1.5 text-[10px]"
                        >
                          {generatingAIImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {generatingAIImg ? 'GENERANDO...' : '🔮 GENERAR CON IA'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="h-8 rounded-xl border-emerald-200 text-[#15803D] hover:bg-emerald-50 font-black gap-1.5 text-[10px]"
                        >
                          {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          {uploadingImage ? 'SUBIENDO...' : 'SUBIR IMAGEN'}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3 items-center">
                      <Input
                        value={formData.imagen_url}
                        onChange={e => setFormData({ ...formData, imagen_url: e.target.value })}
                        className="h-11 rounded-xl bg-white border-gray-200 text-xs font-mono flex-1"
                        placeholder="URL de la imagen o sube una..."
                      />
                      <div className="size-11 rounded-xl border border-gray-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                        {formData.imagen_url ? (
                          <img
                            src={formData.imagen_url}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/hero-almuerzo.jpg';
                            }}
                            className="w-full h-full object-cover"
                            alt="Vista previa"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </div>

                    {formData.imagen_url && (
                      <div className="mt-2 relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 h-44 w-full">
                        <img
                          src={formData.imagen_url}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/hero-almuerzo.jpg';
                          }}
                          className="w-full h-full object-cover"
                          alt={formData.nombre || 'Vista previa del plato'}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Categoría y Etiqueta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-3xl border border-gray-100 bg-gray-50/50">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-700">Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={val => setFormData({ ...formData, categoria: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200 text-xs font-bold">
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-bold">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-700">Etiqueta (Opcional)</Label>
                    <Select
                      value={formData.etiqueta || 'none'}
                      onValueChange={val => setFormData({ ...formData, etiqueta: val === 'none' ? '' : val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200 border-dashed text-xs font-bold">
                        <SelectValue placeholder="Sin etiqueta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs font-bold">Ninguna</SelectItem>
                        {tags.map(tag => (
                          <SelectItem key={tag} value={tag} className="text-xs font-bold">{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Valores Nutricionales (Estimada por IA) */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Apple className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <Label className="text-xs font-black uppercase tracking-wider text-gray-900">
                          Información Nutricional (Estimada por IA)
                        </Label>
                        <p className="text-[10px] text-gray-400">Valores aproximados calculados basados en la receta (Opcional)</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAnalyzeNutrition}
                      disabled={analyzingNutrition}
                      variant="outline"
                      className="h-8 rounded-xl border-[#22C55E]/30 bg-[#22C55E]/5 text-[#15803D] hover:bg-[#22C55E] hover:text-white transition-all text-[10px] font-black gap-1.5 px-3"
                    >
                      {analyzingNutrition ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {analyzingNutrition ? 'ANALIZANDO...' : '🔮 GENERAR CON IA'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Calorías (kcal)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ej: 720"
                        value={formData.nutri_kcal}
                        onChange={e => setFormData({ ...formData, nutri_kcal: e.target.value })}
                        className="h-10 bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Proteínas (g)</Label>
                      <Input
                        placeholder="Ej: 45g"
                        value={formData.nutri_proteina}
                        onChange={e => setFormData({ ...formData, nutri_proteina: e.target.value })}
                        className="h-10 bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Carbos (g)</Label>
                      <Input
                        placeholder="Ej: 38g"
                        value={formData.nutri_carbohidratos}
                        onChange={e => setFormData({ ...formData, nutri_carbohidratos: e.target.value })}
                        className="h-10 bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grasas (g)</Label>
                      <Input
                        placeholder="Ej: 28g"
                        value={formData.nutri_grasa}
                        onChange={e => setFormData({ ...formData, nutri_grasa: e.target.value })}
                        className="h-10 bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIONES DE PERSONALIZACIÓN: TAMAÑOS, ADICIONALES, OPCIONES */}
                <div className="space-y-8 border-t border-gray-100 pt-6">
                  {[
                    {
                      id: 'tamanos',
                      label: 'Tamaños',
                      desc: 'Define las tallas o porciones y escribe el precio final de cada una (Ej: 150 gr → $17.000, 300 gr → $22.000). Reemplaza el precio base.',
                      icon: Maximize,
                      hasPrice: true,
                      isFinalPrice: true
                    },
                    {
                      id: 'modificadores',
                      label: 'Adicionales',
                      desc: 'Ingredientes o extras con costo adicional (Ej: Queso extra, Tocineta).',
                      icon: PlusCircle,
                      hasPrice: true
                    },
                    {
                      id: 'opciones',
                      label: 'Opciones',
                      desc: 'Preferencias que no afectan el precio (Ej: Término Medio, Bien Cocido).',
                      icon: ListChecks,
                      hasPrice: false
                    }
                  ].map((section) => (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-[#4ADE80]/15 rounded-xl">
                            <section.icon className="w-4 h-4 text-[#22C55E]" />
                          </div>
                          <div>
                            <Label className="text-xs font-black uppercase tracking-wider text-gray-900">{section.label}</Label>
                            <p className="text-[10px] text-gray-500">{section.desc}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newGroup = {
                              id: Date.now().toString(),
                              nombre: section.id === 'tamanos' ? 'Tamaño' : section.id === 'modificadores' ? 'Adicionales' : 'Opciones',
                              obligatorio: section.id === 'tamanos',
                              seleccion_minima: section.id === 'tamanos' ? 1 : 0,
                              seleccion_maxima: section.id === 'tamanos' ? 1 : 3,
                              max_qty_per_option: 1,
                              opciones: [{ id: Date.now().toString() + '-opt', nombre: '', precio: 0 }]
                            };
                            setFormData(prev => ({
                              ...prev,
                              [section.id]: [...(prev[section.id] || []), newGroup]
                            }));
                          }}
                          className="h-8 rounded-xl border-[#4ADE80]/40 text-[#15803D] hover:bg-[#4ADE80]/10 font-black gap-1.5 text-[10px] shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          AÑADIR GRUPO
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(formData[section.id] || []).map((group, gIdx) => (
                          <div key={group.id || gIdx} className="bg-white border border-emerald-200/70 rounded-2xl p-4 shadow-sm relative">
                            <button
                              type="button"
                              onClick={() => {
                                const newList = [...formData[section.id]];
                                newList.splice(gIdx, 1);
                                setFormData({ ...formData, [section.id]: newList });
                              }}
                              className="absolute -top-2.5 -right-2.5 size-7 bg-white border border-red-200 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                              title="Eliminar grupo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 items-end">
                              <div className="md:col-span-1 space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Nombre del Grupo</Label>
                                <Input
                                  value={group.nombre}
                                  onChange={e => {
                                    const newList = [...formData[section.id]];
                                    newList[gIdx].nombre = e.target.value;
                                    setFormData({ ...formData, [section.id]: newList });
                                  }}
                                  className="h-9 rounded-xl bg-gray-50 border-gray-200 text-xs font-bold"
                                  placeholder={`Ej: ${section.label}`}
                                />
                              </div>

                              <div className="md:col-span-3 flex flex-wrap items-center gap-2 md:justify-end">
                                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                                  <Switch
                                    checked={!!group.obligatorio}
                                    onCheckedChange={val => {
                                      const newList = [...formData[section.id]];
                                      newList[gIdx].obligatorio = val;
                                      newList[gIdx].seleccion_minima = val ? 1 : 0;
                                      setFormData({ ...formData, [section.id]: newList });
                                    }}
                                    className="data-[state=checked]:bg-[#22C55E] scale-75"
                                  />
                                  <Label className="text-[9px] font-black uppercase text-[#15803D]">Obligatorio</Label>
                                </div>

                                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                                  <Label className="text-[9px] font-black uppercase text-gray-500">Máx. Items</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={group.seleccion_maxima}
                                    onChange={e => {
                                      const newList = [...formData[section.id]];
                                      newList[gIdx].seleccion_maxima = parseInt(e.target.value, 10) || 1;
                                      setFormData({ ...formData, [section.id]: newList });
                                    }}
                                    className="h-7 w-12 rounded-lg bg-white border-gray-200 text-center font-bold text-xs p-0"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                                  <Label className="text-[9px] font-black uppercase text-gray-500">Cant. x Opción</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={group.max_qty_per_option ?? 1}
                                    onChange={e => {
                                      const newList = [...formData[section.id]];
                                      newList[gIdx].max_qty_per_option = parseInt(e.target.value, 10) || 0;
                                      setFormData({ ...formData, [section.id]: newList });
                                    }}
                                    className="h-7 w-12 rounded-lg bg-white border-gray-200 text-center font-bold text-xs p-0"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 border-t border-gray-100 pt-3">
                              <Label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Opciones del grupo</Label>
                              <div className="space-y-2">
                                {group.opciones.map((opt, oIdx) => (
                                  <div key={opt.id || oIdx} className="flex gap-2 items-center">
                                    <Input
                                      value={opt.nombre}
                                      onChange={e => {
                                        const newList = [...formData[section.id]];
                                        newList[gIdx].opciones[oIdx].nombre = e.target.value;
                                        setFormData({ ...formData, [section.id]: newList });
                                      }}
                                      className="h-9 rounded-xl bg-white border-gray-200 text-xs flex-1"
                                      placeholder="Nombre de la opción (Ej: Grande, Queso Extra...)"
                                    />
                                    {section.hasPrice && (
                                      <div className="w-32 relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">
                                          {section.isFinalPrice ? '$' : '+$'}
                                        </span>
                                        <Input
                                          type="text"
                                          value={opt.precio > 0 ? formatPriceInput(opt.precio) : ''}
                                          onChange={e => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            const newList = [...formData[section.id]];
                                            newList[gIdx].opciones[oIdx].precio = parseFloat(raw) || 0;
                                            setFormData({ ...formData, [section.id]: newList });
                                          }}
                                          className="h-9 rounded-xl bg-white border-gray-200 text-xs pl-7 font-bold"
                                          placeholder={section.isFinalPrice ? 'Precio final' : '0'}
                                        />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = [...formData[section.id]];
                                        newList[gIdx].opciones.splice(oIdx, 1);
                                        setFormData({ ...formData, [section.id]: newList });
                                      }}
                                      disabled={group.opciones.length <= 1}
                                      className="size-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newList = [...formData[section.id]];
                                  newList[gIdx].opciones.push({ id: Date.now().toString(), nombre: '', precio: 0 });
                                  setFormData({ ...formData, [section.id]: newList });
                                }}
                                className="h-8 text-[10px] font-black text-[#15803D] hover:bg-emerald-50 w-full border border-dashed border-emerald-200 rounded-xl"
                              >
                                <Plus className="w-3 h-3 mr-1" /> AÑADIR OPCIÓN
                              </Button>
                            </div>
                          </div>
                        ))}

                        {(!formData[section.id] || formData[section.id].length === 0) && (
                          <div className="py-4 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Sin {section.label.toLowerCase()} configurados</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ingredientes / Componentes asociados al plato (menu_item_ingredients) */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-amber-50 flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-[#C86414]" />
                      </div>
                      <div>
                        <Label className="text-xs font-black uppercase tracking-wider text-gray-900">
                          Ingredientes / Componentes del Plato
                        </Label>
                        <p className="text-[10px] text-gray-400">
                          Asocia los ingredientes de este plato. Marca como <b>Base del plato</b> solo los esenciales (si se agotan, el plato queda Agotado). Los demás son <b>Opcionales</b>: el cliente elige si los quiere o no, y si se agotan solo se ocultan.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsIngredientsModalOpen(true)}
                      className="h-8 rounded-xl border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 text-[10px] font-black gap-1.5 px-3"
                    >
                      <Plus className="w-3 h-3" /> Gestionar Ingredientes
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {INGREDIENT_CATEGORIES.map((cat) => {
                      const catItems = ingredients.filter((i) => i.category === cat.id && i.is_active !== false);
                      if (catItems.length === 0) return null;
                      return (
                        <div key={cat.id} className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {catItems.map((ing) => {
                              const linked = (formData.menu_item_ingredients || []).find(
                                (l) => String(l.ingredient_id) === String(ing.id)
                              );
                              const isChecked = !!linked;
                              return (
                                <div
                                  key={ing.id}
                                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all ${
                                    isChecked
                                      ? 'bg-white border-[#4ADE80] shadow-sm'
                                      : 'bg-white/60 border-gray-100 hover:border-gray-200'
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleProductIngredient(ing)}
                                      className="size-4 rounded accent-[#16A34A] shrink-0"
                                    />
                                    <span className={`text-xs font-bold truncate ${!ing.is_available ? 'line-through text-red-400' : 'text-gray-800'}`}>
                                      {ing.name}
                                    </span>
                                    {!ing.is_available && (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600 shrink-0">
                                        Agotado
                                      </span>
                                    )}
                                  </label>

                                  {isChecked && (
                                    <button
                                      type="button"
                                      onClick={() => toggleProductIngredientRequired(ing.id)}
                                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors ${
                                        linked.is_required
                                          ? 'bg-[#C86414]/15 text-[#C86414] hover:bg-[#C86414]/25'
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                      title="Base del plato: si se agota, el plato entero queda Agotado. Opcional: si se agota, solo se oculta la opción."
                                    >
                                      {linked.is_required ? 'Base del plato' : 'Opcional'}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Descuento (%) y Tiempo de Preparación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-3xl border border-[#4ADE80]/25 bg-emerald-50/30">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#22C55E]" />
                      Descuento (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.oferta_porcentaje}
                        onChange={e => setFormData({ ...formData, oferta_porcentaje: e.target.value })}
                        className="h-11 rounded-xl bg-white border-gray-200 pr-9 font-black text-[#15803D]"
                        placeholder="Ej: 15"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-[#22C55E]">%</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Se aplicará automáticamente al precio base.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#22C55E]" />
                      Tiempo de Prep. (Minutos)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.prep_time_minutes}
                      onChange={e => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                      className="h-11 rounded-xl bg-white border-gray-200 font-bold"
                      placeholder="Ej: 15"
                    />
                    <p className="text-[10px] text-gray-500">Tiempo estimado de cocina para el cliente.</p>
                  </div>
                </div>

                {/* Disponible y Destacado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Disponible en Menú</p>
                      <p className="text-[10px] text-gray-500">Si se desactiva aparecerá como "Agotado".</p>
                    </div>
                    <Switch
                      checked={formData.disponible}
                      onCheckedChange={(checked) => setFormData({ ...formData, disponible: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${formData.destacado ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                        Producto Destacado
                      </p>
                      <p className="text-[10px] text-gray-500">Aparecerá en recomendados.</p>
                    </div>
                    <Switch
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white py-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 rounded-2xl border-gray-200 font-black text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-12 rounded-2xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#4ADE80]/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {editingProduct ? 'Guardar Cambios' : 'Crear Plato'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: CATEGORY MANAGEMENT (WITH ICON & EDIT) */}
        <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
          setIsCategoryModalOpen(open);
          if (!open) {
            setEditingCategoryOriginal(null);
            setNewCategoryName('');
            setNewCategoryIcon('🍽️');
          }
        }}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6 md:p-8">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#22C55E]" />
                Gestionar Categorías
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 font-medium">
                Organiza tu menú en secciones con ícono personalizado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              <form onSubmit={handleSaveCategory} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {categoryEmojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewCategoryIcon(em)}
                      className={`size-8 rounded-lg text-base flex items-center justify-center border transition-all ${
                        newCategoryIcon === em ? 'border-[#22C55E] bg-emerald-50 scale-110' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={editingCategoryOriginal ? 'Nuevo nombre...' : 'Nombre de nueva categoría...'}
                    className="h-11 rounded-xl border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                  />
                  <Button
                    type="submit"
                    disabled={savingCategory || !newCategoryName.trim()}
                    className="h-11 px-5 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase tracking-wider shrink-0 gap-1"
                  >
                    {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingCategoryOriginal ? 'Guardar' : 'Añadir'}
                  </Button>
                </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {categories.map((catObj) => {
                  const dishCount = products.filter(p => p.categoria === catObj.nombre).length;
                  return (
                    <div
                      key={catObj.nombre}
                      className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{catObj.icono}</span>
                        <span className="text-xs font-black text-gray-800 uppercase tracking-wide">{catObj.nombre}</span>
                        <span className="text-[10px] text-gray-400">({dishCount} platos)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategoryOriginal(catObj.nombre);
                            setNewCategoryName(catObj.nombre);
                            setNewCategoryIcon(catObj.icono || '🍽️');
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-white transition-colors"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(catObj.nombre)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-full h-11 rounded-xl border-gray-200 font-black text-xs uppercase tracking-wider"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: TAGS MANAGEMENT */}
        <Dialog open={isTagModalOpen} onOpenChange={(open) => {
          setIsTagModalOpen(open);
          if (!open) {
            setEditingTagOriginal(null);
            setNewTagName('');
          }
        }}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6 md:p-8">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#22C55E]" />
                Gestionar Etiquetas
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 font-medium">
                Destaca platos con etiquetas como Oferta, Nuevo, Recomendado o Picante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              <form onSubmit={handleSaveTag} className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={editingTagOriginal ? 'Nuevo nombre...' : 'Ej: Especial Chef, Vegano...'}
                  className="h-11 rounded-xl border-gray-200 text-xs font-semibold focus-visible:ring-[#4ADE80]"
                />
                <Button
                  type="submit"
                  disabled={savingTag || !newTagName.trim()}
                  className="h-11 px-5 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase tracking-wider shrink-0 gap-1"
                >
                  {savingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingTagOriginal ? 'Guardar' : 'Añadir'}
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 pl-3 pr-1.5 py-1.5 rounded-xl"
                  >
                    <span className="text-xs font-black text-[#15803D]">{tag}</span>
                    <button
                      onClick={() => {
                        setEditingTagOriginal(tag);
                        setNewTagName(tag);
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-white"
                      title="Renombrar"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTagModalOpen(false)}
                  className="w-full h-11 rounded-xl border-gray-200 font-black text-xs uppercase tracking-wider"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* INGREDIENTS QUICK-TOGGLE MANAGER MODAL (Opción A) */}
        <Dialog open={isIngredientsModalOpen} onOpenChange={setIsIngredientsModalOpen}>
          <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white max-h-[88vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#C86414]" />
                  Acompañantes / Ingredientes del Día
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Desmarca un acompañante cuando se agote para ocultarlo automáticamente en todos los platos asociados.
                </DialogDescription>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Selector de categoría para asociación masiva en 1 clic */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold text-amber-900">
                  Asociar / quitar en bloque a categoría:
                </div>
                <Select value={bulkAssignCategory} onValueChange={setBulkAssignCategory}>
                  <SelectTrigger className="h-8 w-44 rounded-xl bg-white border-amber-200 text-xs font-bold">
                    <SelectValue placeholder="Categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryNames.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs font-bold">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Formulario rápido para crear ingrediente */}
              <form onSubmit={handleCreateIngredient} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Agregar nuevo ingrediente o componente
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    placeholder="Ej: Arroz de fideo, Sopa de lentejas..."
                    className="h-10 rounded-xl bg-white border-gray-200 text-xs font-bold flex-1"
                  />
                  <Select value={newIngredientCategory} onValueChange={setNewIngredientCategory}>
                    <SelectTrigger className="h-10 sm:w-40 rounded-xl bg-white border-gray-200 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INGREDIENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs font-bold">
                          {c.emoji} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    disabled={savingIngredient}
                    className="h-10 px-4 rounded-xl bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814] font-black text-xs uppercase shrink-0"
                  >
                    {savingIngredient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '+ Agregar'}
                  </Button>
                </div>
              </form>

              {/* Lista agrupada por categoría con switch rápido */}
              <div className="space-y-4">
                {INGREDIENT_CATEGORIES.map((cat) => {
                  const catItems = ingredients.filter((i) => i.category === cat.id);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400">
                          {catItems.filter((i) => i.is_available).length}/{catItems.length} disp.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {catItems.map((ing) => {
                          const usedCount = products.filter((p) =>
                            (p.menu_item_ingredients || []).some(
                              (l) => String(l.ingredient_id) === String(ing.id)
                            )
                          ).length;

                          return (
                            <div
                              key={ing.id}
                              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-all ${
                                ing.is_available
                                  ? 'bg-white border-gray-100'
                                  : 'bg-red-50/60 border-red-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-black truncate ${ing.is_available ? 'text-gray-900' : 'text-red-700 line-through'}`}>
                                  {ing.name}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-400">
                                  {usedCount === 0
                                    ? 'Sin platos asociados'
                                    : usedCount === 1
                                      ? 'Asociado a 1 plato'
                                      : `Asociado a ${usedCount} platos`}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleBulkAssignIngredient(ing, 'add')}
                                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[9px] font-black text-amber-800 transition-colors"
                                  title={`Asociar a todos los platos de ${bulkAssignCategory}`}
                                >
                                  + {bulkAssignCategory}
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${ing.is_available ? 'text-[#15803D]' : 'text-red-600'}`}>
                                  {ing.is_available ? 'Disponible' : 'Agotado'}
                                </span>
                                <Switch
                                  checked={!!ing.is_available}
                                  onCheckedChange={() => handleToggleIngredientAvailability(ing)}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIngredient(ing)}
                                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Eliminar ingrediente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIngredientsModalOpen(false)}
                className="w-full h-11 rounded-xl border-gray-200 font-black text-xs uppercase tracking-wider"
              >
                Listo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
