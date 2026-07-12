"""
Configuration module for the Enterprise Asset & Resource Management System.

Contains application-wide settings including database paths and application metadata.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'enterprise_assets.db')
APP_NAME = 'Enterprise Asset & Resource Management System'
