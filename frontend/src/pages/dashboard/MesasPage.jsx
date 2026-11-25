import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  QrCode,
  Download,
  Trash2,
  Users,
  Loader2,
  Check,
  Edit2, // Added Edit icon
  User // Added User icon for employee display
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function MesasPage() {
  const { slug } = useParams();
  const { api } = useAuth();
  const [tables, setTables] = useState([]);
  const [employees, setEmployees] = useState([]); // Added employees state
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: '4',
    ubicacion: '',
    empleado_id: 'none'
  });

  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tablesRes, employeesRes] = await Promise.all([
        api().get(`/tables/${slug}`),
        api().get(`/employees/${slug}`)
      ]);
      setTables(tablesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => { // Kept for individual refetch if needed, though fetchData covers it
    try {
      const response = await api().get(`/tables/${slug}`);
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const openCreateModal = () => {
    const nextNumber = tables.length > 0
      ? Math.max(...tables.map(t => t.numero)) + 1
      : 1;
    setFormData({
      numero: nextNumber.toString(),
      capacidad: '4',
      ubicacion: '',
      empleado_id: 'none'
    });
    setSelectedTable(null); // Ensure no table is selected
    setIsModalOpen(true);
  };

  const openEditModal = (table) => {
    setFormData({
      numero: table.numero.toString(),
      capacidad: table.capacidad.toString(),
      ubicacion: table.ubicacion || '',
      empleado_id: table.empleado_id || 'none'
    });
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        numero: parseInt(formData.numero),
        capacidad: parseInt(formData.capacidad),
        ubicacion: formData.ubicacion || null,
        empleado_id: formData.empleado_id === 'none' ? null : formData.empleado_id
      };

      if (selectedTable) {
        await api().put(`/tables/${slug}/${selectedTable.id}`, payload);
        toast.success('Mesa actualizada');
      } else {
        await api().post(`/tables/${slug}`, payload);
        toast.success('Mesa creada');
      }

      setIsModalOpen(false);
      fetchTables();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al guardar mesa';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta mesa?')) return;

    try {
      await api().delete(`/tables/${slug}/${tableId}`);
      toast.success('Mesa eliminada');
      fetchTables();
    } catch (error) {
      toast.error('Error al eliminar mesa');
    }
  };

  const openQrModal = (table) => {
    setSelectedTable(table);
    setQrModalOpen(true);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR
      ctx.drawImage(img, 50, 50, 300, 300);

      // Add text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Mesa ${selectedTable?.numero}`, canvas.width / 2, 400);

      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Escanea para ver el menú', canvas.width / 2, 430);

      // Download
      const link = document.createElement('a');
      link.download = `mesa-${selectedTable?.numero}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getTableStatusColor = (estado) => {
    switch (estado) {
      case 'libre': return 'mesa-libre';
      case 'ocupada': return 'mesa-ocupada';
      case 'pendiente': return 'mesa-pendiente';
      default: return 'mesa-libre';
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'libre': return 'Libre';
      case 'ocupada': return 'Ocupada';
      case 'pendiente': return 'Pendiente';
      default: return 'Libre';
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
      <div className="space-y-6" data-testid="mesas-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">Mesas</h1>
            <p className="text-gray-500">{tables.length} mesas configuradas</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]"
            data-testid="add-table-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar mesa
          </Button>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading font-bold text-lg mb-2">No hay mesas</h3>
            <p className="text-gray-500 mb-4">Crea mesas y genera códigos QR para tus clientes</p>
            <Button onClick={openCreateModal} className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]">
              <Plus className="w-4 h-4 mr-2" />
              Crear primera mesa
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence>
              {tables.map((table) => (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white rounded-xl border-2 p-4 text-center ${getTableStatusColor(table.estado)} cursor-pointer transition-all`}
                  onClick={() => openQrModal(table)}
                  data-testid={`table-card-${table.numero}`}
                >
                  <div className="text-3xl font-bold font-heading mb-1">{table.numero}</div>
                  <div className="flex items-center justify-center gap-1 text-sm mb-2">
                    <Users className="w-4 h-4" />
                    <span>{table.capacidad}</span>
                  </div>
                  <div className="text-xs font-medium mb-3">{getStatusLabel(table.estado)}</div>
                  {table.ubicacion && (
                    <div className="text-xs text-gray-500 truncate mb-1">{table.ubicacion}</div>
                  )}
                  {table.empleado_id && (
                    <div className="flex items-center justify-center gap-1 text-xs text-blue-600 bg-blue-50 py-1 px-2 rounded-full mx-auto w-fit">
                      <User className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">
                        {employees.find(e => e.id === table.empleado_id)?.nombre || 'Empleado'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-center gap-1 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQrModal(table);
                      }}
                      className="h-8 w-8"
                      data-testid={`qr-table-${table.numero}`}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(table);
                      }}
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      data-testid={`edit-table-${table.numero}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(table.id);
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`delete-table-${table.numero}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Table Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md" aria-describedby="mesa-modal-description">
            <DialogHeader>
              <DialogTitle>{selectedTable ? 'Editar mesa' : 'Nueva mesa'}</DialogTitle>
              <DialogDescription id="mesa-modal-description">
                {selectedTable
                  ? 'Modifica los detalles de la mesa o cambia su asignación.'
                  : 'Ingresa los detalles para registrar una nueva mesa en el sistema.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número de mesa</Label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="1"
                  required
                  data-testid="table-number-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad (personas)</Label>
                <Input
                  id="capacidad"
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  placeholder="4"
                  required
                  data-testid="table-capacity-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación (opcional)</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Ej: Terraza, Interior, Ventana"
                  data-testid="table-location-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado">Mesero Asignado</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {employees
                      .filter(e => e.rol === 'mesero' || e.rol === 'dueno') // Filter suitable roles if needed
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                  data-testid="save-table-btn"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {selectedTable ? 'Actualizar' : 'Crear mesa'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* QR Code Modal */}
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="sm:max-w-md" aria-describedby="qr-modal-description">
            <DialogHeader>
              <DialogTitle className="text-center">Mesa {selectedTable?.numero}</DialogTitle>
              <DialogDescription id="qr-modal-description" className="text-center">
                Escanea este código QR para acceder al menú digital.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={`${baseUrl}/${slug}/mesa/${selectedTable?.numero}`}
                  size={200}
                  level="H"
                  includeMargin
                  fgColor="#0f172a"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Escanea para acceder al menú
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {baseUrl}/{slug}/mesa/{selectedTable?.numero}
              </p>
              <Button
                onClick={downloadQR}
                className="mt-6 bg-[#4ADE80] hover:bg-[#22C55E] text-[#111814]"
                data-testid="download-qr-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar QR
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
