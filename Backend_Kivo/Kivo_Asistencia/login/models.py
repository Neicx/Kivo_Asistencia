from django.db import models
from django.utils import timezone
import hashlib
import json
from django.core.exceptions import ValidationError


def canonical_string(data: dict) -> str:
    return json.dumps(
        data,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


class Empresa(models.Model):
    razon_social = models.CharField(max_length=255)
    rut_empresa = models.CharField(max_length=20, unique=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    comuna = models.CharField(max_length=100, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)


class Turno(models.Model):
    nombre = models.CharField(max_length=100)
    hora_entrada = models.TimeField()
    hora_salida = models.TimeField()
    tolerancia_minutos = models.PositiveIntegerField(
        default=0, help_text="Minutos de tolerancia para atrasos"
    )
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="turnos")

    def __str__(self):
        return f"{self.nombre} ({self.hora_entrada} - {self.hora_salida})"


class Trabajador(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, null=True, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    fecha_ingreso = models.DateField(blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    area_trabajador = models.CharField(max_length=100, blank=True, null=True)
    tipo_contrato = models.CharField(
        max_length=50,
        choices=[
            ("contrato_por_obra", "Contrato por obra o faena"),
            ("contrato_plazo_fijo", "Contrato a plazo fijo"),
            ("contrato_part_time", "Contrato part time"),
            ("contrato_indefinido", "Contrato indefinido"),
            ("contrato_para_extranjeros", "Contrato para extranjeros"),
        ],
        default="contrato_indefinido",
        blank=True,
        null=True,
    )
    correo = models.EmailField(blank=True, null=True)
    estado = models.CharField(
        max_length=10, choices=[("activo", "Activo"), ("inactivo", "Inactivo")], default="activo"
    )
    turno = models.ForeignKey(Turno, on_delete=models.SET_NULL, null=True, blank=True)


class Usuario(models.Model):
    trabajador = models.OneToOneField(Trabajador, on_delete=models.PROTECT, null=True, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    rol = models.CharField(
        max_length=20,
        choices=[
            ("trabajador", "Trabajador"),
            ("asistente_rrhh", "Asistente RRHH"),
            ("admin_rrhh", "Admin RRHH"),
            ("fiscalizador", "Fiscalizador"),
        ],
    )
    empresas_asignadas = models.ManyToManyField(
        Empresa,
        through="EmpresaUsuario",
        related_name="usuarios_asignados",
        blank=True,
        help_text="Empresas a las que este usuario puede acceder",
    )
    estado = models.CharField(
        max_length=10, choices=[("activo", "Activo"), ("bloqueado", "Bloqueado")], default="activo"
    )
    creado_en = models.DateTimeField(default=timezone.now)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return self.estado == "activo"

    def tiene_acceso_empresa(self, empresa, roles=None) -> bool:
        if not empresa:
            return False

        empresa_id = getattr(empresa, "id", empresa)
        roles_filtrados = set(roles) if roles else None

        if self.rol == "trabajador":
            if roles_filtrados and "trabajador" not in roles_filtrados:
                return False
            return bool(self.trabajador and self.trabajador.empresa_id == empresa_id)

        relaciones = self.empresas_usuario.filter(empresa_id=empresa_id)
        if roles_filtrados:
            relaciones = relaciones.filter(rol__in=roles_filtrados)

        if relaciones.exists():
            return True

        # fallback: en caso de que el usuario tenga un trabajador asociado en esa empresa
        if roles_filtrados:
            return False
        return bool(self.trabajador and self.trabajador.empresa_id == empresa_id)


class EmpresaUsuario(models.Model):
    ROL_CHOICES = [
        ("trabajador", "Trabajador"),
        ("asistente_rrhh", "Asistente RRHH"),
        ("admin_rrhh", "Admin RRHH"),
        ("fiscalizador", "Fiscalizador"),
    ]

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="empresas_usuario",
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="usuarios_empresa",
    )
    rol = models.CharField(max_length=20, choices=ROL_CHOICES)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("usuario", "empresa")
        verbose_name = "Empresa de Usuario"
        verbose_name_plural = "Empresas de Usuario"

    def __str__(self):
        return f"{self.usuario.rut} - {self.empresa.razon_social} ({self.rol})"


class Marcas(models.Model):
    trabajador = models.ForeignKey(Trabajador, on_delete=models.PROTECT, null=True, blank=True)
    tipo_marca = models.CharField(
        max_length=10, choices=[("entrada", "Entrada"), ("salida", "Salida")]
    )
    timestamp = models.DateTimeField(default=timezone.now)
    hash = models.CharField(max_length=64, editable=False)

    def build_hash_payload(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "rut": self.trabajador.rut if self.trabajador else "",
            "nombres": self.trabajador.nombres if self.trabajador else "",
            "apellidos": self.trabajador.apellidos if self.trabajador else "",
            "tipo_marca": self.tipo_marca,
        }

    def compute_sha256(self) -> str:
        payload = self.build_hash_payload()
        canonical = canonical_string(payload)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def save(self, *args, **kwargs):
        if not self.hash:
            self.hash = self.compute_sha256()
        super().save(*args, **kwargs)


class Licencia(models.Model):
    trabajador = models.ForeignKey("Trabajador", on_delete=models.PROTECT, related_name="licencias")
    tipo = models.CharField(
        max_length=50,
        choices=[
            ("licencia_medica", "Licencia medica"),
            ("permiso_administrativo", "Permiso administrativo"),
            ("permiso_sin_goce", "Permiso sin goce de sueldo"),
        ],
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias = models.PositiveIntegerField(
        blank=True, null=True, help_text="Se calcula automaticamente si no se entrega"
    )
    motivo_detallado = models.TextField(blank=True, null=True)
    archivo = models.FileField(upload_to="licencias_pdfs/", null=True, blank=True)
    estado = models.CharField(
        max_length=20,
        default="pendiente",
        choices=[("pendiente", "Pendiente"), ("aceptado", "Aceptado"), ("rechazado", "Rechazado")],
    )
    creado_por = models.ForeignKey(
        "Usuario",
        on_delete=models.PROTECT,
        related_name="licencias_creadas",
        null=True,
        blank=True,
        help_text="Usuario que creo la licencia (normalmente el trabajador)",
    )
    resuelto_por = models.ForeignKey(
        "Usuario",
        on_delete=models.PROTECT,
        related_name="licencias_resueltas",
        null=True,
        blank=True,
    )
    resuelto_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.fecha_fin and self.fecha_inicio and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({"fecha_fin": "La fecha de fin no puede ser anterior a la fecha de inicio."})

    def save(self, *args, **kwargs):
        self.clean()
        if self.fecha_inicio and self.fecha_fin:
            delta = (self.fecha_fin - self.fecha_inicio).days + 1
            self.dias = max(0, delta)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Licencia #{self.id or '-'} - {self.trabajador} ({self.tipo})"


class Vacaciones(models.Model):
    trabajador = models.ForeignKey(
        Trabajador,
        on_delete=models.PROTECT,
        related_name="vacaciones",
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias = models.PositiveIntegerField(blank=True, null=True)
    estado = models.CharField(
        max_length=20,
        default="pendiente",
        choices=[("pendiente", "Pendiente"), ("aceptado", "Aceptado"), ("rechazado", "Rechazado")],
    )
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name="vacaciones_creadas",
        null=True,
        blank=True,
    )
    resuelto_por = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name="vacaciones_resueltas",
        null=True,
        blank=True,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    resuelto_en = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.fecha_fin and self.fecha_inicio and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({"fecha_fin": "La fecha de fin no puede ser menor a la fecha de inicio."})

    def save(self, *args, **kwargs):
        self.clean()
        if self.fecha_inicio and self.fecha_fin:
            self.dias = (self.fecha_fin - self.fecha_inicio).days + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vacaciones #{self.id or '-'} - {self.trabajador}"


class AuditoriaCambio(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name="acciones_auditoria",
        help_text="Usuario que realizo la accion",
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="auditorias",
    )
    accion = models.CharField(max_length=255)
    modelo_afectado = models.CharField(max_length=100)
    registro_id = models.PositiveIntegerField()
    motivo = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(default=timezone.now)
