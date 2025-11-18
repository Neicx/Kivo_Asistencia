from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Marcas, Trabajador,Licencia,Usuario,Empresa,Turno, Vacaciones
from django.utils import timezone

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'rut'

    def validate(self, attrs):
        rut = attrs.get('rut')
        password = attrs.get('password')

        user = authenticate(rut=rut, password=password)
        if not user:
            raise serializers.ValidationError("Credenciales inválidas")

        refresh = self.get_token(user)

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "rut": user.rut,
                "email": user.email,
                "rol": user.rol,
                "estado": user.estado,
            }
        }

        if user.trabajador:
            data["user"].update({
                "trabajador_id": user.trabajador.id,
                "nombre": user.trabajador.nombres,
                "apellido": user.trabajador.apellidos,
                "cargo": user.trabajador.cargo,
            })
        if not user or user.estado != "activo":
            raise serializers.ValidationError("Credenciales inválidas")

        return data

class VacacionesSerializer(serializers.ModelSerializer):
    trabajador_nombre = serializers.CharField(source="trabajador.nombres", read_only=True)

    class Meta:
        model = Vacaciones
        fields = "__all__"
        read_only_fields = ["estado", "creado_por", "creado_en", "resuelto_por", "resuelto_en"]

class LicenciaSerializer(serializers.ModelSerializer):
    trabajador_nombre = serializers.CharField(source="trabajador.nombres", read_only=True)

    class Meta:
        model = Licencia
        fields = "__all__"
        read_only_fields = ["estado", "creado_por", "creado_en"]

class MarcaSerializer(serializers.ModelSerializer):
    trabajador_rut = serializers.CharField(source="trabajador.rut", read_only=True)
    trabajador_nombre = serializers.CharField(source="trabajador.nombres", read_only=True)
    trabajador_apellido = serializers.CharField(source="trabajador.apellidos", read_only=True)
    empresa = serializers.CharField(source="trabajador.empresa.razon_social", read_only=True)
    hash = serializers.CharField(read_only=True)

    class Meta:
        model = Marcas
        fields = [
            "id",
            "tipo_marca",
            "timestamp",
            "hash",
            "trabajador_rut",
            "trabajador_nombre",
            "trabajador_apellido",
            "empresa",
        ]

class MarcaBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marcas
        fields = ["id", "tipo_marca", "timestamp"]

class TrabajadorProfileSerializer(serializers.ModelSerializer):
    marcas = MarcaBasicSerializer(many=True, read_only=True, source="marcas_set")

    class Meta:
        model = Trabajador
        fields = [
            "id",
            "rut",
            "nombres",
            "apellidos",
            "cargo",
            "fecha_ingreso",
            "estado",
            "marcas",
        ]

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ["id", "razon_social", "rut_empresa"]

class TurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = ["id", "nombre", "hora_entrada", "hora_salida", "tolerancia_minutos", "empresa"]



class CrearUsuarioGeneralSerializer(serializers.Serializer):

    # --- CAMPOS DEL USUARIO ---
    rut = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    rol = serializers.ChoiceField(
        choices=["trabajador", "asistente_rrhh", "admin_rrhh", "fiscalizador"]
    )

    # --- CAMPOS DEL TRABAJADOR (solo para rol trabajador) ---
    nombres = serializers.CharField(max_length=255, required=False)
    apellidos = serializers.CharField(max_length=255, required=False)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    area_trabajador = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tipo_contrato = serializers.ChoiceField(
        required=False,
        allow_null=True,
        allow_blank=True,
        choices=[
            ("contrato_por_obra","Contrato por obra o faena"),
            ("contrato_plazo_fijo","Contrato a plazo fijo"),
            ("contrato_part_time","Contrato part time"),
            ("contrato_indefinido","Contrato indefinido"),
            ("contrato_para_extranjeros","Contrato para extranjeros"),
        ],
        default="contrato_indefinido"
    )
    correo = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    empresa_id = serializers.IntegerField(required=False)
    turno_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):

        # Validar que rut sea único
        if Usuario.objects.filter(rut=attrs["rut"]).exists():
            raise serializers.ValidationError({"rut": "El RUT ya está registrado como usuario"})

        # Validar email único
        if Usuario.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "El correo ya está registrado como usuario"})

        # Si es trabajador → requiere crear también Trabajador
        if attrs["rol"] == "trabajador":

            required = ["nombres", "apellidos", "empresa_id"]

            faltantes = [f for f in required if not attrs.get(f)]
            if faltantes:
                raise serializers.ValidationError(
                    {"detail": f"Faltan campos obligatorios del trabajador: {faltantes}"}
                )

            # Validar empresa
            try:
                Empresa.objects.get(id=attrs["empresa_id"])
            except Empresa.DoesNotExist:
                raise serializers.ValidationError({"empresa_id": "La empresa no existe"})

            # Validar turno si viene
            if attrs.get("turno_id"):
                try:
                    Turno.objects.get(id=attrs["turno_id"])
                except Turno.DoesNotExist:
                    raise serializers.ValidationError({"turno_id": "Turno no encontrado"})

        return attrs

    def create(self, data):
        trabajador = None

        # ---- CREAR TRABAJADOR ----
        if data["rol"] == "trabajador":

            empresa = Empresa.objects.get(id=data["empresa_id"])
            turno = None
            if data.get("turno_id"):
                turno = Turno.objects.get(id=data["turno_id"])

            # Si no viene fecha_ingreso, usar fecha de hoy
            fecha_ingreso = data.get("fecha_ingreso", timezone.localdate())

            trabajador = Trabajador.objects.create(
                empresa=empresa,
                rut=data["rut"],
                nombres=data["nombres"],
                apellidos=data["apellidos"],
                cargo=data.get("cargo"),
                area_trabajador=data.get("area_trabajador"),
                tipo_contrato=data.get("tipo_contrato", "contrato_indefinido"),
                correo=data.get("correo"),
                turno=turno,
                fecha_ingreso=fecha_ingreso
            )

        # ---- CREAR USUARIO ----
        usuario = Usuario.objects.create(
            trabajador=trabajador,
            rut=data["rut"],
            email=data["email"],
            rol=data["rol"],
        )

        # GUARDAR PASSWORD COMO TEXTO (NO HASH)
        usuario.password = data["password"]
        usuario.save()

        return {
            "usuario_id": usuario.id,
            "trabajador_id": trabajador.id if trabajador else None,
            "rut": usuario.rut,
            "email": usuario.email,
            "rol": usuario.rol,
            "estado": usuario.estado
        }