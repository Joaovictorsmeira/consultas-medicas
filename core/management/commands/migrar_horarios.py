from django.core.management.base import BaseCommand
from core.models import PerfilMedico, DataDisponivel
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Migra dados de horários antigos para o novo sistema de datas disponíveis'

    def handle(self, *args, **options):
        self.stdout.write('Migrando para o novo sistema de datas disponíveis...')
        
        # Para cada médico, criar algumas datas de exemplo
        medicos = PerfilMedico.objects.all()
        
        for medico in medicos:
            self.stdout.write(f'Processando médico: {medico.user.get_full_name()}')
            
            # Criar datas disponíveis para os próximos 30 dias (apenas dias úteis)
            hoje = date.today()
            
            for i in range(30):
                data_atual = hoje + timedelta(days=i)
                
                # Apenas dias úteis (segunda a sexta)
                if data_atual.weekday() < 5:  # 0-4 = segunda a sexta
                    # Verificar se já existe
                    if not DataDisponivel.objects.filter(medico=medico, data=data_atual).exists():
                        # Criar disponibilidade manhã (9h às 12h)
                        DataDisponivel.objects.create(
                            medico=medico,
                            data=data_atual,
                            hora_inicio='09:00',
                            hora_fim='12:00'
                        )
                        
                        # Criar disponibilidade tarde (14h às 17h)
                        DataDisponivel.objects.create(
                            medico=medico,
                            data=data_atual,
                            hora_inicio='14:00',
                            hora_fim='17:00'
                        )
                        
                        self.stdout.write(f'  ✓ Criada disponibilidade para {data_atual}')
        
        self.stdout.write(self.style.SUCCESS('Migração concluída com sucesso!'))
