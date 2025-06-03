from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PerfilMedico, Especialidade, DataDisponivel, Consulta

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'tipo_usuario', 'is_active')
    list_filter = ('tipo_usuario', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {
            'fields': ('tipo_usuario', 'telefone', 'data_nascimento')
        }),
    )

@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ('nome', 'created_at')
    search_fields = ('nome',)

@admin.register(PerfilMedico)
class PerfilMedicoAdmin(admin.ModelAdmin):
    list_display = ('user', 'crm', 'especialidade', 'valor_consulta')
    list_filter = ('especialidade',)
    search_fields = ('user__first_name', 'user__last_name', 'crm')

@admin.register(DataDisponivel)
class DataDisponivelAdmin(admin.ModelAdmin):
    list_display = ('medico', 'data', 'hora_inicio', 'hora_fim', 'ativo')
    list_filter = ('data', 'ativo')
    search_fields = ('medico__user__first_name', 'medico__user__last_name')
    date_hierarchy = 'data'

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ('medico', 'paciente', 'data_hora', 'status', 'valor')
    list_filter = ('status', 'data_hora', 'medico__especialidade')
    search_fields = ('medico__user__first_name', 'paciente__first_name')
    date_hierarchy = 'data_hora'
