#!/bin/bash

# backup.sh — backs up the SQLite database
# Called by cron with either "daily" or "weekly" as argument

TYPE=$1  # "daily" or "weekly"
DB_PATH="/home/admin/homeserver/homeserver.db"
BACKUP_DIR="/home/admin/homeserver/backups/$TYPE"
DATE=$(date +%Y-%m-%d_%H-%M)
FILENAME="homeserver_$DATE.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Copy the database file
cp "$DB_PATH" "$BACKUP_DIR/$FILENAME"

# Verify the copy succeeded
if [ $? -eq 0 ]; then
  echo "[$DATE] Backup successful: $BACKUP_DIR/$FILENAME"
else
  echo "[$DATE] Backup FAILED" >&2
  exit 1
fi

# Rotate old backups
if [ "$TYPE" = "daily" ]; then
  KEEP=7
elif [ "$TYPE" = "weekly" ]; then
  KEEP=5
fi

# List backups by date, delete oldest beyond the keep limit
ls -t "$BACKUP_DIR"/*.db | tail -n +$((KEEP + 1)) | xargs -r rm --

echo "[$DATE] Rotation done, keeping last $KEEP $TYPE backups"