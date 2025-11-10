from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate

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

        return data
