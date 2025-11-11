from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from .models import Usuario

class UsuarioJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken("Token inválido: no contiene user_id")

        try:
            user = Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            raise AuthenticationFailed("Usuario no encontrado", code="user_not_found")

        if user.estado != "activo":
            raise AuthenticationFailed("Usuario inactivo o bloqueado", code="user_inactive")

        return user
