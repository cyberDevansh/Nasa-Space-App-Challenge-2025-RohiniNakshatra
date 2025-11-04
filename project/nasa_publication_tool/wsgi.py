"""
WSGI config for nasa_publication_tool project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application
from neo4j_connection import Neo4jConnection
import atexit

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nasa_publication_tool.settings')

neo4j_connection = Neo4jConnection()

atexit.register(neo4j_connection.close)

application = get_wsgi_application()
