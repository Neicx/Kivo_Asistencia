from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from login.views import MyTokenObtainPairView, AsistenciasListView,TrabajadorProfileView, AsistenciasView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/asistencias/', AsistenciasListView.as_view(), name='asistencias_list'),
    path('api/trabajadores/<int:pk>/perfil/', TrabajadorProfileView.as_view(), name='trabajador_perfil'),
    path('api/asistencias/marcar/', AsistenciasView.as_view(), name='asistencias_marcar'),

]
