from django.contrib import admin
from django.urls import path, include
from .views import ListCategoriesView, GetCategoryView, ListDocumentsView, ListAllDocumentsView, GetDocumentView, SearchByNodesView
from .views import ListSummariesView

urlpatterns = [
    path('list-categories/', ListCategoriesView.as_view(), name='list_categories'),
    path('get-category/<str:pk>/', GetCategoryView.as_view(), name='get_category'),
    path('list-documents/', ListDocumentsView.as_view(), name='list_documents'),
    path('list-all-documents/', ListAllDocumentsView.as_view(), name='list_all_documents'),
    path('list-summaries/', ListSummariesView.as_view(), name='list_summaries'),
    path('get-document/', GetDocumentView.as_view(), name='get_document'),
    path('search-by-nodes/', SearchByNodesView.as_view(), name='search_by_nodes'),
]

