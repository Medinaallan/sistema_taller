import { useState, useEffect } from 'react';
import {
  TruckIcon,
  PlusIcon,
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexto/useApp';
import { vehiclesService, servicesService } from '../../servicios/apiService';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  numeroMotor?: string;
  fotoUrl?: string;
  licensePlate: string;
  mileage: number;
  photo?: string;
  nextService?: string;
  lastServiceDate?: string;
}

interface VehicleForm {
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  licensePlate: string;
  mileage: number;
  numeroMotor: string;
  fotoUrl: string;
}

export function ClientVehiclesPage() {
  const { state, dispatch } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Estados para manejo de imagen
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    licensePlate: '',
    mileage: 0,
    numeroMotor: '',
    fotoUrl: ''
  });

  const [editForm, setEditForm] = useState<VehicleForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    licensePlate: '',
    mileage: 0,
    numeroMotor: '',
    fotoUrl: ''
  });

  // Datos de ejemplo con servicios - removidos para empezar en blanco
  // Los vehículos ahora se cargan desde la API

  const workOrders: any[] = [];

  // useEffect para cargar vehículos del cliente desde la API
  useEffect(() => {
    const loadClientVehicles = async () => {
      if (!state?.user?.id) return;
      
      setLoadingVehicles(true);
      try {
        // Llamar al endpoint específico para obtener vehículos de un cliente
        const response = await fetch(`http://localhost:8080/api/vehicles/client/${state.user.id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Mapear datos del stored procedure al formato del frontend
          const userVehicles = result.data.map((vehicle: any) => ({
            id: vehicle.vehiculo_id?.toString() || vehicle.id,
            brand: vehicle.marca,
            model: vehicle.modelo,
            year: parseInt(vehicle.anio),
            color: vehicle.color,
            vin: vehicle.vin || '',
            numeroMotor: vehicle.numero_motor || '',
            fotoUrl: vehicle.foto_url || '',
            licensePlate: vehicle.placa,
            mileage: parseInt(vehicle.kilometraje) || 0,
            photo: vehicle.foto_url,
            nextService: vehicle.nextService,
            lastServiceDate: vehicle.lastServiceDate,
            clientName: vehicle.nombre_cliente
          }));
          setClientVehicles(userVehicles);
        } else {
          console.error('Error cargando vehículos:', result.message);
          setClientVehicles([]);
        }
      } catch (error) {
        console.error('Error cargando vehículos:', error);
        setClientVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadClientVehicles();
  }, [state?.user?.id]);

  const filteredVehicles = clientVehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVehicleActiveOrders = (vehicleId: string) => {
    return workOrders.filter(order => 
      order.vehicleId === vehicleId && 
      !['completed', 'cancelled'].includes(order.status)
    );
  };

  const getServiceStatus = (vehicle: Vehicle) => {
    const activeOrders = getVehicleActiveOrders(vehicle.id);
    if (activeOrders.length > 0) {
      return { type: 'active', text: 'Servicio en proceso', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (vehicle.nextService) {
      const nextServiceDate = new Date(vehicle.nextService);
      const today = new Date();
      const daysUntil = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysUntil <= 7) {
        return { type: 'due-soon', text: 'Servicio próximo', color: 'bg-yellow-100 text-yellow-800' };
      } else if (daysUntil <= 30) {
        return { type: 'scheduled', text: 'Servicio programado', color: 'bg-green-100 text-green-800' };
      }
    }
    
    return { type: 'up-to-date', text: 'Al día', color: 'bg-gray-100 text-gray-800' };
  };

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir imagen a S3 y obtener URL
  const uploadImageToS3 = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('folder', 'vehicle-photos');
      
      const response = await fetch('http://localhost:8080/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!state?.user?.id) {
      alert('Error: Usuario no identificado');
      return;
    }

    // Validaciones básicas - Solo campos obligatorios según SP
    if (!vehicleForm.brand || !vehicleForm.model || !vehicleForm.licensePlate) {
      alert('Por favor, completa todos los campos obligatorios (marca, modelo y placa)');
      return;
    }

    setLoading(true);
    try {
      // Subir imagen a S3 si hay una seleccionada
      let fotoUrl = null;
      if (selectedImage) {
        console.log('📷 Subiendo imagen a S3...');
        fotoUrl = await uploadImageToS3();
        if (!fotoUrl) {
          alert('Error al subir la imagen. ¿Deseas continuar sin foto?');
          setLoading(false);
          return;
        }
        console.log('✅ Imagen subida exitosamente:', fotoUrl);
      }

      // Preparar datos para la API usando los nombres de campos del SP
      const vehicleData = {
        cliente_id: parseInt(state.user.id), // Usar cliente_id como espera el SP
        marca: vehicleForm.brand,
        modelo: vehicleForm.model,
        anio: vehicleForm.year,
        placa: vehicleForm.licensePlate,
        color: vehicleForm.color,
        vin: vehicleForm.vin || null,
        numero_motor: vehicleForm.numeroMotor || null,
        kilometraje: vehicleForm.mileage || null,
        foto_url: fotoUrl // URL generada por S3
      };

      const response = await vehiclesService.create(vehicleData);
      
      if (response.success) {
        // Mapear la respuesta del SP al formato del frontend
        const newVehicle: Vehicle = {
          id: response.data.vehiculo_id?.toString() || response.data.id,
          brand: response.data.marca,
          model: response.data.modelo,
          year: parseInt(response.data.anio),
          color: response.data.color,
          vin: response.data.vin || '',
          numeroMotor: response.data.numero_motor || '',
          fotoUrl: fotoUrl || '',
          licensePlate: response.data.placa,
          mileage: parseInt(response.data.kilometraje) || 0,
          photo: fotoUrl || undefined
        };
        
        setClientVehicles(prev => [...prev, newVehicle]);
        
        // También actualizar el estado global 
        dispatch({ type: 'ADD_VEHICLE', payload: {
          ...newVehicle,
          clientId: state.user.id,
          serviceType: {
            id: 'default',
            name: 'Servicio General',
            description: 'Servicio general',
            basePrice: 0,
            estimatedDuration: 1,
          },
          workOrders: [],
          reminders: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }});
        
        // Actualizar estadísticas del dashboard
        dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
        
        setShowAddModal(false);
        
        // Resetear formulario y estados de imagen
        setVehicleForm({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          vin: '',
          licensePlate: '',
          mileage: 0,
          numeroMotor: '',
          fotoUrl: ''
        });
        setSelectedImage(null);
        setImagePreview(null);

        alert('¡Vehículo registrado exitosamente!');
      } else {
        alert('Error al registrar el vehículo: ' + response.message);
      }
    } catch (error) {
      console.error('Error registrando vehículo:', error);
      alert('Error de conexión al registrar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;

    // Validaciones básicas
    if (!editForm.brand || !editForm.model || !editForm.licensePlate) {
      alert('Por favor, completa todos los campos obligatorios (marca, modelo y placa)');
      return;
    }

    setLoading(true);
    try {
      // Subir nueva imagen si hay una seleccionada
      let fotoUrl = selectedVehicle.fotoUrl || editForm.fotoUrl;
      if (selectedImage) {
        console.log('📷 Subiendo nueva imagen a S3...');
        const newImageUrl = await uploadImageToS3();
        if (newImageUrl) {
          fotoUrl = newImageUrl;
          console.log('✅ Nueva imagen subida:', fotoUrl);
        }
      }

      // Preparar datos para la API usando los nombres del SP_EDITAR_VEHICULO
      const vehicleData = {
        marca: editForm.brand,
        modelo: editForm.model,
        anio: editForm.year,
        placa: editForm.licensePlate,
        color: editForm.color || null,
        vin: editForm.vin || null,
        numero_motor: editForm.numeroMotor || null,
        kilometraje: editForm.mileage || null,
        foto_url: fotoUrl
      };

      const response = await vehiclesService.update(selectedVehicle.id, vehicleData);
      
      if (response.success) {
        // Actualizar vehículo en la lista local
        const updatedVehicle: Vehicle = {
          ...selectedVehicle,
          brand: editForm.brand,
          model: editForm.model,
          year: editForm.year,
          color: editForm.color,
          vin: editForm.vin,
          numeroMotor: editForm.numeroMotor,
          licensePlate: editForm.licensePlate,
          mileage: editForm.mileage,
          fotoUrl: fotoUrl,
          photo: fotoUrl
        };
        
        setClientVehicles(prev => 
          prev.map(v => v.id === selectedVehicle.id ? updatedVehicle : v)
        );
        
        setShowEditModal(false);
        setSelectedVehicle(null);
        setSelectedImage(null);
        setImagePreview(null);

        alert('¡Vehículo actualizado exitosamente!');
      } else {
        alert('Error al actualizar el vehículo: ' + response.message);
      }
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      alert('Error de conexión al actualizar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceHistory = async (vehicleId: string) => {
    if (!state?.user?.id) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`http://localhost:8080/api/service-history/client/${state.user.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Filtrar por vehículo específico
        const vehicleHistory = result.data.filter((item: any) => 
          item.vehiculo_id?.toString() === vehicleId
        );
        setServiceHistory(vehicleHistory);
      } else {
        setServiceHistory([]);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setServiceHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderVehicleCard = (vehicle: Vehicle) => {
    const serviceStatus = getServiceStatus(vehicle);
    const activeOrders = getVehicleActiveOrders(vehicle.id);

    return (
      <div key={vehicle.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Header con foto responsivo */}
        <div className="relative h-32 sm:h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
          {vehicle.photo ? (
            <img src={vehicle.photo} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TruckIcon className="h-8 w-8 sm:h-16 sm:w-16 text-blue-300 mx-auto mb-1 sm:mb-2" />
                <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-white rounded-md sm:rounded-lg shadow-sm hover:shadow-md transition-all">
                  <CameraIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Agregar</span> Foto
                </button>
              </div>
            </div>
          )}
          
          {/* Badge de estado responsivo */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${serviceStatus.color} backdrop-blur-sm`}>
              {serviceStatus.text}
            </span>
          </div>
        </div>

        {/* Contenido responsivo */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">Año {vehicle.year} • {vehicle.color}</p>
            </div>
            <div className="flex space-x-1 sm:space-x-2 ml-2">
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowDetailModal(true);
                }}
                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-md sm:rounded-lg transition-colors"
                title="Ver detalles"
              >
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setEditForm({
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year,
                    color: vehicle.color,
                    vin: vehicle.vin,
                    licensePlate: vehicle.licensePlate,
                    mileage: vehicle.mileage,
                    numeroMotor: vehicle.numeroMotor || '',
                    fotoUrl: vehicle.fotoUrl || ''
                  });
                  setImagePreview(vehicle.photo || vehicle.fotoUrl || null);
                  setShowEditModal(true);
                }}
                className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-50 rounded-md sm:rounded-lg transition-colors"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Información principal responsiva */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Placa</p>
              <p className="text-sm font-semibold text-gray-900">{vehicle.licensePlate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Kilometraje</p>
              <p className="text-sm font-semibold text-gray-900">{vehicle.mileage?.toLocaleString()} km</p>
            </div>
          </div>

          {/* Próximo servicio o servicios activos */}
          {activeOrders.length > 0 ? (
            <div className="bg-blue-50 rounded-lg p-3 mb-3 sm:mb-4">
              <div className="flex items-center mb-2">
                <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600 mr-2" />
                <p className="text-sm font-medium text-blue-900">Servicios Activos</p>
              </div>
              {activeOrders.slice(0, 2).map(order => (
                <div key={order.id} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-blue-800 truncate mr-2">{order.service}</span>
                  <span className="text-blue-600 font-medium whitespace-nowrap">{order.status === 'in-progress' ? 'En proceso' : 'Esperando'}</span>
                </div>
              ))}
            </div>
          ) : vehicle.nextService && (
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-900">Próximo servicio</span>
                </div>
                <span className="text-sm text-green-700">{vehicle.nextService}</span>
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setSelectedVehicle(vehicle);
                setShowAppointmentModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Agendar Cita
            </button>
            <button 
              onClick={() => {
                setSelectedVehicle(vehicle);
                loadServiceHistory(vehicle.id);
                setShowHistoryModal(true);
              }}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddVehicleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Agregar Nuevo Vehículo</h3>
                <p className="text-blue-100 text-sm">Registra tu vehículo en el sistema</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marca *
              </label>
              <input
                type="text"
                value={vehicleForm.brand}
                onChange={(e) => setVehicleForm({...vehicleForm, brand: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Toyota, Honda, Nissan..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Corolla, Civic, Sentra..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({...vehicleForm, year: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1980"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color (opcional)
              </label>
              <input
                type="text"
                value={vehicleForm.color}
                onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Blanco, Negro, Rojo..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Placa *
              </label>
              <input
                type="text"
                value={vehicleForm.licensePlate}
                onChange={(e) => setVehicleForm({...vehicleForm, licensePlate: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="HTN-1234"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kilometraje Actual
              </label>
              <input
                type="number"
                value={vehicleForm.mileage}
                onChange={(e) => setVehicleForm({...vehicleForm, mileage: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="45000"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              VIN (Número de Identificación) (opcional)
            </label>
            <input
              type="text"
              value={vehicleForm.vin}
              onChange={(e) => setVehicleForm({...vehicleForm, vin: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
            />
            <p className="text-xs text-gray-500 mt-1">
              El VIN es un código único de 17 caracteres que identifica tu vehículo
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Motor (opcional)
            </label>
            <input
              type="text"
              value={vehicleForm.numeroMotor}
              onChange={(e) => setVehicleForm({...vehicleForm, numeroMotor: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC123456789"
            />
            <p className="text-xs text-gray-500 mt-1">
              Número identificador del motor del vehículo
            </p>
          </div>

          {/* Foto del vehículo - Funcional con S3 */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Foto del Vehículo (Opcional)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => document.getElementById('vehicle-photo-input')?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
              >
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Arrastra una foto aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500 mb-3">JPG, PNG o WebP (máx. 5MB)</p>
                <button 
                  type="button"
                  className="text-blue-600 font-medium hover:text-blue-500 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Seleccionar archivo
                </button>
              </div>
            )}
            
            <input
              id="vehicle-photo-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {selectedImage && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Imagen seleccionada: {selectedImage.name}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowAddModal(false);
              setSelectedImage(null);
              setImagePreview(null);
            }}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            disabled={loading || uploadingImage}
          >
            Cancelar
          </button>
          <button
            onClick={handleAddVehicle}
            disabled={loading || uploadingImage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {uploadingImage ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Subiendo foto...
              </>
            ) : loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Registrando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Registrar Vehículo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header mejorado y responsivo */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                  <TruckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mis Vehículos</h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Gestiona tu flota personal</p>
                </div>
              </div>
              
              {/* Stats rápidas responsivas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">{clientVehicles.length}</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Vehículos Registrados</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">
                    {clientVehicles.filter(v => getVehicleActiveOrders(v.id).length > 0).length}
                  </div>
                  <div className="text-blue-100 text-xs sm:text-sm">En Servicio</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl font-bold">
                    {clientVehicles.filter(v => {
                      const status = getServiceStatus(v);
                      return status.type === 'due-soon';
                    }).length}
                  </div>
                  <div className="text-blue-100 text-xs sm:text-sm">Servicios Próximos</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center shadow-lg w-full lg:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar Vehículo
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros responsiva */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute left-3 top-3 sm:top-4" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
              <button
                onClick={() => setActiveView('grid')}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  activeView === 'grid' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="sm:hidden">Grid</span>
                <span className="hidden sm:inline">Vista Grid</span>
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  activeView === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="sm:hidden">Lista</span>
                <span className="hidden sm:inline">Vista Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid de vehículos responsivo */}
        {loadingVehicles ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gray-100 rounded-full p-4 sm:p-6 w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Cargando vehículos...
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 px-4">
              Por favor espera mientras cargamos tu información
            </p>
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className={`grid gap-4 sm:gap-6 ${
            activeView === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredVehicles.map(renderVehicleCard)}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-gray-100 rounded-full p-4 sm:p-6 w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <TruckIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron vehículos' : 'No tienes vehículos registrados'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 px-4">
              {searchTerm 
                ? `No hay vehículos que coincidan con "${searchTerm}"`
                : 'Comienza agregando tu primer vehículo al sistema'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Agregar Mi Primer Vehículo
              </button>
            )}
          </div>
        )}

        {/* Modales */}
        {showAddModal && renderAddVehicleModal()}
        {showDetailModal && renderDetailModal()}
        {showEditModal && renderEditModal()}
        {showHistoryModal && renderHistoryModal()}
        {showAppointmentModal && renderAppointmentModal()}
      </div>
    </div>
  );

  // Modal de detalles del vehículo
  function renderDetailModal() {
    if (!selectedVehicle) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Detalles del Vehículo</h3>
                  <p className="text-blue-100 text-sm">{selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedVehicle(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Foto */}
            {selectedVehicle.photo && (
              <div className="mb-6">
                <img 
                  src={selectedVehicle.photo} 
                  alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Marca</label>
                <p className="text-gray-900">{selectedVehicle.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo</label>
                <p className="text-gray-900">{selectedVehicle.model}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Año</label>
                <p className="text-gray-900">{selectedVehicle.year}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                <p className="text-gray-900">{selectedVehicle.color || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Placa</label>
                <p className="text-gray-900 font-semibold">{selectedVehicle.licensePlate}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kilometraje</label>
                <p className="text-gray-900">{selectedVehicle.mileage?.toLocaleString()} km</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">VIN</label>
                <p className="text-gray-900 text-sm">{selectedVehicle.vin || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Motor</label>
                <p className="text-gray-900 text-sm">{selectedVehicle.numeroMotor || 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedVehicle(null);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal de edición del vehículo
  function renderEditModal() {
    if (!selectedVehicle) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <PencilIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Editar Vehículo</h3>
                  <p className="text-blue-100 text-sm">Actualiza la información de tu vehículo</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marca *</label>
                <input
                  type="text"
                  value={editForm.brand}
                  onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo *</label>
                <input
                  type="text"
                  value={editForm.model}
                  onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Año *</label>
                <input
                  type="number"
                  value={editForm.year}
                  onChange={(e) => setEditForm({...editForm, year: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1980"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                <input
                  type="text"
                  value={editForm.color}
                  onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Placa *</label>
                <input
                  type="text"
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm({...editForm, licensePlate: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kilometraje</label>
                <input
                  type="number"
                  value={editForm.mileage}
                  onChange={(e) => setEditForm({...editForm, mileage: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">VIN (opcional)</label>
              <input
                type="text"
                value={editForm.vin}
                onChange={(e) => setEditForm({...editForm, vin: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={17}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Motor (opcional)</label>
              <input
                type="text"
                value={editForm.numeroMotor}
                onChange={(e) => setEditForm({...editForm, numeroMotor: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Foto del vehículo */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foto del Vehículo</label>
              
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Vista previa" 
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('edit-vehicle-photo-input')?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
                >
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Arrastra una foto aquí o haz clic para seleccionar</p>
                  <button 
                    type="button"
                    className="text-blue-600 font-medium hover:text-blue-500 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Seleccionar archivo
                  </button>
                </div>
              )}
              
              <input
                id="edit-vehicle-photo-input"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedVehicle(null);
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading || uploadingImage}
            >
              Cancelar
            </button>
            <button
              onClick={handleEditVehicle}
              disabled={loading || uploadingImage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Subiendo foto...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal de historial de servicios
  function renderHistoryModal() {
    if (!selectedVehicle) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Historial de Servicios</h3>
                  <p className="text-blue-100 text-sm">{selectedVehicle.brand} {selectedVehicle.model} - {selectedVehicle.licensePlate}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedVehicle(null);
                  setServiceHistory([]);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando historial...</p>
              </div>
            ) : serviceHistory.length > 0 ? (
              <div className="space-y-4">
                {serviceHistory.map((service, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.tipo_servicio || 'Servicio'}</h4>
                        <p className="text-sm text-gray-600">{service.descripcion || 'Sin descripción'}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {service.fecha_servicio ? new Date(service.fecha_servicio).toLocaleDateString() : 'Sin fecha'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Kilometraje</p>
                        <p className="text-sm font-medium">{service.kilometraje ? service.kilometraje.toLocaleString() : 'N/A'} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Costo</p>
                        <p className="text-sm font-medium">${service.costo ? service.costo.toLocaleString() : '0'}</p>
                      </div>
                    </div>
                    {service.notas && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Notas</p>
                        <p className="text-sm text-gray-700">{service.notas}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin historial de servicios</h3>
                <p className="text-gray-500">Este vehículo aún no tiene servicios registrados</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedVehicle(null);
                setServiceHistory([]);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal de agendar cita
  function renderAppointmentModal() {
    if (!selectedVehicle || !state?.user?.id) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Agendar Cita</h3>
                  <p className="text-blue-100 text-sm">{selectedVehicle.brand} {selectedVehicle.model} - {selectedVehicle.licensePlate}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedVehicle(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Usar el mismo componente NewAppointmentModal pero adaptado para cliente */}
          <ClientAppointmentForm 
            vehicleId={selectedVehicle.id}
            clientId={state.user.id}
            onClose={() => {
              setShowAppointmentModal(false);
              setSelectedVehicle(null);
            }}
            onSuccess={() => {
              setShowAppointmentModal(false);
              setSelectedVehicle(null);
              alert('¡Cita agendada exitosamente!');
            }}
          />
        </div>
      </div>
    );
  }
}

// Componente para el formulario de cita del cliente
function ClientAppointmentForm({ vehicleId, clientId, onClose, onSuccess }: { 
  vehicleId: string; 
  clientId: string; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    serviceTypeId: '',
    notes: ''
  });
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await servicesService.getAll();
        if (response.success) {
          console.log('Servicios cargados:', response.data);
          // Mapear servicios al formato correcto
          const mappedServices = response.data.map((servicio: any) => ({
            tipo_servicio_id: servicio.tipo_servicio_id,
            nombre: servicio.nombre,
            descripcion: servicio.descripcion || '',
            precio_base: servicio.precio_base !== null && servicio.precio_base !== undefined ? Number(servicio.precio_base) : 0,
            horas_estimadas: servicio.horas_estimadas || '',
          }));
          console.log('Servicios mapeados:', mappedServices);
          setServicios(mappedServices);
        }
      } catch (error) {
        console.error('Error cargando servicios:', error);
        setServicios([]);
      }
    };
    loadServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'La fecha es requerida';
    if (!formData.time) newErrors.time = 'La hora es requerida';
    if (!formData.serviceTypeId) newErrors.serviceTypeId = 'El servicio es requerido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const usuarioId = localStorage.getItem('usuario_id');
      const registradoPor = usuarioId ? Number(usuarioId) : Number(clientId);
      
      const appointmentData = {
        cliente_id: Number(clientId),
        vehiculo_id: Number(vehicleId),
        tipo_servicio_id: Number(formData.serviceTypeId),
        fecha_inicio: formData.date,
        asesor_id: registradoPor,
        notas_cliente: formData.notes || '',
        canal_origen: 'WEB',
        registrado_por: registradoPor
      };

      const response = await fetch('http://localhost:8080/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();
      
      if (result.success) {
        onSuccess();
      } else {
        alert('Error al agendar la cita: ' + result.message);
      }
    } catch (error) {
      console.error('Error agendando cita:', error);
      alert('Error de conexión al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hora *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Servicio *</label>
          <select
            value={formData.serviceTypeId}
            onChange={(e) => setFormData({...formData, serviceTypeId: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar servicio...</option>
            {servicios.map((servicio) => (
              <option key={servicio.tipo_servicio_id} value={servicio.tipo_servicio_id}>
                {servicio.nombre} - L{servicio.precio_base?.toLocaleString()}
              </option>
            ))}
          </select>
          {errors.serviceTypeId && <p className="text-red-500 text-sm mt-1">{errors.serviceTypeId}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notas adicionales (opcional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe cualquier detalle importante sobre el servicio que necesitas..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Agendando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Agendar Cita
            </>
          )}
        </button>
      </div>
    </form>
  );
}
