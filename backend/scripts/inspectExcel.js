const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Script para inspeccionar el contenido del Excel
function inspectExcel() {
    try {
        const excelPath = path.join(__dirname, '../templates/mantenimiento de freno.xlsx');
        
        if (!fs.existsSync(excelPath)) {
            throw new Error(`Archivo Excel no encontrado: ${excelPath}`);
        }
        
        const workbook = XLSX.readFile(excelPath);
        console.log('=== INSPECCIÓN DEL ARCHIVO EXCEL ===');
        console.log(`Archivo: ${excelPath}`);
        console.log(`Hojas disponibles: ${workbook.SheetNames.join(', ')}`);
        
        // Inspeccionar cada hoja
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- HOJA: ${sheetName} ---`);
            const worksheet = workbook.Sheets[sheetName];
            
            // Obtener el rango de la hoja
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            console.log(`Rango: ${worksheet['!ref']} (filas: ${range.s.r + 1}-${range.e.r + 1}, columnas: ${range.s.c + 1}-${range.e.c + 1})`);
            
            // Mostrar las primeras 5 filas
            console.log('\nPrimeras 5 filas:');
            for (let rowNum = range.s.r; rowNum <= Math.min(range.e.r, range.s.r + 4); rowNum++) {
                const row = [];
                for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                    const cell = worksheet[cellAddress];
                    row.push(cell ? cell.v : '');
                }
                console.log(`Fila ${rowNum + 1}: [${row.join(', ')}]`);
            }
            
            // Convertir a JSON desde la fila 3 (omitiendo filas 1 y 2 jsjs)
            console.log('\nDatos desde fila 3 (JSON):');
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                range: `A3:${XLSX.utils.encode_col(range.e.c)}${range.e.r + 1}`,
                header: 1,
                defval: ''
            });
            
            console.log(`Filas de datos: ${jsonData.length}`);
            jsonData.slice(0, 3).forEach((row, index) => {
                console.log(`Fila ${index + 3}: ${JSON.stringify(row)}`);
            });
        });
        
    } catch (error) {
        console.error('Error inspeccionando Excel:', error);
    }
}

// Ejecutar inspección
inspectExcel();