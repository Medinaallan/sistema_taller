import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { ServiceModal } from '../../componentes/gestion/ServiceModal';
import { servicesService } from '../../servicios/apiService';
import { showAlert, showSuccess, showError } from '../../utilidades/sweetAlertHelpers';
import { mockServices, formatCurrency, formatDate } from '../../utilidades/globalMockDatabase';
import type { Service } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Service>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'description', header: 'Descripción' },
  { 
    accessorKey: 'basePrice', 
    header: 'Precio Base',
    cell: ({ getValue }) => formatCurrency(getValue() as number)
  },
  { accessorKey: 'estimatedTime', header: 'Tiempo Estimado' },
  { 
    accessorKey: 'createdAt', 
    header: 'Fecha Creación',
    cell: ({ getValue }) => formatDate(getValue() as string)
  },
];

const ServicesPage = () => {
  const [data, setData] = useState<Service[]>(mockServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar servicios desde el backend
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await servicesService.getAll();
      console.log('Respuesta de servicios:', response);
      
      // Verificar si response.data contiene los servicios o si están en response.recordset
      const servicesArray = response.data || response.recordset || [];
      
      if (Array.isArray(servicesArray) && servicesArray.length > 0) {
        // Mapear los datos del backend al formato esperado por la interfaz Service
        const mappedServices = servicesArray.map((service: any) => {
          console.log('Mapeando servicio:', service);
          return {
            id: service.tipo_servicio_id || service.id || Math.random().toString(),
            name: service.nombre || service.name || 'Sin nombre',
            description: service.descripcion || service.description || '',
            basePrice: parseFloat(service.precio_base || service.precio || service.basePrice || '0') || 0,
            estimatedTime: service.horas_estimadas || service.duracion || service.estimatedTime || 'N/A',
            createdAt: service.createdAt || new Date(),
            updatedAt: service.updatedAt || new Date(),
          };
        });
        console.log('Servicios mapeados:', mappedServices);
        setData(mappedServices);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      // Mantener los datos mock en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleEdit = (item: Service) => {
    // Abrir modal en modo edición con valores precargados
    setEditingService(item);
    setIsModalOpen(true);
  };
  
  const handleDelete = (item: Service) => {
    setData(data.filter(d => d.id !== item.id));
  };

  const handleNewService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitService = async (formData: {
    nombre: string;
    descripcion: string;
    precio: string;
    duracion: string;
    categoria: string;
  }) => {
    try {
      setLoading(true);
      // Obtener usuario_id del localStorage
      const usuarioId = localStorage.getItem('usuario_id') || '1';

      const serviceData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        duracion: formData.duracion,
        categoria: formData.categoria,
        registrado_por: parseInt(usuarioId),
      };

      let response;

      if (editingService) {
        // Llamar al endpoint de actualización
        response = await servicesService.update(String(editingService.id), serviceData);
      } else {
        response = await servicesService.create(serviceData);
      }

      // Respuesta del servidor
      const spSucceeded = response.data?.allow === 1 || response.allow === 1 || response.success === true;

      if (spSucceeded) {
        setIsModalOpen(false);
        setEditingService(null);
        showSuccess(editingService ? 'Servicio actualizado exitosamente' : 'Servicio creado exitosamente');
        await loadServices();
      } else {
        const errorMsg = response.data?.msg || response.message || 'Error desconocido';
        showError((editingService ? 'Error al actualizar el servicio: ' : 'Error al crear el servicio: ') + errorMsg);
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      if (error instanceof Error) {
        console.error('❌ Error mensaje:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      showError('Error al crear el servicio. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card 
        title="Servicios" 
        actions={
          <Button onClick={handleNewService} disabled={loading}>
            Nuevo Servicio
          </Button>
        }
      >
        <TanStackCrudTable 
          columns={columns} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </Card>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitService}
        loading={loading}
        initialValues={editingService ? {
          nombre: editingService.name,
          descripcion: editingService.description,
          precio: String(editingService.basePrice || 0),
          duracion: editingService.estimatedTime,
          categoria: ''
        } : undefined}
        title={editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
      />
    </>
  );
};

export default ServicesPage;
