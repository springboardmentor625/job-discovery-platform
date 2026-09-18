# app/utils/logger.py
import sys
from loguru import logger

# Remove the default boring Python logger
logger.remove()

# Add a colorful, highly readable console logger
logger.add(
    sys.stdout, 
    colorize=True, 
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Automatically save all logs to a file so you can debug crashes later
logger.add(
    "logs/swipex_backend.log", 
    rotation="10 MB",  # Create a new file when it hits 10MB
    retention="10 days", # Keep logs for 10 days
    level="INFO"
)

# Export this customized logger to be used anywhere in the app
swipex_logger = logger