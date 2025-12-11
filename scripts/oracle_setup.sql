CREATE USER IF NOT EXISTS 'truthlens'@'%' IDENTIFIED BY 'TL_Backup_2024';
GRANT ALL PRIVILEGES ON truthlens_backup.* TO 'truthlens'@'%';
FLUSH PRIVILEGES;
