from django.contrib import admin
from django.urls import path, include
from .views import query_and_generate

urlpatterns = [
    path('query-and-generate/', query_and_generate, name='query_and_generate'),
]