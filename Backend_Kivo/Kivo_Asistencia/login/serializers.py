from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import (
    AuditoriaCambio,
    Empresa,
    EmpresaUsuario,
    Licencia,
    Marcas,
    Trabajador,
    Turno,
    Usuario,
    Vacaciones,
)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "rut"

    def validate(self, attrs):
        rut = attrs.get("rut")
        password = attrs.get("password")

        user = authenticate(rut=rut, password=password)
        if not user or user.estado != "activo":
            raise serializers.ValidationError("Credenciales invalidas")

        refresh = self.get_token(user)
        empresas = [
            {
                "id": rel.empresa_id,
                "razon_social": rel.empresa.razon_social,
                "rut_empresa": rel.empresa.rut_empresa,
                "rol": rel.rol,
            }
            for rel in user.empresas_usuario.select_related("empresa")
        ]

        if user.rol == "trabajador" and not empresas and user.trabajador and user.trabajador.empresa:
            empresa = user.trabajador.empresa
            empresas.append(
                {
                    "id": empresa.id,
                    "razon_social": empresa.razon_social,
                    "rut_empresa": empresa.rut_empresa,
                    "rol": "trabajador",
                }
            )

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "rut": user.rut,
                "email": user.email,
                "rol": user.rol,
                "estado": user.estado,
                "empresas": empresas,
            },
        }

        if user.trabajador:
            data["user"].update(
                {
                    "trabajador_id": user.trabajador.id,
                    "nombre": user.trabajador.nombres,
                    "apellido": user.trabajador.apellidos,
                    "cargo": user.trabajador.cargo,
                    "empresa_id": user.trabajador.empresa_id,
                }
            )

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
        read_only_fields = ["estado", "creado_por", "creado_en", "resuelto_por", "resuelto_en"]


class MarcaSerializer(serializers.ModelSerializer):
    trabajador_id = serializers.IntegerField(source="trabajador.id", read_only=True)
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
            "trabajador_id",
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
    usuario_id = serializers.IntegerField(source="usuario.id", read_only=True)
    empresa_id = serializers.IntegerField(source="empresa.id", read_only=True)
    empresa_nombre = serializers.CharField(source="empresa.razon_social", read_only=True)
    turno_id = serializers.IntegerField(source="turno.id", read_only=True)

    class Meta:
        model = Trabajador
        fields = [
            "id",
            "usuario_id",
            "rut",
            "nombres",
            "apellidos",
            "cargo",
            "area_trabajador",
            "tipo_contrato",
            "correo",
            "fecha_ingreso",
            "empresa_id",
            "empresa_nombre",
            "turno_id",
            "estado",
            "marcas",
        ]


class UsuarioListSerializer(serializers.ModelSerializer):
    trabajador_id = serializers.IntegerField(source="trabajador.id", read_only=True)
    trabajador_nombre = serializers.CharField(source="trabajador.nombres", read_only=True)
    trabajador_apellidos = serializers.CharField(source="trabajador.apellidos", read_only=True)
    empresa_id = serializers.IntegerField(source="trabajador.empresa_id", read_only=True)
    empresas = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "rut",
            "email",
            "rol",
            "estado",
            "trabajador_id",
            "trabajador_nombre",
            "trabajador_apellidos",
            "empresa_id",
            "empresas",
        ]

    def get_empresas(self, obj):
        return [
            {
                "id": rel.empresa_id,
                "razon_social": rel.empresa.razon_social,
                "rol": rel.rol,
            }
            for rel in obj.empresas_usuario.select_related("empresa")
        ]


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ["id", "razon_social", "rut_empresa"]


class TurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = ["id", "nombre", "hora_entrada", "hora_salida", "tolerancia_minutos", "empresa"]


class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_rut = serializers.CharField(source="usuario.rut", read_only=True)
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    empresa_nombre = serializers.CharField(source="empresa.razon_social", read_only=True)

    class Meta:
        model = AuditoriaCambio
        fields = [
            "id",
            "usuario_rut",
            "usuario_email",
            "empresa",
            "empresa_nombre",
            "accion",
            "modelo_afectado",
            "registro_id",
            "motivo",
            "fecha",
        ]


class EmpresaRolSerializer(serializers.Serializer):
    empresa_id = serializers.IntegerField()
    rol = serializers.ChoiceField(
        choices=["trabajador", "asistente_rrhh", "admin_rrhh", "fiscalizador"]
    )


class UpdateUsuarioSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    motivo = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # Campos de trabajador
    nombres = serializers.CharField(max_length=255, required=False)
    apellidos = serializers.CharField(max_length=255, required=False)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    area_trabajador = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tipo_contrato = serializers.ChoiceField(
        required=False,
        allow_null=True,
        allow_blank=True,
        choices=[
            ("contrato_por_obra", "Contrato por obra o faena"),
            ("contrato_plazo_fijo", "Contrato a plazo fijo"),
            ("contrato_part_time", "Contrato part time"),
            ("contrato_indefinido", "Contrato indefinido"),
            ("contrato_para_extranjeros", "Contrato para extranjeros"),
        ],
    )
    correo = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    empresa_id = serializers.IntegerField(required=False)
    turno_id = serializers.IntegerField(required=False, allow_null=True)

    # Asignaciones para asistentes/admin rrhh
    empresas_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )
    empresas_roles = EmpresaRolSerializer(many=True, required=False, allow_empty=True)

    def validate(self, attrs):
        usuario = self.instance
        if not usuario:
            raise serializers.ValidationError({"detail": "Usuario a actualizar no proporcionado"})

        if usuario.rol not in ["trabajador", "asistente_rrhh"]:
            raise serializers.ValidationError(
                {"rol": "Solo trabajadores o asistentes se pueden modificar con este endpoint"}
            )

        if "email" in attrs:
            new_email = attrs["email"]
            if Usuario.objects.exclude(id=usuario.id).filter(email=new_email).exists():
                raise serializers.ValidationError({"email": "El correo ya esta en uso"})

        if not attrs.get("motivo"):
            raise serializers.ValidationError({"motivo": "El motivo es obligatorio para auditoria"})

        empresas_para_asignar = []

        if usuario.rol == "trabajador":
            empresa_id = attrs.get("empresa_id") or (
                usuario.trabajador.empresa_id if usuario.trabajador else None
            )
            if not empresa_id:
                raise serializers.ValidationError({"empresa_id": "empresa_id es requerido"})
            try:
                Empresa.objects.get(id=empresa_id)
            except Empresa.DoesNotExist:
                raise serializers.ValidationError({"empresa_id": "La empresa no existe"})

            if attrs.get("turno_id") is not None:
                try:
                    Turno.objects.get(id=attrs["turno_id"])
                except Turno.DoesNotExist:
                    raise serializers.ValidationError({"turno_id": "Turno no encontrado"})

            empresas_para_asignar.append({"empresa_id": empresa_id, "rol": "trabajador"})
        else:
            empresas_roles = attrs.get("empresas_roles") or []
            empresa_ids = attrs.get("empresas_ids") or []

            for item in empresas_roles:
                empresas_para_asignar.append(
                    {"empresa_id": item["empresa_id"], "rol": item["rol"]}
                )

            empresas_para_asignar.extend(
                {"empresa_id": emp_id, "rol": usuario.rol} for emp_id in empresa_ids
            )

            if empresas_para_asignar:
                empresa_ids_total = [item["empresa_id"] for item in empresas_para_asignar]
                valid_ids = set(
                    Empresa.objects.filter(id__in=empresa_ids_total).values_list("id", flat=True)
                )
                invalid = list(set(empresa_ids_total) - valid_ids)
                if invalid:
                    raise serializers.ValidationError({"empresas_ids": "Empresas invalidas"})

                seen = set()
                deduped = []
                for item in empresas_para_asignar:
                    if item["empresa_id"] in seen:
                        continue
                    seen.add(item["empresa_id"])
                    deduped.append(item)
                empresas_para_asignar = deduped

        attrs["_empresas_para_asignar"] = empresas_para_asignar
        return attrs

    def update(self, usuario, validated_data):
        empresas_para_asignar = validated_data.pop("_empresas_para_asignar", [])
        motivo = validated_data.pop("motivo", None)
        new_password = validated_data.pop("password", None)

        if "email" in validated_data:
            usuario.email = validated_data.pop("email")

        if usuario.rol == "trabajador":
            trabajador = usuario.trabajador
            if not trabajador:
                trabajador = Trabajador.objects.create(
                    rut=usuario.rut,
                    empresa_id=validated_data.get("empresa_id"),
                    nombres=validated_data.get("nombres", ""),
                    apellidos=validated_data.get("apellidos", ""),
                )
                usuario.trabajador = trabajador

            for field in ["nombres", "apellidos", "cargo", "area_trabajador", "tipo_contrato", "correo"]:
                if field in validated_data:
                    setattr(trabajador, field, validated_data[field])

            if "empresa_id" in validated_data:
                trabajador.empresa_id = validated_data["empresa_id"]
            if "turno_id" in validated_data:
                trabajador.turno_id = validated_data["turno_id"]
            trabajador.save()

            if not empresas_para_asignar and trabajador.empresa_id:
                empresas_para_asignar = [{"empresa_id": trabajador.empresa_id, "rol": "trabajador"}]

            EmpresaUsuario.objects.filter(usuario=usuario).delete()
            if empresas_para_asignar:
                EmpresaUsuario.objects.bulk_create(
                    [
                        EmpresaUsuario(
                            usuario=usuario,
                            empresa_id=item["empresa_id"],
                            rol=item["rol"],
                        )
                        for item in empresas_para_asignar
                    ],
                    ignore_conflicts=True,
                )
        else:
            if empresas_para_asignar:
                EmpresaUsuario.objects.filter(usuario=usuario).delete()
                EmpresaUsuario.objects.bulk_create(
                    [
                        EmpresaUsuario(
                            usuario=usuario,
                            empresa_id=item["empresa_id"],
                            rol=item["rol"],
                        )
                        for item in empresas_para_asignar
                    ],
                    ignore_conflicts=True,
                )

        if new_password:
            usuario.password = new_password

        usuario.save()

        empresas_ids = (
            [item["empresa_id"] for item in empresas_para_asignar]
            if empresas_para_asignar
            else list(usuario.empresas_usuario.values_list("empresa_id", flat=True))
        )

        return {
            "usuario": usuario,
            "empresas_ids": empresas_ids,
            "motivo": motivo,
        }


class CrearUsuarioGeneralSerializer(serializers.Serializer):
    rut = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    rol = serializers.ChoiceField(
        choices=["trabajador", "asistente_rrhh", "admin_rrhh", "fiscalizador"]
    )

    nombres = serializers.CharField(max_length=255, required=False)
    apellidos = serializers.CharField(max_length=255, required=False)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    area_trabajador = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tipo_contrato = serializers.ChoiceField(
        required=False,
        allow_null=True,
        allow_blank=True,
        choices=[
            ("contrato_por_obra", "Contrato por obra o faena"),
            ("contrato_plazo_fijo", "Contrato a plazo fijo"),
            ("contrato_part_time", "Contrato part time"),
            ("contrato_indefinido", "Contrato indefinido"),
            ("contrato_para_extranjeros", "Contrato para extranjeros"),
        ],
        default="contrato_indefinido",
    )
    correo = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    empresa_id = serializers.IntegerField(required=False)
    turno_id = serializers.IntegerField(required=False, allow_null=True)
    empresas_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )
    empresas_roles = EmpresaRolSerializer(many=True, required=False, allow_empty=True)

    def validate(self, attrs):
        if Usuario.objects.filter(rut=attrs["rut"]).exists():
            raise serializers.ValidationError({"rut": "El RUT ya esta registrado como usuario"})
        if Usuario.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "El correo ya esta registrado como usuario"})

        empresas_para_asignar = []

        # Trabajador requiere datos minimos
        if attrs["rol"] == "trabajador":
            required = ["nombres", "apellidos", "empresa_id"]
            faltantes = [f for f in required if not attrs.get(f)]
            if faltantes:
                raise serializers.ValidationError(
                    {"detail": f"Faltan campos obligatorios del trabajador: {faltantes}"}
                )
            try:
                Empresa.objects.get(id=attrs["empresa_id"])
            except Empresa.DoesNotExist:
                raise serializers.ValidationError({"empresa_id": "La empresa no existe"})
            if attrs.get("turno_id"):
                try:
                    Turno.objects.get(id=attrs["turno_id"])
                except Turno.DoesNotExist:
                    raise serializers.ValidationError({"turno_id": "Turno no encontrado"})
            empresas_para_asignar.append({"empresa_id": attrs["empresa_id"], "rol": "trabajador"})
        else:
            # Validar empresas asignadas para roles no trabajador
            empresa_ids = attrs.get("empresas_ids") or []
            empresas_roles = attrs.get("empresas_roles") or []

            for item in empresas_roles:
                empresas_para_asignar.append(
                    {"empresa_id": item["empresa_id"], "rol": item["rol"]}
                )

            empresas_para_asignar.extend(
                {"empresa_id": emp_id, "rol": attrs["rol"]} for emp_id in empresa_ids
            )

            empresa_ids_total = [item["empresa_id"] for item in empresas_para_asignar]
            if empresa_ids_total:
                valid_ids = set(
                    Empresa.objects.filter(id__in=empresa_ids_total).values_list("id", flat=True)
                )
                invalid = list(set(empresa_ids_total) - valid_ids)
                if invalid:
                    raise serializers.ValidationError({"empresas_ids": "Empresas invalidas"})

                seen = set()
                deduped = []
                for item in empresas_para_asignar:
                    if item["empresa_id"] in seen:
                        continue
                    seen.add(item["empresa_id"])
                    deduped.append(item)
                empresas_para_asignar = deduped

        attrs["_empresas_para_asignar"] = empresas_para_asignar
        return attrs

    def create(self, data):
        empresas_para_asignar = data.pop("_empresas_para_asignar", [])
        trabajador = None

        if data["rol"] == "trabajador":
            empresa = Empresa.objects.get(id=data["empresa_id"])
            turno = None
            if data.get("turno_id"):
                turno = Turno.objects.get(id=data["turno_id"])

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
                fecha_ingreso=fecha_ingreso,
            )

        usuario = Usuario.objects.create(
            trabajador=trabajador,
            rut=data["rut"],
            email=data["email"],
            rol=data["rol"],
        )
        usuario.password = data["password"]
        usuario.save()

        if empresas_para_asignar:
            relaciones = [
                EmpresaUsuario(usuario=usuario, empresa_id=item["empresa_id"], rol=item["rol"])
                for item in empresas_para_asignar
            ]
            EmpresaUsuario.objects.bulk_create(relaciones, ignore_conflicts=True)

        return {
            "usuario_id": usuario.id,
            "trabajador_id": trabajador.id if trabajador else None,
            "rut": usuario.rut,
            "email": usuario.email,
            "rol": usuario.rol,
            "estado": usuario.estado,
        }
