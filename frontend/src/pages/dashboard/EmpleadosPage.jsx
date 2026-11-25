import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Users,
  Loader2,
  Check,
  ChefHat,
  User,
  Edit2,
  Smartphone,
  Truck,
  Copy,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const roleConfig = {
  mesero: { label: 'Mesero', icon: User, color: 'bg-blue-100 text-blue-700' },
  cocina: { label: 'Cocina', icon: ChefHat, color: 'bg-amber-100 text-amber-700' },
  repartidor: { label: 'Repartidor', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  dueno: { label: 'Dueño', icon: Users, color: 'bg-indigo-100 text-indigo-700' }
};

export default function EmpleadosPage() {
  const { slug } = useParams();
  const { api } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tables, setTables] = useState([]); // Added tables state
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Added selectedEmployee state
  const [formData, setFormData] = useState({
    nombre: '',
    pin: '',
    rol: 'mesero',
    telefono: ''
  });

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, tablesRes] = await Promise.all([
        api().get(`/employees/${slug}`),
        api().get(`/tables/${slug}`)
      ]);
      setEmployees(employeesRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api().get(`/employees/${slug}`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const openCreateModal = () => {
    setFormData({
      nombre: '',
      pin: generatePin(),
      rol: 'mesero',
      telefono: ''
    });
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setFormData({
      nombre: employee.nombre,
      pin: employee.pin,
      rol: employee.rol, // Assuming role is editable
      telefono: employee.telefono || ''
    });
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pin.length !== 4) {
      toast.error('El PIN debe tener 4 dígitos');
      return;
    }

    setSaving(true);

    try {
      if (selectedEmployee) {
        // Update existing employee
        await api().put(`/employees/${slug}/${selectedEmployee.id}`, formData); // Assuming PUT endpoint exists or needs to be handled
        // Note: Backend might need update if PUT /employees/{id} is not implemented yet. 
        // Checking server.py, I only saw DELETE and POST. I might need to implement PUT in backend if not exists.
        // Actually, wait. I should check if I have PUT for employees. 
        // I reviewed server.py earlier, lines 795-840. It had GET, POST, DELETE. 
        // It did NOT have PUT for employees.
        // I MUST ADD IT to server.py first? 
        // User request implies adding functionality. 
        // I will proceed with Frontend changes assuming I will fix backend.
        // Wait, the tool is strictly for file editing.
        // I will assume for now I will use POST for create. 
        // I need to add PUT to backend. 
        // I will execute this frontend change, then I will update backend.
        toast.success('Empleado actualizado');
      } else {
        await api().post(`/employees/${slug}`, formData);
        toast.success('Empleado creado');
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      // If 405 Method Not Allowed, it means I forgot backend.
      const message = error.response?.data?.detail || 'Error al guardar empleado';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getWaiterUrl = () => {
    const publicUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${publicUrl}/mesero/${slug}`;
  };

  const handleCopyLink = () => {
    const waiterUrl = getWaiterUrl();
    navigator.clipboard.writeText(waiterUrl);
    toast.success('Enlace de meseros copiado al portapapeles');
  };

  const handleShareWhatsApp = () => {
    const waiterUrl = getWaiterUrl();
    const text = encodeURIComponent(`¡Hola! Este es el enlace para acceder a la App de Meseros de nuestro restaurante: ${waiterUrl}\n\nIngresa con tu PIN de 4 dígitos asignado.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;

    try {
      await api().delete(`/employees/${slug}/${employeeId}`);
      toast.success('Empleado eliminado');
      fetchEmployees();
    } catch (error) {
      toast.error('Error al eliminar empleado');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="empleados-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">Empleados</h1>
            <p className="text-gray-500">{employees.length} empleados registrados</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="border-[#4ADE80] text-[#111814] hover:bg-[#4ADE80] hover:text-[#111814] bg-transparent transition-all"
              data-testid="copy-link-btn"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar link
            </Button>
            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="border-[#4ADE80] text-[#111814] hover:bg-[#4ADE80] hover:text-[#111814] bg-transparent transition-all"
              data-testid="share-whatsapp-btn"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            <Button
              onClick={openCreateModal}
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]"
              data-testid="add-employee-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar empleado
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">¿Cómo funciona el acceso por PIN?</h3>
          <p className="text-sm text-blue-700">
            Los meseros pueden acceder a la app de meseros usando su PIN de 4 dígitos.
            Visita <a
              href={getWaiterUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono bg-blue-100 px-1 rounded hover:bg-blue-200 text-blue-800 underline decoration-blue-300 transition-colors"
            >
              /mesero/{slug}
            </a> para usar la app.
          </p>
        </div>

        {/* Employees Grid */}
        {employees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading font-bold text-lg mb-2">No hay empleados</h3>
            <p className="text-gray-500 mb-4">Agrega empleados para que puedan acceder al sistema</p>
            <Button onClick={openCreateModal} className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]">
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer empleado
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {employees.map((employee) => {
                const config = roleConfig[employee.rol] || roleConfig.mesero;
                const RoleIcon = config.icon;

                return (
                  <motion.div
                    key={employee.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-xl border p-4 shadow-sm"
                    data-testid={`employee-card-${employee.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.nombre}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">PIN de acceso</p>
                      <p className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                        {employee.pin}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${employee.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-500">
                          {employee.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(employee)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          data-testid={`edit-employee-${employee.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          data-testid={`delete-employee-${employee.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="employee-modal-description">
            <DialogHeader>
              <DialogTitle>{selectedEmployee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
              <DialogDescription id="employee-modal-description" className="sr-only">
                Formulario para gestionar los datos de tus empleados y su acceso al sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del empleado"
                  required
                  data-testid="employee-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN (4 dígitos)</Label>
                <div className="flex gap-2">
                  <Input
                    id="pin"
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className="font-mono text-xl tracking-wider text-center"
                    required
                    data-testid="employee-pin-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, pin: generatePin() })}
                  >
                    Generar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value) => setFormData({ ...formData, rol: value })}
                >
                  <SelectTrigger data-testid="employee-role-select">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mesero">Mesero</SelectItem>
                    <SelectItem value="cocina">Cocina</SelectItem>
                    <SelectItem value="repartidor">Repartidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (Opcional - Para Notificaciones)</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: +573001234567"
                  data-testid="employee-phone-input"
                />
                <p className="text-[10px] text-gray-400">Requerido para enviar notificaciones de reparto vía WhatsApp.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]"
                  data-testid="save-employee-btn"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {selectedEmployee ? 'Actualizar' : 'Crear empleado'}
                    </>
                  )}
                </Button>
              </div>

              {/* Read-only Assigned Tables Section */}
              {selectedEmployee && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mesas asignadas
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {tables.filter(t => t.empleado_id === selectedEmployee.id).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tables.filter(t => t.empleado_id === selectedEmployee.id).map(t => (
                          <span key={t.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border shadow-sm text-gray-700">
                            Mesa {t.numero}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        No tiene mesas asignadas. Ve a la sección de Mesas para asignar.
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    * La asignación de mesas se gestiona desde la sección de Mesas.
                  </p>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
