from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Marcas , Trabajador
from .serializers import MarcaSerializer, TrabajadorProfileSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class AsistenciasListView(ListAPIView):
    queryset = Marcas.objects.select_related("trabajador").order_by("-timestamp")
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]

class TrabajadorProfileView(RetrieveAPIView):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorProfileSerializer
    permission_classes = [IsAuthenticated]