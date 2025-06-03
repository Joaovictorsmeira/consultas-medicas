from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from .models import Consulta
import logging

logger = logging.getLogger(__name__)

@shared_task
def enviar_email_async(destinatario, assunto, mensagem):
    """Tarefa assíncrona para envio de emails"""
    try:
        send_mail(
            subject=assunto,
            message=mensagem,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[destinatario],
            fail_silently=False,
        )
        logger.info(f"Email enviado com sucesso para {destinatario}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email para {destinatario}: {str(e)}")
        return False

@shared_task
def lembrete_consultas():
    """Tarefa para enviar lembretes de consultas"""
    try:
        # Buscar consultas para amanhã
        amanha = datetime.now().date() + timedelta(days=1)
        consultas = Consulta.objects.filter(
            data_hora__date=amanha,
            status='agendada'
        )
        
        for consulta in consultas:
            # Lembrete para paciente
            enviar_email_async.delay(
                consulta.paciente.email,
                'Lembrete de Consulta',
                f"""
                Olá {consulta.paciente.get_nome_completo()},
                
                Você tem uma consulta agendada para amanhã:
                
                Médico: Dr(a). {consulta.medico.user.get_nome_completo()}
                Data: {consulta.data_hora.strftime('%d/%m/%Y às %H:%M')}
                Especialidade: {consulta.medico.especialidade}
                
                Não se esqueça!
                """
            )
            
            # Lembrete para médico
            enviar_email_async.delay(
                consulta.medico.user.email,
                'Lembrete de Consulta',
                f"""
                Dr(a). {consulta.medico.user.get_nome_completo()},
                
                Você tem uma consulta agendada para amanhã:
                
                Paciente: {consulta.paciente.get_nome_completo()}
                Data: {consulta.data_hora.strftime('%d/%m/%Y às %H:%M')}
                """
            )
        
        logger.info(f"Lembretes enviados para {consultas.count()} consultas")
        return consultas.count()
        
    except Exception as e:
        logger.error(f"Erro ao enviar lembretes: {str(e)}")
        return 0

@shared_task
def limpar_consultas_antigas():
    """Tarefa para limpar consultas antigas canceladas"""
    try:
        data_limite = datetime.now() - timedelta(days=30)
        consultas_removidas = Consulta.objects.filter(
            status='cancelada',
            updated_at__lt=data_limite
        ).delete()
        
        logger.info(f"Removidas {consultas_removidas[0]} consultas antigas")
        return consultas_removidas[0]
        
    except Exception as e:
        logger.error(f"Erro ao limpar consultas antigas: {str(e)}")
        return 0
