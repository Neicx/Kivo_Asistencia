from datetime import datetime, time

from rest_framework import status
from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils import timezone

from .models import (
    AuditoriaCambio,
    Empresa,
    Licencia,
    Marcas,
    Trabajador,
    Turno,
    Usuario,
    Vacaciones,
)
from .serializers import (
    AuditoriaSerializer,
    CrearUsuarioGeneralSerializer,
    EmpresaSerializer,
    LicenciaSerializer,
    MarcaSerializer,
    MyTokenObtainPairSerializer,
    TrabajadorProfileSerializer,
    TurnoSerializer,
    UpdateUsuarioSerializer,
    VacacionesSerializer,
    UsuarioListSerializer,
)


ROLES_CON_EMPRESAS = {"admin_rrhh", "asistente_rrhh", "fiscalizador"}
ROLES_RRHH = {"admin_rrhh", "asistente_rrhh"}


def empresas_autorizadas_ids(user: Usuario, roles=None):
    """
    Devuelve los IDs de empresas asociadas a un usuario.
    - Trabajador: la empresa de su ficha.
    - RRHH/fiscalizador: empresas asociadas via EmpresaUsuario (opcionalmente filtradas por rol).
    """
    roles_filtrados = set(roles) if roles else None

    if user.rol == "trabajador" and user.trabajador:
        if roles_filtrados and "trabajador" not in roles_filtrados:
            return []
        return [user.trabajador.empresa_id] if user.trabajador.empresa_id else []

    relaciones = user.empresas_usuario.all()
    if roles_filtrados:
        relaciones = relaciones.filter(rol__in=roles_filtrados)

    empresa_ids = list(relaciones.values_list("empresa_id", flat=True))

    if user.trabajador and user.trabajador.empresa_id and user.trabajador.empresa_id not in empresa_ids:
        empresa_ids.append(user.trabajador.empresa_id)
    return empresa_ids


def empresa_permitida(user: Usuario, empresa_id: int, roles=None) -> bool:
    if empresa_id is None:
        return False
    return user.tiene_acceso_empresa(empresa_id, roles=roles)


class TieneAccesoEmpresaPermission(IsAuthenticated):
    """
    Permiso reusable para validar acceso a endpoints por empresa.
    Busca empresa_id en query params o kwargs (empresa_id por defecto).
    """

    roles_empresa = None
    kwarg_name = "empresa_id"

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        roles_filtrados = getattr(view, "roles_empresa", self.roles_empresa)

        empresa_id = request.query_params.get("empresa_id") or view.kwargs.get(self.kwarg_name)
        if empresa_id is None:
            return bool(empresas_autorizadas_ids(request.user, roles=roles_filtrados))

        try:
            empresa_id = int(empresa_id)
        except (TypeError, ValueError):
            return False

        return request.user.tiene_acceso_empresa(empresa_id, roles=roles_filtrados)


def log_auditoria(usuario: Usuario, empresa_id: int, accion: str, modelo: str, registro_id: int, motivo=None):
    AuditoriaCambio.objects.create(
        usuario=usuario,
        empresa_id=empresa_id,
        accion=accion,
        modelo_afectado=modelo,
        registro_id=registro_id,
        motivo=motivo,
    )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class AsistenciasView(APIView):
    permission_classes = [IsAuthenticated]

    def get_trabajador(self, user):
        if not hasattr(user, "trabajador") or user.trabajador is None:
            return None
        return user.trabajador

    def get(self, request):
        trabajador = self.get_trabajador(request.user)
        if not trabajador:
            return Response(
                {"detail": "El usuario no tiene un trabajador asociado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hoy = timezone.localdate()
        tz = timezone.get_current_timezone()

        inicio_dia = timezone.make_aware(datetime.combine(hoy, time.min), tz)
        fin_dia = timezone.make_aware(datetime.combine(hoy, time.max), tz)

        marcas_hoy = (
            Marcas.objects.filter(trabajador=trabajador, timestamp__range=(inicio_dia, fin_dia))
            .select_related("trabajador", "trabajador__empresa")
            .order_by("timestamp")
        )

        entrada_activa = False
        if marcas_hoy.exists():
            entradas_hoy = marcas_hoy.filter(tipo_marca="entrada")
            salidas_hoy = marcas_hoy.filter(tipo_marca="salida")

            if entradas_hoy.exists():
                ultima_entrada = entradas_hoy.last()
                ultima_salida = salidas_hoy.last() if salidas_hoy.exists() else None
                if not ultima_salida or ultima_entrada.timestamp > ultima_salida.timestamp:
                    entrada_activa = True

        turno = trabajador.turno
        segundos_restantes = 0
        hora_servidor = timezone.localtime()
        hora_fin_jornada = None
        empresa = trabajador.empresa

        if turno:
            fin_dt = timezone.make_aware(datetime.combine(hoy, turno.hora_salida), tz)
            hora_fin_jornada = turno.hora_salida
            if entrada_activa:
                diff = fin_dt - hora_servidor
                segundos_restantes = max(int(diff.total_seconds()), 0)

        return Response(
            {
                "tiene_entrada_activa": entrada_activa,
                "segundos_restantes": segundos_restantes,
                "hora_servidor": hora_servidor.strftime("%H:%M:%S"),
                "hora_fin_jornada": hora_fin_jornada.strftime("%H:%M:%S") if hora_fin_jornada else None,
                "trabajador": {
                    "id": trabajador.id,
                    "nombre": trabajador.nombres,
                    "apellidos": trabajador.apellidos,
                    "cargo": trabajador.cargo,
                },
                "turno": {
                    "nombre": turno.nombre if turno else None,
                    "hora_entrada": turno.hora_entrada if turno else None,
                    "hora_salida": turno.hora_salida if turno else None,
                },
                "empresa": {
                    "nombre": empresa.razon_social if empresa else None,
                },
            }
        )

    def post(self, request):
        trabajador = self.get_trabajador(request.user)
        if not trabajador:
            return Response(
                {"detail": "El usuario no tiene un trabajador asociado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo = request.data.get("tipo_marca")
        if tipo not in ["entrada", "salida"]:
            return Response(
                {"detail": "tipo_marca debe ser 'entrada' o 'salida'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hoy = timezone.localdate()
        tz = timezone.get_current_timezone()
        inicio_dia = timezone.make_aware(datetime.combine(hoy, time.min), tz)
        fin_dia = timezone.make_aware(datetime.combine(hoy, time.max), tz)

        marcas_hoy = (
            Marcas.objects.filter(trabajador=trabajador, timestamp__range=(inicio_dia, fin_dia))
            .select_related("trabajador")
            .order_by("timestamp")
        )

        if tipo == "entrada":
            entradas = marcas_hoy.filter(tipo_marca="entrada")
            salidas = marcas_hoy.filter(tipo_marca="salida")
            if entradas.exists():
                ultima_entrada = entradas.last()
                ultima_salida = salidas.last() if salidas.exists() else None
                if not ultima_salida or ultima_entrada.timestamp > ultima_salida.timestamp:
                    return Response(
                        {"detail": "Ya tienes una entrada activa hoy."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        elif tipo == "salida":
            entradas = marcas_hoy.filter(tipo_marca="entrada")
            salidas = marcas_hoy.filter(tipo_marca="salida")
            if not entradas.exists():
                return Response(
                    {"detail": "No tienes una entrada registrada hoy."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ultima_entrada = entradas.last()
            ultima_salida = salidas.last() if salidas.exists() else None
            if ultima_salida and ultima_salida.timestamp > ultima_entrada.timestamp:
                return Response(
                    {"detail": "Ya tienes una salida registrada despues de la ultima entrada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        marca = Marcas.objects.create(trabajador=trabajador, tipo_marca=tipo)
        serializer = MarcaSerializer(marca)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AsistenciasListView(ListAPIView):
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        empresa_id = self.request.query_params.get("empresa_id")

        if user.rol == "trabajador":
            return (
                Marcas.objects.filter(trabajador=user.trabajador)
                .select_related("trabajador", "trabajador__empresa")
                .order_by("-timestamp")
            )

        qs = Marcas.objects.select_related("trabajador", "trabajador__empresa").order_by("-timestamp")
        allowed = empresas_autorizadas_ids(user, roles=ROLES_CON_EMPRESAS)
        if allowed:
            qs = qs.filter(trabajador__empresa_id__in=allowed)
        else:
            qs = qs.none()
        if empresa_id:
            qs = qs.filter(trabajador__empresa_id=empresa_id)
        return qs


class TrabajadorProfileView(RetrieveAPIView):
    serializer_class = TrabajadorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        allowed = empresas_autorizadas_ids(user)
        return Trabajador.objects.filter(empresa_id__in=allowed)


class TrabajadoresPorEmpresaView(ListAPIView):
    serializer_class = TrabajadorProfileSerializer
    permission_classes = [TieneAccesoEmpresaPermission]
    roles_empresa = ROLES_CON_EMPRESAS

    def get_queryset(self):
        empresa_id = int(self.kwargs["empresa_id"])
        user = self.request.user

        if user.rol in ROLES_CON_EMPRESAS and user.tiene_acceso_empresa(empresa_id):
            return Trabajador.objects.filter(empresa_id=empresa_id).select_related("empresa")

        if user.rol == "trabajador" and user.tiene_acceso_empresa(empresa_id):
            return Trabajador.objects.filter(id=user.trabajador_id)

        return Trabajador.objects.none()


class LicenciasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresa_id = request.query_params.get("empresa_id")
        user = request.user
        if user.rol in ROLES_CON_EMPRESAS:
            qs = Licencia.objects.select_related("trabajador", "trabajador__empresa")
            allowed = empresas_autorizadas_ids(user, roles=ROLES_CON_EMPRESAS)
            if allowed:
                qs = qs.filter(trabajador__empresa_id__in=allowed)
            else:
                qs = qs.none()
            if empresa_id:
                qs = qs.filter(trabajador__empresa_id=empresa_id)
        else:
            qs = Licencia.objects.filter(trabajador=user.trabajador)
        serializer = LicenciaSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        if request.user.rol != "trabajador":
            return Response({"detail": "Solo trabajadores pueden crear licencias."}, status=403)

        data = request.data.copy()
        data["trabajador"] = request.user.trabajador.id
        data["creado_por"] = request.user.id

        serializer = LicenciaSerializer(data=data)
        if serializer.is_valid():
            licencia = serializer.save()
            log_auditoria(
                request.user,
                empresa_id=request.user.trabajador.empresa_id,
                accion="crear_licencia",
                modelo="Licencia",
                registro_id=licencia.id,
                motivo=licencia.motivo_detallado,
            )
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)


class VacacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empresa_id = request.query_params.get("empresa_id")
        user = request.user
        if user.rol in ROLES_CON_EMPRESAS:
            qs = Vacaciones.objects.select_related("trabajador", "trabajador__empresa")
            allowed = empresas_autorizadas_ids(user, roles=ROLES_CON_EMPRESAS)
            if allowed:
                qs = qs.filter(trabajador__empresa_id__in=allowed)
            else:
                qs = qs.none()
            if empresa_id:
                qs = qs.filter(trabajador__empresa_id=empresa_id)
        else:
            qs = Vacaciones.objects.filter(trabajador=request.user.trabajador)

        return Response(VacacionesSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.rol != "trabajador":
            return Response({"detail": "Solo trabajadores pueden solicitar vacaciones."}, status=403)

        data = request.data.copy()
        data["trabajador"] = request.user.trabajador.id
        data["creado_por"] = request.user.id

        serializer = VacacionesSerializer(data=data)
        if serializer.is_valid():
            vac = serializer.save()
            log_auditoria(
                request.user,
                empresa_id=request.user.trabajador.empresa_id,
                accion="crear_vacaciones",
                modelo="Vacaciones",
                registro_id=vac.id,
            )
            return Response(VacacionesSerializer(vac).data, status=201)

        return Response(serializer.errors, status=400)


class AprobacionVacacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.rol not in ["admin_rrhh", "asistente_rrhh"]:
            return Response({"detail": "Permiso denegado"}, status=403)

        try:
            vac = Vacaciones.objects.get(id=pk)
        except Vacaciones.DoesNotExist:
            return Response({"detail": "Solicitud no encontrada"}, status=404)

        # validar empresa asignada
        if not request.user.tiene_acceso_empresa(vac.trabajador.empresa_id, roles=ROLES_RRHH):
            return Response({"detail": "Empresa no autorizada"}, status=403)

        accion = request.data.get("accion")
        if accion not in ["aceptar", "rechazar"]:
            return Response({"detail": "Accion invalida"}, status=400)

        vac.estado = "aceptado" if accion == "aceptar" else "rechazado"
        vac.resuelto_por = request.user
        vac.resuelto_en = timezone.now()
        vac.save()

        log_auditoria(
            request.user,
            empresa_id=vac.trabajador.empresa_id,
            accion=f"{accion}_vacaciones",
            modelo="Vacaciones",
            registro_id=vac.id,
        )

        nombre = (
            f"{request.user.trabajador.nombres} {request.user.trabajador.apellidos}"
            if request.user.trabajador
            else request.user.email
        )

        return Response(
            {
                "detail": f"Vacaciones {accion} correctamente",
                "estado": vac.estado,
                "resuelto_por": nombre,
                "resuelto_en": vac.resuelto_en,
            }
        )


class AprobacionLicenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.rol not in ["admin_rrhh", "asistente_rrhh"]:
            return Response({"detail": "Permiso denegado"}, status=403)

        try:
            licencia = Licencia.objects.get(id=pk)
        except Licencia.DoesNotExist:
            return Response({"detail": "Licencia no encontrada"}, status=404)

        if not request.user.tiene_acceso_empresa(licencia.trabajador.empresa_id, roles=ROLES_RRHH):
            return Response({"detail": "Empresa no autorizada"}, status=403)

        accion = request.data.get("accion")
        if accion not in ["aceptar", "rechazar"]:
            return Response({"detail": "Accion invalida"}, status=400)

        licencia.estado = "aceptado" if accion == "aceptar" else "rechazado"
        licencia.resuelto_por = request.user
        licencia.resuelto_en = timezone.now()
        licencia.save()

        nombre_resuelve = (
            f"{request.user.trabajador.nombres} {request.user.trabajador.apellidos}"
            if request.user.trabajador
            else request.user.email
        )

        log_auditoria(
            request.user,
            empresa_id=licencia.trabajador.empresa_id,
            accion=f"{accion}_licencia",
            modelo="Licencia",
            registro_id=licencia.id,
            motivo=licencia.motivo_detallado,
        )

        return Response(
            {
                "detail": f"Licencia {accion} correctamente.",
                "estado": licencia.estado,
                "resuelto_por": nombre_resuelve,
                "resuelto_en": licencia.resuelto_en,
            }
        )


class CrearUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.rol != "admin_rrhh":
            return Response({"detail": "Acceso denegado"}, status=403)

        serializer = CrearUsuarioGeneralSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.save()
            primera_empresa = None
            empresas_ids = request.data.get("empresas_ids") or []
            if empresas_ids:
                primera_empresa = empresas_ids[0]
            elif request.data.get("empresa_id"):
                primera_empresa = request.data.get("empresa_id")

            if primera_empresa:
                log_auditoria(
                    request.user,
                    empresa_id=primera_empresa,
                    accion="crear_usuario",
                    modelo="Usuario",
                    registro_id=data["usuario_id"],
                )
            return Response(data, status=201)

        return Response(serializer.errors, status=400)


class ActualizarUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk)

    def _update(self, request, pk):
        if request.user.rol != "admin_rrhh":
            return Response({"detail": "Acceso denegado"}, status=403)

        try:
            usuario_obj = Usuario.objects.get(id=pk)
        except Usuario.DoesNotExist:
            return Response({"detail": "Usuario no encontrado"}, status=404)

        serializer = UpdateUsuarioSerializer(instance=usuario_obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        resultado = serializer.save()
        empresas_ids = resultado.get("empresas_ids") or []
        motivo = resultado.get("motivo")

        for emp_id in empresas_ids or [None]:
            log_auditoria(
                request.user,
                empresa_id=emp_id,
                accion="actualizar_usuario",
                modelo="Usuario",
                registro_id=usuario_obj.id,
                motivo=motivo,
            )

        empresas_info = list(
            usuario_obj.empresas_usuario.select_related("empresa").values(
                "empresa_id", "empresa__razon_social", "rol"
            )
        )

        return Response(
            {
                "detail": "Usuario actualizado",
                "usuario_id": usuario_obj.id,
                "rol": usuario_obj.rol,
                "empresas": empresas_info,
            }
        )


class UsuariosEmpresaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioListSerializer

    def get_queryset(self):
        user = self.request.user
        empresa_id = self.request.query_params.get("empresa_id")
        allowed = empresas_autorizadas_ids(user, roles=ROLES_CON_EMPRESAS.union({"trabajador"}))
        qs = Usuario.objects.select_related("trabajador", "trabajador__empresa").prefetch_related(
            "empresas_usuario__empresa"
        )
        if allowed:
            qs = qs.filter(empresas_usuario__empresa_id__in=allowed).distinct()
        else:
            qs = qs.none()
        if empresa_id:
            qs = qs.filter(empresas_usuario__empresa_id=empresa_id)
        return qs


class EmpresaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmpresaSerializer

    def get_queryset(self):
        user = self.request.user
        allowed = empresas_autorizadas_ids(user)
        if user.rol == "trabajador":
            return Empresa.objects.filter(id__in=allowed)
        return Empresa.objects.filter(id__in=allowed) if allowed else Empresa.objects.none()


class EmpresaAsignadaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmpresaSerializer

    def get_queryset(self):
        allowed = empresas_autorizadas_ids(self.request.user)
        return Empresa.objects.filter(id__in=allowed)


class TurnoPorEmpresaView(ListAPIView):
    permission_classes = [TieneAccesoEmpresaPermission]
    roles_empresa = ROLES_CON_EMPRESAS
    serializer_class = TurnoSerializer

    def get_queryset(self):
        empresa_id = int(self.kwargs["empresa_id"])
        if not empresa_permitida(self.request.user, empresa_id):
            return Turno.objects.none()
        return Turno.objects.filter(empresa_id=empresa_id)


class AuditoriaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AuditoriaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol not in {"fiscalizador", "admin_rrhh"}:
            return AuditoriaCambio.objects.none()

        empresa_id = self.request.query_params.get("empresa_id")
        allowed = empresas_autorizadas_ids(user, roles=ROLES_CON_EMPRESAS)
        qs = AuditoriaCambio.objects.select_related("usuario", "empresa").order_by("-fecha")
        if allowed:
            qs = qs.filter(empresa_id__in=allowed)
        else:
            qs = qs.none()
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        return qs
