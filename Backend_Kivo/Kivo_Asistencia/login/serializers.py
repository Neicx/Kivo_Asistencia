from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Marcas, Trabajador

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