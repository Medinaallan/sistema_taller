import { useState, useEffect } from 'react';
import { Card, Button } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { ServiceModal } from '../../componentes/gestion/ServiceModal';
import { servicesService } from '../../servicios/apiService';
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
  const [loading, setLoading] = useState(false);

  // Cargar servicios desde el backend
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await servicesService.getAll();
      if (response.success) {
        // Mapear los datos del CSV al formato esperado por la interfaz Service
        const mappedServices = response.data.map((csvService: any) => ({
          id: csvService.id,
          name: csvService.nombre,
          description: csvService.descripcion,
          basePrice: parseFloat(csvService.precio) || 0,
          estimatedTime: csvService.duracion,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
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
    alert('Editar servicio: ' + item.id);
  };
  
  const handleDelete = (item: Service) => {
    setData(data.filter(d => d.id !== item.id));
  };

  const handleNewService = () => {
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
      
      console.log('🚀 Enviando datos del servicio:', formData);
      
      const serviceData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        duracion: formData.duracion,
        categoria: formData.categoria,
      };

      console.log('📤 Datos procesados para enviar:', serviceData);

      const response = await servicesService.create(serviceData);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        // Mapear el nuevo servicio al formato esperado
        const newService: Service = {
          id: response.data.id,
          name: response.data.nombre,
          description: response.data.descripcion,
          basePrice: response.data.precio,
          estimatedTime: response.data.duracion,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setData(prev => [...prev, newService]);
        setIsModalOpen(false);
        
        // Mostrar mensaje de éxito
        alert('Servicio creado exitosamente');
      } else {
        console.error('❌ Error del servidor:', response);
        alert('Error al crear el servicio: ' + (response.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      if (error instanceof Error) {
        console.error('❌ Error mensaje:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      alert('Error al crear el servicio. Por favor, intente nuevamente.');
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
      />
    </>
  );
};

export default ServicesPage;
