from django.db import models
from django.utils import timezone

# Create your models here.
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
    tolerancia_minutos = models.PositiveIntegerField(default=0, help_text="Minutos de tolerancia para atrasos")
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="turnos")

    def __str__(self):
        return f"{self.nombre} ({self.hora_entrada} - {self.hora_salida})"

class Trabajador(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, null=True, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    nombres= models.CharField(max_length=255)
    apellidos= models.CharField(max_length=255)
    fecha_ingreso = models.DateField(blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    area_trabajador = models.CharField(max_length=100, blank=True, null=True)
    tipo_contrato = models.CharField(max_length=50, choices=[("contrato_por_obra","Contrato por obra o faena"),("contrato_plazo_fijo","Contrato a plazo fijo"),("contrato_part_time","Contrato part time"),("contrato_indefinido","Contrato indefinido"),("contrato_para_extranjeros","Contrato para extranjeros"),], default="contrato_indefinido", blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    estado = models.CharField(max_length=10, choices=[("activo", "Activo"), ("inactivo", "Inactivo")], default="activo")
    turno = models.ForeignKey(Turno, on_delete=models.SET_NULL, null=True, blank=True)

class Usuario(models.Model):
    trabajador = models.OneToOneField(Trabajador, on_delete=models.PROTECT, null=True, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    rol = models.CharField(max_length=20,choices=[("trabajador", "Trabajador"),("asistente_rrhh", "Asistente RRHH"),("admin_rrhh", "Admin RRHH"),("fiscalizador", "Fiscalizador"),])
    estado = models.CharField(max_length=10, choices=[("activo", "Activo"), ("bloqueado", "Bloqueado")],default="activo")
    creado_en = models.DateTimeField(default=timezone.now)

class Marcas(models.Model):
    trabajador = models.ForeignKey(Trabajador,on_delete=models.PROTECT,null=True, blank=True)
    tipo_marca = models.CharField(max_length=10, choices=[("entrada", "Entrada"), ("salida", "Salida")])
    timestamp = models.DateTimeField(default=timezone.now)

class Licencia(models.Model):
    trabajador = models.ForeignKey(Trabajador, on_delete=models.PROTECT, related_name="licencias")
    tipo = models.CharField(
        max_length=50,
        choices=[
            ("licencia_medica", "Licencia médica"),
            ("permiso_administrativo", "Permiso administrativo"),
            ("permiso_sin_goce", "Permiso sin goce de sueldo"),
        ]
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias = models.PositiveIntegerField()
    motivo_detallado = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="licencias_creadas")
    creado_en = models.DateTimeField(default=timezone.now)

class Vacaciones(models.Model):
    trabajador = models.ForeignKey(Trabajador, on_delete=models.PROTECT, related_name="vacaciones")
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias = models.PositiveIntegerField()
    aprobado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT, null=True, blank=True)
    creado_en = models.DateTimeField(default=timezone.now)
class AuditoriaCambio(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name="acciones_auditoria",
        help_text="Usuario que realizó la acción"
    )
    accion = models.CharField(max_length=255)
    modelo_afectado = models.CharField(max_length=100)
    registro_id = models.PositiveIntegerField()
    motivo = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(default=timezone.now)