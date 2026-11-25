import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'menuia_cart';

// Helper to read from localStorage safely
function readCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { sedeSlug: null, items: [], customerInfo: { nombre: '', telefono: '' } };
    return JSON.parse(raw);
  } catch {
    return { sedeSlug: null, items: [], customerInfo: { nombre: '', telefono: '' } };
  }
}

// Helper to write to localStorage safely
function writeCartToStorage(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage on first render
  const stored = readCartFromStorage();
  const [sedeSlug, setSedeSlug] = useState(stored.sedeSlug || null);
  const [items, setItems] = useState(stored.items || []);
  const [customerInfo, setCustomerInfo] = useState(
    stored.customerInfo || { nombre: '', telefono: '' }
  );

  // Sync every state change to localStorage
  useEffect(() => {
    writeCartToStorage({ sedeSlug, items, customerInfo });
  }, [sedeSlug, items, customerInfo]);

  /**
   * Called whenever the user visits a menu page for a specific sede.
   * If the slug changes, the cart is cleared to prevent cross-branch orders.
   */
  const checkAndSetSede = useCallback((newSlug) => {
    setSedeSlug((prev) => {
      if (prev && prev !== newSlug) {
        // User switched to a different branch — clear the cart
        setItems([]);
        setCustomerInfo({ nombre: '', telefono: '' });
        toast.info('Tu carrito fue vaciado al cambiar de sede.', { duration: 3000 });
      }
      return newSlug;
    });
  }, []);

  const addItem = useCallback((product, quantity = 1, notas = '', selectedModifiers = []) => {
    // Helper to compare arrays ignoring order
    const areModifiersEqual = (arr1, arr2) => {
      if (!arr1 && !arr2) return true;
      if (!arr1 || !arr2) return false;
      if (arr1.length !== arr2.length) return false;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return sorted1.every((val, index) => val === sorted2[index]);
    };

    setItems(prev => {
      const existingIndex = prev.findIndex(item =>
        item.producto_id === product.id &&
        item.notas === notas &&
        areModifiersEqual(item.modificadores, selectedModifiers?.map(m => typeof m === 'string' ? m : m.nombre))
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].cantidad += quantity;
        return updated;
      }

      const modifiersPrice = selectedModifiers
        ? selectedModifiers.reduce((acc, m) => acc + ((m.precio || 0) * (m.cantidad || 1)), 0)
        : 0;
      const finalUnitPrice = product.precio + modifiersPrice;

      return [...prev, {
        producto_id: product.id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        cantidad: quantity,
        precio_unitario: finalUnitPrice,
        notas: notas || null,
        imagen: product.imagen,
        modificadores: selectedModifiers?.map(m => {
          if (typeof m === 'string') return m;
          let cat = 'Adicionales';
          if (product.tamanos?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) cat = 'Tamaños';
          else if (product.opciones?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) cat = 'Opciones';
          else if (product.modificadores?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) {
            const group = product.modificadores.find(g => g.opciones?.some(o => o.nombre === m.nombre));
            cat = group ? group.nombre : 'Adicionales';
          }
          return { categoria: cat, nombre: m.nombre, cantidad: m.cantidad || 1, precio: m.precio || 0 };
        }) || []
      }];
    });
  }, []);

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index, product, quantity = 1, notas = '', selectedModifiers = []) => {
    setItems(prev => {
      const updated = [...prev];
      const modifiersPrice = selectedModifiers
        ? selectedModifiers.reduce((acc, m) => acc + ((m.precio || 0) * (m.cantidad || 1)), 0)
        : 0;
      const finalUnitPrice = product.precio + modifiersPrice;

      updated[index] = {
        ...updated[index],
        producto_id: product.id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        cantidad: quantity,
        precio_unitario: finalUnitPrice,
        notas: notas || null,
        imagen: product.imagen,
        modificadores: selectedModifiers?.map(m => {
          if (typeof m === 'string') return m;
          let cat = 'Adicionales';
          if (product.tamanos?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) cat = 'Tamaños';
          else if (product.opciones?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) cat = 'Opciones';
          else if (product.modificadores?.some(g => g.opciones?.some(o => o.nombre === m.nombre))) {
            const group = product.modificadores.find(g => g.opciones?.some(o => o.nombre === m.nombre));
            cat = group ? group.nombre : 'Adicionales';
          }
          return { categoria: cat, nombre: m.nombre, cantidad: m.cantidad || 1, precio: m.precio || 0 };
        }) || []
      };
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems(prev => {
      const updated = [...prev];
      updated[index].cantidad = quantity;
      return updated;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomerInfo({ nombre: '', telefono: '' });
    // Keep sedeSlug so UX is smooth (no sede switch notification on manual clear)
  }, []);

  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider value={{
      // Sede context
      sedeSlug,
      checkAndSetSede,
      // Cart state
      items,
      customerInfo,
      setCustomerInfo,
      addItem,
      removeItem,
      updateQuantity,
      updateItem,
      clearCart,
      total,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};
