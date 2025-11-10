from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import Usuario

class UsuarioBackend(BaseBackend):
    def authenticate(self, request, rut=None, password=None, **kwargs):
        try:
            user = Usuario.objects.get(rut=rut)
            if check_password(password, user.password):
                return user
            if user.password == password:
                return user
        except Usuario.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            return None
