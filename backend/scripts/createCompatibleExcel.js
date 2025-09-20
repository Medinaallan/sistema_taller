const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Crear nueva plantilla Excel con configuración específica para máxima compatibilidad
function createCompatibleExcelTemplate() {
    console.log('Creando plantilla Excel compatible...\n');

    // Crear un nuevo libro de trabajo con configuración específica
    const workbook = XLSX.utils.book_new();
    
    // Establecer propiedades del workbook para compatibilidad
    workbook.Props = {
        Title: "Plantilla Importación Clientes y Vehículos",
        Subject: "Sistema Taller",
        Author: "Sistema Taller",
        CreatedDate: new Date()
    };

    // Datos de ejemplo y headers para clientes
    const clientsData = [
        // Headers
        ['name', 'email', 'phone', 'address', 'password'],
        // Ejemplos
        ['Juan Pérez', 'juan.perez@email.com', '9999-1234', 'Col. Centro, Calle 5 #123', 'mipassword123'],
        ['María González', 'maria.gonzalez@email.com', '9999-5678', 'Barrio Norte, Av. Principal #456', 'password456']
    ];

    // Datos de ejemplo y headers para vehículos
    const vehiclesData = [
        // Headers
        ['clienteEmail', 'marca', 'modelo', 'año', 'placa', 'color'],
        // Ejemplos
        ['juan.perez@email.com', 'Toyota', 'Corolla', '2020', 'ABC-123', 'Blanco'],
        ['maria.gonzalez@email.com', 'Honda', 'Civic', '2019', 'XYZ-789', 'Azul']
    ];

    // Crear hoja de instrucciones
    const instructionsData = [
        ['INSTRUCCIONES PARA USO DE PLANTILLA DE IMPORTACIÓN'],
        [''],
        ['HOJA CLIENTES:'],
        ['- name: Nombre completo del cliente (obligatorio)'],
        ['- email: Correo electrónico único (obligatorio)'],
        ['- phone: Número de teléfono (obligatorio)'],
        ['- address: Dirección completa (opcional)'],
        ['- password: Contraseña del cliente (obligatorio)'],
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
        ['- Campos obligatorios para clientes: name, email, phone, password'],
        ['- Campo opcional para clientes: address (puede dejarse vacío)'],
        ['- Los emails deben ser únicos y válidos'],
        ['- Las placas deben ser únicas'],
        ['- El año debe ser un número válido'],
        ['- Las contraseñas se almacenarán tal como se escriban'],
        ['- Asegúrese de que el email del cliente existe antes de asignar vehículos']
    ];

    // Crear worksheets usando aoa_to_sheet para mejor compatibilidad
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    const clientsWs = XLSX.utils.aoa_to_sheet(clientsData);
    const vehiclesWs = XLSX.utils.aoa_to_sheet(vehiclesData);

    // Configurar ancho de columnas
    instructionsWs['!cols'] = [{ width: 80 }];
    
    clientsWs['!cols'] = [
        { width: 20 },  // name
        { width: 30 },  // email
        { width: 15 },  // phone
        { width: 40 },  // address
        { width: 15 }   // password
    ];
    
    vehiclesWs['!cols'] = [
        { width: 30 },  // clienteEmail
        { width: 15 },  // marca
        { width: 15 },  // modelo
        { width: 10 },  // año
        { width: 15 },  // placa
        { width: 15 }   // color
    ];

    // Agregar hojas al libro en orden específico
    XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instrucciones');
    XLSX.utils.book_append_sheet(workbook, clientsWs, 'Clientes');
    XLSX.utils.book_append_sheet(workbook, vehiclesWs, 'Vehiculos');

    // Configurar orden de hojas
    workbook.SheetNames = ['Instrucciones', 'Clientes', 'Vehiculos'];

    // Crear directorio si no existe
    const templatePath = path.join(__dirname, '..', 'templates', 'plantilla-importacion-clientes-vehiculos.xlsx');
    const templatesDir = path.dirname(templatePath);
    
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Escribir archivo con opciones específicas para máxima compatibilidad
    const writeOptions = {
        bookType: 'xlsx',
        type: 'buffer',
        compression: true,
        Props: workbook.Props
    };

    try {
        // Generar buffer primero
        const buffer = XLSX.write(workbook, writeOptions);
        
        // Escribir buffer a archivo
        fs.writeFileSync(templatePath, buffer);
        
        // Verificar que el archivo se escribió correctamente
        if (fs.existsSync(templatePath)) {
            const stats = fs.statSync(templatePath);
            console.log(`Plantilla Excel compatible creada: ${templatePath}`);
            console.log(`Tamaño: ${stats.size} bytes`);
            console.log(`Hojas: ${workbook.SheetNames.join(', ')}`);
            
            // Verificar que se puede leer
            try {
                const testRead = XLSX.readFile(templatePath);
                console.log(`Verificación de lectura exitosa`);
                console.log(`Hojas leídas: ${testRead.SheetNames.join(', ')}`);
            } catch (readError) {
                console.error('Error verificando lectura:', readError.message);
                throw readError;
            }
            
        } else {
            throw new Error('No se pudo crear el archivo de plantilla');
        }
        
        return templatePath;
        
    } catch (error) {
        console.error('Error creando plantilla Excel:', error.message);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    try {
        createCompatibleExcelTemplate();
        console.log('\nPlantilla Excel compatible creada exitosamente!');
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

module.exports = { createCompatibleExcelTemplate };