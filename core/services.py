from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import User, PerfilMedico, DataDisponivel, Consulta
from .interfaces import AgendamentoInterface, NotificacaoInterface
from .decorators import log_evento
import logging

logger = logging.getLogger(__name__)

class NotificacaoEmail(NotificacaoInterface):
    """Implementação de notificação por email"""
    
    def validar_destinatario(self, destinatario: str) -> bool:
        return '@' in destinatario and '.' in destinatario
    
    @log_evento('INFO', 'Enviando notificação por email')
    def enviar_notificacao(self, destinatario: str, mensagem: str) -> bool:
        try:
            if not self.validar_destinatario(destinatario):
                logger.warning(f"Email inválido: {destinatario}")
                return False
            
            send_mail(
                subject='Sistema Médico - Notificação',
                message=mensagem,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[destinatario],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar email: {str(e)}")
            return False

class GerenciadorConsultas(AgendamentoInterface):
    """Classe para gerenciar consultas médicas"""
    
    def __init__(self):
        self.notificador = NotificacaoEmail()
    
    @log_evento('INFO', 'Agendando nova consulta')
    def agendar(self, medico_id: int, paciente_id: int, data_hora: str) -> Dict[str, Any]:
        try:
            medico = PerfilMedico.objects.get(id=medico_id)
            paciente = User.objects.get(id=paciente_id, tipo_usuario='paciente')
            
            data_consulta = datetime.fromisoformat(data_hora)
            
            # Verificar disponibilidade
            if not self._verificar_disponibilidade(medico, data_consulta):
                return {
                    'sucesso': False,
                    'erro': 'Horário não disponível'
                }
            
            # Criar consulta
            consulta = Consulta.objects.create(
                medico=medico,
                paciente=paciente,
                data_hora=data_consulta,
                valor=medico.valor_consulta
            )
            
            # Enviar notificações
            self._enviar_notificacoes_agendamento(consulta)
            
            return {
                'sucesso': True,
                'consulta_id': consulta.id,
                'data_hora': consulta.data_hora.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao agendar consulta: {str(e)}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    @log_evento('WARNING', 'Cancelando consulta')
    def cancelar(self, consulta_id: int) -> bool:
        try:
            consulta = Consulta.objects.get(id=consulta_id)
            
            if consulta.status == 'cancelada':
                return False
            
            consulta.status = 'cancelada'
            consulta.save()
            
            # Enviar notificações
            self._enviar_notificacoes_cancelamento(consulta)
            
            return True
            
        except Consulta.DoesNotExist:
            logger.error(f"Consulta {consulta_id} não encontrada")
            return False
        except Exception as e:
            logger.error(f"Erro ao cancelar consulta: {str(e)}")
            return False
    
    def listar_disponibilidade(self, medico_id: int) -> List[Dict[str, Any]]:
        try:
            medico = PerfilMedico.objects.get(id=medico_id)
            datas = DataDisponivel.objects.filter(
                medico=medico,
                data__gte=datetime.now().date(),
                ativo=True
            )
            
            disponibilidade = []
            for data in datas:
                disponibilidade.append({
                    'data': data.data.strftime('%Y-%m-%d'),
                    'dia_nome': data.data.strftime('%A'),
                    'hora_inicio': data.hora_inicio.strftime('%H:%M'),
                    'hora_fim': data.hora_fim.strftime('%H:%M')
                })
            
            return disponibilidade
            
        except Exception as e:
            logger.error(f"Erro ao listar disponibilidade: {str(e)}")
            return []
    
    def _verificar_disponibilidade(self, medico: PerfilMedico, data_hora: datetime) -> bool:
        """Verifica se o médico está disponível no horário solicitado"""
        data = data_hora.date()
        hora = data_hora.time()
        
        # Verificar se existe data disponível
        data_disponivel = DataDisponivel.objects.filter(
            medico=medico,
            data=data,
            hora_inicio__lte=hora,
            hora_fim__gt=hora,
            ativo=True
        ).exists()
        
        if not data_disponivel:
            return False
        
        # Verificar se não há consulta conflitante
        consulta_conflitante = Consulta.objects.filter(
            medico=medico,
            data_hora=data_hora,
            status__in=['agendada', 'confirmada']
        ).exists()
        
        return not consulta_conflitante
    
    def _enviar_notificacoes_agendamento(self, consulta: Consulta):
        """Envia notificações de agendamento"""
        # Notificar paciente
        mensagem_paciente = f"""
        Consulta agendada com sucesso!
        
        Médico: Dr(a). {consulta.medico.user.get_nome_completo()}
        Data: {consulta.data_hora.strftime('%d/%m/%Y às %H:%M')}
        Especialidade: {consulta.medico.especialidade}
        """
        
        self.notificador.enviar_notificacao(
            consulta.paciente.email,
            mensagem_paciente
        )
        
        # Notificar médico
        mensagem_medico = f"""
        Nova consulta agendada!
        
        Paciente: {consulta.paciente.get_nome_completo()}
        Data: {consulta.data_hora.strftime('%d/%m/%Y às %H:%M')}
        """
        
        self.notificador.enviar_notificacao(
            consulta.medico.user.email,
            mensagem_medico
        )
    
    def _enviar_notificacoes_cancelamento(self, consulta: Consulta):
        """Envia notificações de cancelamento"""
        mensagem = f"""
        Consulta cancelada.
        
        Médico: Dr(a). {consulta.medico.user.get_nome_completo()}
        Paciente: {consulta.paciente.get_nome_completo()}
        Data: {consulta.data_hora.strftime('%d/%m/%Y às %H:%M')}
        """
        
        self.notificador.enviar_notificacao(consulta.paciente.email, mensagem)
        self.notificador.enviar_notificacao(consulta.medico.user.email, mensagem)

class RelatorioConsultas:
    """Classe para gerar relatórios de consultas"""
    
    @log_evento('INFO', 'Gerando relatório de consultas')
    def gerar_relatorio_medico(self, medico_id: int, data_inicio: datetime, data_fim: datetime) -> Dict[str, Any]:
        try:
            medico = PerfilMedico.objects.get(id=medico_id)
            
            consultas = Consulta.objects.filter(
                medico=medico,
                data_hora__range=[data_inicio, data_fim]
            )
            
            total_consultas = consultas.count()
            consultas_realizadas = consultas.filter(status='realizada').count()
            consultas_canceladas = consultas.filter(status='cancelada').count()
            receita_total = sum(c.valor or 0 for c in consultas.filter(status='realizada'))
            
            return {
                'medico': medico.user.get_nome_completo(),
                'periodo': f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}",
                'total_consultas': total_consultas,
                'consultas_realizadas': consultas_realizadas,
                'consultas_canceladas': consultas_canceladas,
                'receita_total': float(receita_total),
                'taxa_realizacao': (consultas_realizadas / total_consultas * 100) if total_consultas > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {str(e)}")
            return {}
