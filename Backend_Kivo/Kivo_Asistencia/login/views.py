from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import RetrieveAPIView,ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime,time
from .models import Marcas, Trabajador
from .serializers import MarcaSerializer, TrabajadorProfileSerializer,MyTokenObtainPairSerializer

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

        # Todas las marcas de HOY (usando rango, más robusto que __date)
        marcas_hoy = Marcas.objects.filter(
            trabajador=trabajador,
            timestamp__range=(inicio_dia, fin_dia)
        ).order_by("timestamp")

        # --------- AQUÍ detectamos si hay entrada activa ---------
        entrada_activa = False

        if marcas_hoy.exists():
            entradas_hoy = marcas_hoy.filter(tipo_marca="entrada")
            salidas_hoy = marcas_hoy.filter(tipo_marca="salida")

            # ¿Hay al menos una entrada hoy?
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

        # Si pasa las validaciones, crear la marca
        marca = Marcas.objects.create(trabajador=trabajador, tipo_marca=tipo)
        serializer = MarcaSerializer(marca)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AsistenciasListView(ListAPIView):
    queryset = Marcas.objects.select_related("trabajador").order_by("-timestamp")
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]

class TrabajadorProfileView(RetrieveAPIView):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorProfileSerializer
    permission_classes = [IsAuthenticated]