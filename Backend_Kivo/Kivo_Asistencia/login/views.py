from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import RetrieveAPIView,ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime,time
from .models import Marcas, Trabajador, Licencia, Empresa, Turno, Vacaciones
from .serializers import MarcaSerializer, TrabajadorProfileSerializer,MyTokenObtainPairSerializer, LicenciaSerializer, CrearUsuarioGeneralSerializer, EmpresaSerializer, TurnoSerializer, VacacionesSerializer

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

        # Fecha y rango horario del día de hoy en la zona horaria actual
        hoy = timezone.localdate()
        tz = timezone.get_current_timezone()

        inicio_dia = timezone.make_aware(
            datetime.combine(hoy, time.min),
            tz
        )
        fin_dia = timezone.make_aware(
            datetime.combine(hoy, time.max),
            tz
        )

        # Marcas de HOY
        marcas_hoy = Marcas.objects.filter(
            trabajador=trabajador,
            timestamp__range=(inicio_dia, fin_dia)
        ).order_by("timestamp")

        # Detectar entrada activa
        entrada_activa = False

        if marcas_hoy.exists():
            entradas_hoy = marcas_hoy.filter(tipo_marca="entrada")
            salidas_hoy = marcas_hoy.filter(tipo_marca="salida")

            if entradas_hoy.exists():
                ultima_entrada = entradas_hoy.last()
                ultima_salida = salidas_hoy.last() if salidas_hoy.exists() else None

                if not ultima_salida or ultima_entrada.timestamp > ultima_salida.timestamp:
                    entrada_activa = True

        tiene_entrada_activa = entrada_activa

        turno = trabajador.turno
        segundos_restantes = 0
        hora_servidor = timezone.localtime()
        hora_fin_jornada = None
        empresa = trabajador.empresa

        if turno:
            fin_dt = timezone.make_aware(
                datetime.combine(hoy, turno.hora_salida),
                tz
            )
            hora_fin_jornada = turno.hora_salida

            if tiene_entrada_activa:
                diff = fin_dt - hora_servidor
                segundos_restantes = max(int(diff.total_seconds()), 0)

        return Response({
            "tiene_entrada_activa": tiene_entrada_activa,
            "segundos_restantes": segundos_restantes,
            "hora_servidor": hora_servidor.strftime("%H:%M:%S"),
            "hora_fin_jornada": (
                hora_fin_jornada.strftime("%H:%M:%S")
                if hora_fin_jornada else None
            ),
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
        })
    
    def post(self, request):
        trabajador = self.get_trabajador(request.user)
        if not trabajador:
            return Response(
                {"detail": "El usuario no tiene un trabajador asociado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo = request.data.get("tipo_marca")
        if tipo not in ["entrada", "salida"]:
            return Response(
                {"detail": "tipo_marca debe ser 'entrada' o 'salida'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        hoy = timezone.localdate()
        tz = timezone.get_current_timezone()
        inicio_dia = timezone.make_aware(datetime.combine(hoy, time.min), tz)
        fin_dia = timezone.make_aware(datetime.combine(hoy, time.max), tz)

        marcas_hoy = Marcas.objects.filter(
            trabajador=trabajador,
            timestamp__range=(inicio_dia, fin_dia)
        ).order_by("timestamp")

        if tipo == "entrada":
            entradas = marcas_hoy.filter(tipo_marca="entrada")
            salidas = marcas_hoy.filter(tipo_marca="salida")
            if entradas.exists():
                ultima_entrada = entradas.last()
                ultima_salida = salidas.last() if salidas.exists() else None
                if not ultima_salida or ultima_entrada.timestamp > ultima_salida.timestamp:
                    return Response(
                        {"detail": "Ya tienes una entrada activa hoy."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        elif tipo == "salida":
            entradas = marcas_hoy.filter(tipo_marca="entrada")
            salidas = marcas_hoy.filter(tipo_marca="salida")
            if not entradas.exists():
                return Response(
                    {"detail": "No tienes una entrada registrada hoy."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ultima_entrada = entradas.last()
            ultima_salida = salidas.last() if salidas.exists() else None
            if ultima_salida and ultima_salida.timestamp > ultima_entrada.timestamp:
                return Response(
                    {"detail": "Ya tienes una salida registrada después de la última entrada."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Crear marca
        marca = Marcas.objects.create(trabajador=trabajador, tipo_marca=tipo)
        serializer = MarcaSerializer(marca)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



# ------------------------ ARREGLO APLICADO AQUÍ ------------------------
class AsistenciasListView(ListAPIView):
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # FILTRAR SOLO si el rol es exactamente "trabajador"
        if user.rol == "trabajador":
            return Marcas.objects.filter(
                trabajador=user.trabajador
            ).select_related("trabajador").order_by("-timestamp")

        # Los demás roles (admin_rrhh, asistente_rrhh, fiscalizador) ven todo
        return Marcas.objects.select_related("trabajador").order_by("-timestamp")


class TrabajadorProfileView(RetrieveAPIView):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorProfileSerializer
    permission_classes = [IsAuthenticated]

    

class LicenciasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # RRHH ve todas; trabajador solo las suyas
        if request.user.rol == "admin_rrhh" or request.user.rol == "asistente_rrhh":
            licencias = Licencia.objects.all()
        else:
            licencias = Licencia.objects.filter(trabajador=request.user.trabajador)

        serializer = LicenciaSerializer(licencias, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):

        # Solo trabajadores pueden crear licencias
        if request.user.rol != "trabajador":
            return Response(
                {"detail": "Solo trabajadores pueden crear licencias."},
                status=403
            )

        data = request.data.copy()
        data["trabajador"] = request.user.trabajador.id
        data["creado_por"] = request.user.id

        serializer = LicenciaSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)


class VacacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # RRHH ve todas, trabajador solo las suyas
        if request.user.rol in ["admin_rrhh", "asistente_rrhh"]:
            vacaciones = Vacaciones.objects.all()
        else:
            vacaciones = Vacaciones.objects.filter(trabajador=request.user.trabajador)

        return Response(VacacionesSerializer(vacaciones, many=True).data)

    def post(self, request):
        # Solo trabajadores pueden crear vacaciones
        if request.user.rol != "trabajador":
            return Response({"detail": "Solo trabajadores pueden solicitar vacaciones."}, status=403)

        data = request.data.copy()
        data["trabajador"] = request.user.trabajador.id
        data["creado_por"] = request.user.id

        serializer = VacacionesSerializer(data=data)
        if serializer.is_valid():
            vac = serializer.save()
            return Response(VacacionesSerializer(vac).data, status=201)

        return Response(serializer.errors, status=400)
class AprobacionVacacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Solo RRHH puede resolver
        if request.user.rol not in ["admin_rrhh", "asistente_rrhh"]:
            return Response({"detail": "Permiso denegado"}, status=403)

        try:
            vac = Vacaciones.objects.get(id=pk)
        except Vacaciones.DoesNotExist:
            return Response({"detail": "Solicitud no encontrada"}, status=404)

        accion = request.data.get("accion")
        if accion not in ["aceptar", "rechazar"]:
            return Response({"detail": "Acción inválida"}, status=400)

        vac.estado = "aceptado" if accion == "aceptar" else "rechazado"
        vac.resuelto_por = request.user
        vac.resuelto_en = timezone.now()
        vac.save()

        # Nombre del usuario que resolvió
        if request.user.trabajador:
            nombre = f"{request.user.trabajador.nombres} {request.user.trabajador.apellidos}"
        else:
            nombre = request.user.email

        return Response({
            "detail": f"Vacaciones {accion} correctamente",
            "estado": vac.estado,
            "resuelto_por": nombre,
            "resuelto_en": vac.resuelto_en
        })

class AprobacionLicenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Validar roles permitidos
        if request.user.rol not in ["admin_rrhh", "asistente_rrhh"]:
            return Response({"detail": "Permiso denegado"}, status=403)

        try:
            licencia = Licencia.objects.get(id=pk)
        except Licencia.DoesNotExist:
            return Response({"detail": "Licencia no encontrada"}, status=404)

        accion = request.data.get("accion")

        if accion not in ["aceptar", "rechazar"]:
            return Response({"detail": "Acción inválida"}, status=400)

        licencia.estado = "aceptado" if accion == "aceptar" else "rechazado"
        licencia.resuelto_por = request.user
        licencia.resuelto_en = timezone.now()
        licencia.save()

        # 🔹 construir nombre del usuario que resolvió
        if request.user.trabajador:
            nombre_resuelve = f"{request.user.trabajador.nombres} {request.user.trabajador.apellidos}"
        else:
            nombre_resuelve = request.user.email  # fallback

        return Response({
            "detail": f"Licencia {accion} correctamente.",
            "estado": licencia.estado,
            "resuelto_por": nombre_resuelve,
            "resuelto_en": licencia.resuelto_en
        })

class CrearUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.rol != "admin_rrhh":
            return Response({"detail": "Acceso denegado"}, status=403)

        serializer = CrearUsuarioGeneralSerializer(data=request.data)

        if serializer.is_valid():
            data = serializer.save()
            return Response(data, status=201)

        return Response(serializer.errors, status=400)
    

class EmpresaListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmpresaSerializer
    queryset = Empresa.objects.all()

class TurnoPorEmpresaView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TurnoSerializer

    def get_queryset(self):
        empresa_id = self.kwargs["empresa_id"]
        return Turno.objects.filter(empresa_id=empresa_id)