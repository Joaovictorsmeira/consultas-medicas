from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('medico/dashboard/', views.medico_dashboard, name='medico_dashboard'),
    path('paciente/dashboard/', views.paciente_dashboard, name='paciente_dashboard'),
    path('agendar/', views.agendar_consulta, name='agendar_consulta'),
    path('cancelar/<int:consulta_id>/', views.cancelar_consulta, name='cancelar_consulta'),
    path('agenda/', views.gerenciar_agenda, name='gerenciar_agenda'),
    path('agenda/remover/<int:data_id>/', views.remover_data_disponivel, name='remover_data_disponivel'),
    
    # APIs AJAX
    path('api/medico/<int:medico_id>/calendario/', views.api_calendario_medico, name='api_calendario_medico'),
    path('api/medico/<int:medico_id>/horarios/<str:data>/', views.api_horarios_data, name='api_horarios_data'),
]
