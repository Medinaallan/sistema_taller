const XLSX = require('xlsx');
const path = require('path');

// Crear nueva plantilla Excel para importación de clientes y vehículos
function createExcelTemplate() {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Datos de ejemplo y headers para clientes
    const clientsHeaders = [
        'name',
        'email', 
        'phone',
        'address',
        'notes'
    ];

    const clientsExample = [
        ['Juan Pérez', 'juan.perez@email.com', '9999-1234', 'Col. Centro, Calle 5 #123', 'Cliente frecuente'],
        ['María González', 'maria.gonzalez@email.com', '9999-5678', 'Barrio Norte, Av. Principal #456', 'Requiere servicios especializados']
    ];

    // Datos de ejemplo y headers para vehículos
    const vehiclesHeaders = [
        'clienteEmail',  // Usar email del cliente para hacer match
        'marca',
        'modelo',
        'año',
        'placa',
        'color'
    ];

    const vehiclesExample = [
        ['juan.perez@email.com', 'Toyota', 'Corolla', '2020', 'ABC-123', 'Blanco'],
        ['maria.gonzalez@email.com', 'Honda', 'Civic', '2019', 'XYZ-789', 'Azul']
    ];

    // Crear hoja de clientes
    const clientsData = [clientsHeaders, ...clientsExample];
    const clientsWorksheet = XLSX.utils.aoa_to_sheet(clientsData);
    
    // Agregar validaciones y formateo para clientes
    const clientsRange = XLSX.utils.decode_range(clientsWorksheet['!ref']);
    clientsWorksheet['!cols'] = [
        { width: 20 },  // name
        { width: 30 },  // email
        { width: 15 },  // phone
        { width: 40 },  // address
        { width: 30 }   // notes
    ];

    // Crear hoja de vehículos
    const vehiclesData = [vehiclesHeaders, ...vehiclesExample];
    const vehiclesWorksheet = XLSX.utils.aoa_to_sheet(vehiclesData);
    
    // Agregar validaciones y formateo para vehículos
    const vehiclesRange = XLSX.utils.decode_range(vehiclesWorksheet['!ref']);
    vehiclesWorksheet['!cols'] = [
        { width: 30 },  // clienteEmail
        { width: 15 },  // marca
        { width: 15 },  // modelo
        { width: 10 },  // año
        { width: 15 },  // placa
        { width: 15 }   // color
    ];

    // Crear hoja de instrucciones
    const instructionsData = [
        ['INSTRUCCIONES PARA USO DE PLANTILLA DE IMPORTACIÓN'],
        [''],
        ['HOJA CLIENTES:'],
        ['- name: Nombre completo del cliente (obligatorio)'],
        ['- email: Correo electrónico único (obligatorio)'],
        ['- phone: Número de teléfono (obligatorio)'],
        ['- address: Dirección completa (obligatorio)'],
        ['- notes: Notas adicionales (opcional)'],
        [''],
        ['HOJA VEHICULOS:'],
        ['- clienteEmail: Email del cliente propietario (debe existir en hoja Clientes)'],
        ['- marca: Marca del vehículo (obligatorio)'],
        ['- modelo: Modelo del vehículo (obligatorio)'],
        ['- año: Año del vehículo (obligatorio, formato YYYY)'],
        ['- placa: Placa del vehículo (obligatorio, único)'],
        ['- color: Color del vehículo (obligatorio)'],
        [''],
        ['NOTAS IMPORTANTES:'],
        ['- No elimine las filas de encabezados'],
        ['- No cambie los nombres de las columnas'],
        ['- Los emails deben ser únicos y válidos'],
        ['- Las placas deben ser únicas'],
        ['- El año debe ser un número válido'],
        ['- Asegúrese de que el email del cliente existe antes de asignar vehículos'],
        [''],
        ['EJEMPLO:'],
        ['Ver las filas de ejemplo en cada hoja para el formato correcto']
    ];

    const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsWorksheet['!cols'] = [{ width: 80 }];

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instrucciones');
    XLSX.utils.book_append_sheet(workbook, clientsWorksheet, 'Clientes');
    XLSX.utils.book_append_sheet(workbook, vehiclesWorksheet, 'Vehiculos');

    // Guardar el archivo
    const templatePath = path.join(__dirname, '..', 'templates', 'plantilla-importacion-clientes-vehiculos.xlsx');
    
    // Crear directorio si no existe
    const fs = require('fs');
    const templatesDir = path.dirname(templatePath);
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Escribir el archivo con opciones específicas para mejor compatibilidad
    const workbookOptions = {
        bookType: 'xlsx',
        type: 'binary'
    };

    XLSX.writeFile(workbook, templatePath, workbookOptions);
    
    // Verificar que el archivo se escribió correctamente
    if (fs.existsSync(templatePath)) {
        const stats = fs.statSync(templatePath);
        console.log(`Plantilla Excel creada en: ${templatePath}`);
        console.log(`Tamaño del archivo: ${stats.size} bytes`);
    } else {
        throw new Error('No se pudo crear el archivo de plantilla');
    }
    
    return templatePath;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createExcelTemplate();
}

module.exports = { createExcelTemplate };