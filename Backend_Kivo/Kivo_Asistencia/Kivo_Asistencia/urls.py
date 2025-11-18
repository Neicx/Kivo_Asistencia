from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

from login.views import (
    MyTokenObtainPairView,
    AsistenciasListView,
    TrabajadorProfileView,
    AsistenciasView,
    AprobacionLicenciaView,
    LicenciasView,
    CrearUsuarioView,
    TurnoPorEmpresaView, 
    EmpresaListView,
    VacacionesView,
    AprobacionVacacionesView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/asistencias/', AsistenciasListView.as_view(), name='asistencias_list'),
    path('api/trabajadores/<int:pk>/perfil/', TrabajadorProfileView.as_view(), name='trabajador_perfil'),
    path('api/asistencias/marcar/', AsistenciasView.as_view(), name='asistencias_marcar'),

    path("api/licencias/", LicenciasView.as_view(), name="licencias"),
    path("api/licencias/<int:pk>/resolver/", AprobacionLicenciaView.as_view(), name="licencias_resolver"),
    path("api/rrhh/usuarios/crear/", CrearUsuarioView.as_view()),

    path("api/empresas/", EmpresaListView.as_view()),
    path("api/empresas/<int:empresa_id>/turnos/", TurnoPorEmpresaView.as_view()),
    path("api/vacaciones/", VacacionesView.as_view()),
    path("api/vacaciones/<int:pk>/resolver/", AprobacionVacacionesView.as_view()),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
