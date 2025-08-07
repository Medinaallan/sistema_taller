# Modelos de Datos - Esquemas de Base de Datos

## 📊 Esquemas de Tablas SQL

### 🔐 Tabla: `users`
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);
```

### 👥 Tabla: `clients`  
```sql
CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NULL, -- FK a users si el cliente tiene cuenta
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    date_of_birth DATE NULL,
    identification_number VARCHAR(50) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_name (name)
);
```

### 🚗 Tabla: `vehicles`
```sql
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(36) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year YEAR NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(50) NOT NULL,
    vin VARCHAR(17) UNIQUE NULL, -- Vehicle Identification Number
    engine_type VARCHAR(50) NULL,
    transmission VARCHAR(50) NULL,
    fuel_type VARCHAR(50) NULL,
    mileage INT UNSIGNED DEFAULT 0,
    purchase_date DATE NULL,
    insurance_company VARCHAR(255) NULL,
    insurance_policy VARCHAR(100) NULL,
    insurance_expiry DATE NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_license_plate (license_plate),
    INDEX idx_make_model (make, model),
    INDEX idx_year (year)
);
```

### 🔧 Tabla: `service_types`
```sql
CREATE TABLE service_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL, -- 'maintenance', 'repair', 'inspection'
    estimated_duration INT NOT NULL DEFAULT 60, -- minutos
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_name (name)
);
```

### 📋 Tabla: `work_orders`
```sql
CREATE TABLE work_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- WO-2024-0001
    client_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    service_type_id VARCHAR(36) NOT NULL,
    assigned_mechanic VARCHAR(255) NULL,
    status ENUM('pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Detalles del servicio
    description TEXT NOT NULL,
    customer_complaint TEXT NULL,
    diagnosis TEXT NULL,
    work_performed TEXT NULL,
    recommendations TEXT NULL,
    
    -- Información financiera
    labor_cost DECIMAL(10,2) DEFAULT 0.00,
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Fechas
    scheduled_date DATETIME NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    promised_date DATETIME NULL,
    
    -- Kilometraje
    mileage_in INT UNSIGNED NULL,
    mileage_out INT UNSIGNED NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    
    INDEX idx_order_number (order_number),
    INDEX idx_client (client_id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_mechanic (assigned_mechanic)
);
```

### 🛠️ Tabla: `work_order_parts`
```sql
CREATE TABLE work_order_parts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    work_order_id VARCHAR(36) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(255) NULL,
    warranty_months INT NULL DEFAULT 12,
    installed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    INDEX idx_work_order (work_order_id)
);
```

### 📅 Tabla: `reminders`
```sql
CREATE TABLE reminders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    type ENUM('mileage', 'date', 'both') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Trigger conditions
    trigger_mileage INT UNSIGNED NULL,
    trigger_date DATE NULL,
    
    -- Current status
    current_mileage INT UNSIGNED NULL,
    last_service_date DATE NULL,
    
    -- Notification settings
    notify_days_before INT DEFAULT 7,
    notify_km_before INT DEFAULT 1000,
    
    -- Status
    status ENUM('active', 'completed', 'snoozed', 'cancelled') DEFAULT 'active',
    last_triggered_at TIMESTAMP NULL,
    snooze_until TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    
    INDEX idx_client_vehicle (client_id, vehicle_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_trigger_date (trigger_date)
);
```

### 📧 Tabla: `notifications`
```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NULL,
    client_id VARCHAR(36) NULL,
    type VARCHAR(100) NOT NULL, -- 'reminder', 'work_order_update', 'appointment'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    related_model VARCHAR(100) NULL, -- 'work_orders', 'reminders'
    related_id VARCHAR(36) NULL,
    
    -- Delivery channels
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    -- Status
    read_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_client (client_id),
    INDEX idx_type (type),
    INDEX idx_read (read_at)
);
```

### 💰 Tabla: `payments`
```sql
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    work_order_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'transfer', 'check') NOT NULL,
    payment_reference VARCHAR(255) NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
    INDEX idx_work_order (work_order_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
);
```

### 📊 Tabla: `audit_logs`
```sql
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login'
    model VARCHAR(100) NOT NULL, -- 'clients', 'vehicles', 'work_orders'
    model_id VARCHAR(36) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_model (model, model_id),
    INDEX idx_created_at (created_at)
);
```

### ⚙️ Tabla: `system_settings`
```sql
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    key_value TEXT NULL,
    description TEXT NULL,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key_name (key_name)
);
```

## 🔗 Relaciones y Constraints

### Relaciones Principales
```sql
-- Un cliente puede tener múltiples vehículos
clients 1 -----> N vehicles

-- Un cliente puede tener múltiples órdenes de trabajo
clients 1 -----> N work_orders

-- Un vehículo puede tener múltiples órdenes de trabajo
vehicles 1 -----> N work_orders

-- Una orden de trabajo puede tener múltiples partes
work_orders 1 -----> N work_order_parts

-- Una orden de trabajo puede tener múltiples pagos
work_orders 1 -----> N payments

-- Un cliente/vehículo puede tener múltiples recordatorios
clients 1 -----> N reminders
vehicles 1 -----> N reminders
```

### Triggers Recomendados
```sql
-- Actualizar totales de work_order cuando se agregan partes
DELIMITER //
CREATE TRIGGER update_work_order_total 
AFTER INSERT ON work_order_parts
FOR EACH ROW
BEGIN
    UPDATE work_orders 
    SET parts_cost = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM work_order_parts 
        WHERE work_order_id = NEW.work_order_id
    ),
    total_cost = labor_cost + (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM work_order_parts 
        WHERE work_order_id = NEW.work_order_id
    )
    WHERE id = NEW.work_order_id;
END//
DELIMITER ;

-- Generar número de orden automático
DELIMITER //
CREATE TRIGGER generate_order_number
BEFORE INSERT ON work_orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('WO-', YEAR(NOW()), '-', 
            LPAD((SELECT COALESCE(MAX(SUBSTRING(order_number, -4)), 0) + 1 
                  FROM work_orders 
                  WHERE YEAR(created_at) = YEAR(NOW())), 4, '0'));
    END IF;
END//
DELIMITER ;
```

## 📈 Índices de Performance

### Índices Compuestos Recomendados
```sql
-- Para búsquedas frecuentes de órdenes de trabajo
CREATE INDEX idx_work_orders_status_date ON work_orders(status, scheduled_date);
CREATE INDEX idx_work_orders_client_status ON work_orders(client_id, status);

-- Para reportes y dashboard
CREATE INDEX idx_work_orders_completed_month ON work_orders(completed_at, status);
CREATE INDEX idx_payments_date_amount ON payments(payment_date, amount);

-- Para recordatorios activos
CREATE INDEX idx_reminders_active ON reminders(status, trigger_date, trigger_mileage);
```

## 🔄 Datos de Seed/Inicialización

### Service Types Básicos
```sql
INSERT INTO service_types (name, category, estimated_duration, base_price) VALUES
('Cambio de aceite', 'maintenance', 30, 45.00),
('Mantenimiento 10,000 km', 'maintenance', 120, 180.00),
('Mantenimiento 20,000 km', 'maintenance', 180, 350.00),
('Alineación y balanceo', 'maintenance', 90, 80.00),
('Revisión de frenos', 'inspection', 60, 65.00),
('Cambio de pastillas de freno', 'repair', 120, 120.00),
('Diagnóstico general', 'inspection', 45, 50.00),
('Reparación de motor', 'repair', 480, 800.00);

-- Sistema Settings
INSERT INTO system_settings (key_name, key_value, description, type) VALUES
('company_name', 'TallerPro', 'Nombre de la empresa', 'string'),
('company_phone', '+1234567890', 'Teléfono principal', 'string'),
('company_email', 'info@tallerpro.com', 'Email de contacto', 'string'),
('tax_rate', '0.16', 'Tasa de impuestos', 'number'),
('currency', 'USD', 'Moneda del sistema', 'string'),
('reminder_days_before', '7', 'Días antes para recordatorios', 'number'),
('reminder_km_before', '1000', 'Kilómetros antes para recordatorios', 'number');
```

---

**Notas de Implementación:**
1. Usar UUIDs para todas las PKs para escalabilidad
2. Implementar soft deletes (deleted_at) para auditoria
3. Todas las tablas deben tener timestamps
4. Los decimales monetarios siempre con 2 decimales
5. Índices optimizados para las consultas más frecuentes
6. Triggers para automatizar cálculos y numeración
