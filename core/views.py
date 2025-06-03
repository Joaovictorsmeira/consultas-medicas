from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from datetime import datetime, timedelta, date
from .models import User, PerfilMedico, DataDisponivel, Consulta, Especialidade
from .services import GerenciadorConsultas, RelatorioConsultas
from .decorators import log_evento
import json
import logging

logger = logging.getLogger(__name__)

def home(request):
    """Página inicial"""
    return render(request, 'core/home.html')

@log_evento('INFO', 'Usuário fazendo login')
def login_view(request):
    """View de login"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            
            # Redirecionar baseado no tipo de usuário
            if user.tipo_usuario == 'medico':
                return redirect('medico_dashboard')
            else:
                return redirect('paciente_dashboard')
        else:
            messages.error(request, 'Credenciais inválidas')
    
    return render(request, 'core/login.html')

@log_evento('INFO', 'Novo usuário se registrando')
def register_view(request):
    """View de registro"""
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        tipo_usuario = request.POST.get('tipo_usuario')
        telefone = request.POST.get('telefone', '')
        
        # Validação especial para médicos
        if tipo_usuario == 'medico':
            senha_medico = request.POST.get('senha_medico')
            if senha_medico != 'admin':
                messages.error(request, 'Senha de autorização para médicos incorreta!')
                especialidades = Especialidade.objects.all()
                return render(request, 'core/register.html', {'especialidades': especialidades})
        
        try:
            # Verificar se usuário já existe
            if User.objects.filter(username=username).exists():
                messages.error(request, 'Nome de usuário já existe')
                especialidades = Especialidade.objects.all()
                return render(request, 'core/register.html', {'especialidades': especialidades})
            
            if User.objects.filter(email=email).exists():
                messages.error(request, 'Email já cadastrado')
                especialidades = Especialidade.objects.all()
                return render(request, 'core/register.html', {'especialidades': especialidades})
            
            # Criar usuário
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                tipo_usuario=tipo_usuario,
                telefone=telefone
            )
            
            # Se for médico, criar perfil médico
            if tipo_usuario == 'medico':
                crm = request.POST.get('crm')
                especialidade_id = request.POST.get('especialidade')
                valor_consulta = request.POST.get('valor_consulta', 0)
                
                if not crm:
                    messages.error(request, 'CRM é obrigatório para médicos')
                    user.delete()
                    especialidades = Especialidade.objects.all()
                    return render(request, 'core/register.html', {'especialidades': especialidades})
                
                if not especialidade_id:
                    messages.error(request, 'Especialidade é obrigatória para médicos')
                    user.delete()
                    especialidades = Especialidade.objects.all()
                    return render(request, 'core/register.html', {'especialidades': especialidades})
                
                try:
                    especialidade = Especialidade.objects.get(id=especialidade_id)
                    
                    PerfilMedico.objects.create(
                        user=user,
                        crm=crm,
                        especialidade=especialidade,
                        valor_consulta=float(valor_consulta) if valor_consulta else 0.00
                    )
                except Especialidade.DoesNotExist:
                    messages.error(request, 'Especialidade selecionada não existe')
                    user.delete()
                    especialidades = Especialidade.objects.all()
                    return render(request, 'core/register.html', {'especialidades': especialidades})
                except ValueError:
                    messages.error(request, 'Valor da consulta deve ser um número válido')
                    user.delete()
                    especialidades = Especialidade.objects.all()
                    return render(request, 'core/register.html', {'especialidades': especialidades})
            
            messages.success(request, 'Usuário criado com sucesso!')
            return redirect('login')
            
        except Exception as e:
            logger.error(f"Erro ao criar usuário: {str(e)}")
            messages.error(request, 'Erro ao criar usuário')
    
    especialidades = Especialidade.objects.all()
    return render(request, 'core/register.html', {'especialidades': especialidades})

def logout_view(request):
    """View de logout"""
    logout(request)
    return redirect('home')

@login_required
@log_evento('INFO', 'Médico acessando dashboard')
def medico_dashboard(request):
    """Dashboard do médico"""
    if request.user.tipo_usuario != 'medico':
        messages.error(request, 'Acesso negado')
        return redirect('home')
    
    try:
        perfil_medico = request.user.perfil_medico
        
        # Consultas próximas
        consultas_proximas = Consulta.objects.filter(
            medico=perfil_medico,
            data_hora__gte=datetime.now(),
            status__in=['agendada', 'confirmada']
        ).order_by('data_hora')[:5]
        
        # Datas disponíveis
        datas_disponiveis = DataDisponivel.objects.filter(
            medico=perfil_medico,
            ativo=True,
            data__gte=date.today()
        ).order_by('data', 'hora_inicio')
        
        # Estatísticas do mês
        inicio_mes = datetime.now().replace(day=1)
        consultas_mes = Consulta.objects.filter(
            medico=perfil_medico,
            data_hora__gte=inicio_mes
        )
        
        context = {
            'perfil_medico': perfil_medico,
            'consultas_proximas': consultas_proximas,
            'datas_disponiveis': datas_disponiveis,
            'total_consultas_mes': consultas_mes.count(),
            'consultas_realizadas_mes': consultas_mes.filter(status='realizada').count(),
        }
        
        return render(request, 'core/medico_dashboard.html', context)
        
    except PerfilMedico.DoesNotExist:
        messages.error(request, 'Perfil médico não encontrado')
        return redirect('home')

@login_required
@log_evento('INFO', 'Paciente acessando dashboard')
def paciente_dashboard(request):
    """Dashboard do paciente"""
    if request.user.tipo_usuario != 'paciente':
        messages.error(request, 'Acesso negado')
        return redirect('home')
    
    # Médicos disponíveis
    medicos = PerfilMedico.objects.select_related('user', 'especialidade').all()
    
    # Consultas do paciente
    consultas = Consulta.objects.filter(
        paciente=request.user
    ).select_related('medico__user', 'medico__especialidade').order_by('-data_hora')
    
    context = {
        'medicos': medicos,
        'consultas': consultas,
    }
    
    return render(request, 'core/paciente_dashboard.html', context)

@login_required
def agendar_consulta(request):
    """View para agendar consulta"""
    if request.method == 'POST':
        medico_id = request.POST.get('medico_id')
        data_hora_str = request.POST.get('data_hora')
        
        try:
            medico = PerfilMedico.objects.get(id=medico_id)
            data_hora = datetime.fromisoformat(data_hora_str.replace('Z', '+00:00'))
            
            # Verificar se o horário está disponível
            data_disponivel = DataDisponivel.objects.filter(
                medico=medico,
                data=data_hora.date(),
                hora_inicio__lte=data_hora.time(),
                hora_fim__gt=data_hora.time(),
                ativo=True
            ).first()
            
            if not data_disponivel:
                messages.error(request, 'Horário não disponível')
                return redirect('paciente_dashboard')
            
            # Verificar se não há conflito
            conflito = Consulta.objects.filter(
                medico=medico,
                data_hora=data_hora,
                status__in=['agendada', 'confirmada']
            ).exists()
            
            if conflito:
                messages.error(request, 'Horário já ocupado')
                return redirect('paciente_dashboard')
            
            # Criar consulta
            Consulta.objects.create(
                medico=medico,
                paciente=request.user,
                data_hora=data_hora,
                valor=medico.valor_consulta
            )
            
            messages.success(request, 'Consulta agendada com sucesso!')
            
        except Exception as e:
            logger.error(f"Erro ao agendar consulta: {str(e)}")
            messages.error(request, 'Erro ao agendar consulta')
    
    return redirect('paciente_dashboard')

@login_required
def cancelar_consulta(request, consulta_id):
    """View para cancelar consulta"""
    try:
        consulta = get_object_or_404(Consulta, id=consulta_id)
        
        # Verificar se o usuário pode cancelar
        if (request.user != consulta.paciente and 
            request.user != consulta.medico.user):
            messages.error(request, 'Você não pode cancelar esta consulta')
            return redirect('home')
        
        consulta.status = 'cancelada'
        consulta.save()
        messages.success(request, 'Consulta cancelada com sucesso!')
            
    except Exception as e:
        logger.error(f"Erro ao cancelar consulta: {str(e)}")
        messages.error(request, 'Erro ao cancelar consulta')
    
    # Redirecionar baseado no tipo de usuário
    if request.user.tipo_usuario == 'medico':
        return redirect('medico_dashboard')
    else:
        return redirect('paciente_dashboard')

@login_required
def gerenciar_agenda(request):
    """View para gerenciar agenda do médico"""
    if request.user.tipo_usuario != 'medico':
        messages.error(request, 'Acesso negado')
        return redirect('home')
    
    try:
        perfil_medico = request.user.perfil_medico
        
        if request.method == 'POST':
            action = request.POST.get('action')
            
            if action == 'add_data':
                data = request.POST.get('data')
                hora_inicio = request.POST.get('hora_inicio')
                hora_fim = request.POST.get('hora_fim')
                
                DataDisponivel.objects.create(
                    medico=perfil_medico,
                    data=data,
                    hora_inicio=hora_inicio,
                    hora_fim=hora_fim
                )
                
                messages.success(request, 'Data disponível adicionada com sucesso!')
            
            elif action == 'update_valor':
                novo_valor = request.POST.get('valor_consulta')
                perfil_medico.valor_consulta = float(novo_valor)
                perfil_medico.save()
                messages.success(request, 'Valor da consulta atualizado!')
            
            elif action == 'update_intervalo':
                novo_intervalo = request.POST.get('intervalo_consulta')
                perfil_medico.intervalo_consulta = int(novo_intervalo)
                perfil_medico.save()
                messages.success(request, 'Intervalo entre consultas atualizado!')
            
            return redirect('gerenciar_agenda')
        
        datas_disponiveis = DataDisponivel.objects.filter(
            medico=perfil_medico,
            data__gte=date.today()
        ).order_by('data', 'hora_inicio')
        
        context = {
            'perfil_medico': perfil_medico,
            'datas_disponiveis': datas_disponiveis,
        }
        
        return render(request, 'core/gerenciar_agenda.html', context)
        
    except PerfilMedico.DoesNotExist:
        messages.error(request, 'Perfil médico não encontrado')
        return redirect('home')

@login_required
def remover_data_disponivel(request, data_id):
    """Remove uma data disponível"""
    if request.user.tipo_usuario != 'medico':
        messages.error(request, 'Acesso negado')
        return redirect('home')
    
    try:
        data_disponivel = get_object_or_404(DataDisponivel, id=data_id, medico__user=request.user)
        
        # Cancelar consultas agendadas para esta data
        consultas_canceladas = Consulta.objects.filter(
            medico=data_disponivel.medico,
            data_hora__date=data_disponivel.data,
            data_hora__time__gte=data_disponivel.hora_inicio,
            data_hora__time__lt=data_disponivel.hora_fim,
            status__in=['agendada', 'confirmada']
        )
        
        count = consultas_canceladas.count()
        consultas_canceladas.update(status='cancelada')
        
        data_disponivel.delete()
        
        if count > 0:
            messages.success(request, f'Data removida e {count} consulta(s) cancelada(s)!')
        else:
            messages.success(request, 'Data removida com sucesso!')
            
    except Exception as e:
        logger.error(f"Erro ao remover data: {str(e)}")
        messages.error(request, 'Erro ao remover data')
    
    return redirect('gerenciar_agenda')

# APIs para AJAX
@login_required
def api_calendario_medico(request, medico_id):
    """API para obter calendário do médico"""
    try:
        medico = PerfilMedico.objects.get(id=medico_id)
        
        # Buscar datas disponíveis dos próximos 60 dias
        hoje = date.today()
        fim = hoje + timedelta(days=60)
        
        datas_disponiveis = DataDisponivel.objects.filter(
            medico=medico,
            data__range=[hoje, fim],
            ativo=True
        ).values('data', 'hora_inicio', 'hora_fim')
        
        calendario = {}
        for data_disp in datas_disponiveis:
            data_str = data_disp['data'].strftime('%Y-%m-%d')
            if data_str not in calendario:
                calendario[data_str] = []
            
            calendario[data_str].append({
                'hora_inicio': data_disp['hora_inicio'].strftime('%H:%M'),
                'hora_fim': data_disp['hora_fim'].strftime('%H:%M')
            })
        
        return JsonResponse({
            'calendario': calendario,
            'intervalo': medico.intervalo_consulta
        })
        
    except PerfilMedico.DoesNotExist:
        return JsonResponse({'error': 'Médico não encontrado'}, status=404)

@login_required
def api_horarios_data(request, medico_id, data):
    """API para obter horários disponíveis de uma data específica"""
    try:
        medico = PerfilMedico.objects.get(id=medico_id)
        data_obj = datetime.strptime(data, '%Y-%m-%d').date()
        
        horarios = medico.get_horarios_disponiveis_data(data_obj)
        
        return JsonResponse({'horarios': horarios})
        
    except PerfilMedico.DoesNotExist:
        return JsonResponse({'error': 'Médico não encontrado'}, status=404)
    except ValueError:
        return JsonResponse({'error': 'Data inválida'}, status=400)
