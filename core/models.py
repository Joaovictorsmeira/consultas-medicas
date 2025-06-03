from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta, time
from .interfaces import UsuarioMixin
import logging

logger = logging.getLogger(__name__)

class User(AbstractUser, UsuarioMixin):
    """Modelo customizado de usuário"""
    
    TIPO_CHOICES = [
        ('medico', 'Médico'),
        ('paciente', 'Paciente'),
    ]
    
    tipo_usuario = models.CharField(max_length=10, choices=TIPO_CHOICES)
    telefone = models.CharField(max_length=15, blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_nome_completo()} ({self.get_tipo_usuario_display()})"

class Especialidade(models.Model):
    """Modelo para especialidades médicas"""
    
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nome
    
    class Meta:
        db_table = 'especialidades'

class PerfilMedico(models.Model):
    """Perfil específico para médicos"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_medico')
    crm = models.CharField(max_length=20, unique=True)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.CASCADE)
    biografia = models.TextField(blank=True)
    valor_consulta = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    intervalo_consulta = models.IntegerField(default=30, help_text="Intervalo entre consultas em minutos")
    
    def __str__(self):
        return f"Dr(a). {self.user.get_nome_completo()} - {self.especialidade}"
    
    def get_horarios_disponiveis_data(self, data):
        """Retorna horários disponíveis para uma data específica"""
        try:
            # Busca a primeira disponibilidade ativa na data
            data_disponivel = self.datas_disponiveis.filter(data=data, ativo=True).first()
            if not data_disponivel:
                return []
            return data_disponivel.gerar_horarios_intervalos()
        except Exception as e:
            logger.error(f"Erro ao obter horários disponíveis: {e}")
            return []
    
    class Meta:
        db_table = 'perfis_medicos'

class DataDisponivel(models.Model):
    """Datas específicas que o médico está disponível"""
    
    medico = models.ForeignKey(PerfilMedico, on_delete=models.CASCADE, related_name='datas_disponiveis')
    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        if self.hora_inicio >= self.hora_fim:
            raise ValidationError('Hora de início deve ser anterior à hora de fim.')
        
        # Validar se a data não é no passado
        if self.data < datetime.now().date():
            raise ValidationError('Não é possível criar disponibilidade para datas passadas.')
    
    def gerar_horarios_intervalos(self):
        """Gera lista de horários disponíveis baseado no intervalo do médico"""
        horarios = []
        intervalo = self.medico.intervalo_consulta
        
        # Converter para datetime para facilitar cálculos
        inicio = datetime.combine(self.data, self.hora_inicio)
        fim = datetime.combine(self.data, self.hora_fim)
        
        # Buscar consultas já agendadas para esta data
        consultas_agendadas = Consulta.objects.filter(
            medico=self.medico,
            data_hora__date=self.data,
            status__in=['agendada', 'confirmada']
        ).values_list('data_hora', flat=True)
        
        horarios_ocupados = [c.time() for c in consultas_agendadas]
        
        # Gerar horários em intervalos
        atual = inicio
        while atual + timedelta(minutes=intervalo) <= fim:
            if atual.time() not in horarios_ocupados:
                horarios.append({
                    'hora': atual.time().strftime('%H:%M'),
                    'disponivel': True,
                    'datetime': atual
                })
            atual += timedelta(minutes=intervalo)
        
        return horarios
    
    def __str__(self):
        return f"{self.medico} - {self.data} ({self.hora_inicio} às {self.hora_fim})"
    
    class Meta:
        db_table = 'datas_disponiveis'
        unique_together = ['medico', 'data', 'hora_inicio']

# Remover modelo HorarioDisponivel antigo e manter apenas DataDisponivel

class Consulta(models.Model):
    """Modelo para consultas agendadas"""
    
    STATUS_CHOICES = [
        ('agendada', 'Agendada'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('realizada', 'Realizada'),
    ]
    
    medico = models.ForeignKey(PerfilMedico, on_delete=models.CASCADE, related_name='consultas')
    paciente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultas_paciente')
    data_hora = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='agendada')
    observacoes = models.TextField(blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        # Validar se a data é futura
        if self.data_hora <= datetime.now():
            raise ValidationError('Data da consulta deve ser futura.')
        
        # Validar se não há conflito de horário
        conflitos = Consulta.objects.filter(
            medico=self.medico,
            data_hora=self.data_hora,
            status__in=['agendada', 'confirmada']
        ).exclude(pk=self.pk)
        
        if conflitos.exists():
            raise ValidationError('Já existe uma consulta agendada para este horário.')
    
    def save(self, *args, **kwargs):
        if not self.valor:
            self.valor = self.medico.valor_consulta
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Consulta: {self.paciente.get_nome_completo()} com {self.medico} em {self.data_hora}"
    
    class Meta:
        db_table = 'consultas'
        ordering = ['-data_hora']
