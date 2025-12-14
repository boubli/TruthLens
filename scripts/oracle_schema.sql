-- TruthLens Backup Schema
USE truthlens_backup;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255),
    displayName VARCHAR(255),
    photoURL TEXT,
    tier VARCHAR(20),
    createdAt DATETIME,
    lastSyncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255),
    brand VARCHAR(255),
    barcode VARCHAR(50),
    category VARCHAR(255),
    nutriScore VARCHAR(5),
    createdAt DATETIME,
    lastSyncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

-- Scan History table
CREATE TABLE IF NOT EXISTS scan_history (
    id VARCHAR(128) PRIMARY KEY,
    userId VARCHAR(128),
    productId VARCHAR(128),
    scannedAt DATETIME,
    source VARCHAR(50),
    lastSyncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON,
    INDEX idx_userId (userId),
    INDEX idx_scannedAt (scannedAt)
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY,
    lastSyncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

-- Backup Log table
CREATE TABLE IF NOT EXISTS backup_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backupType VARCHAR(20),
    startedAt DATETIME,
    completedAt DATETIME,
    recordsBackedUp INT,
    status VARCHAR(20),
    error TEXT,
    triggeredBy VARCHAR(100)
);
