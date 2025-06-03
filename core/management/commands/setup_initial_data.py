from django.core.management.base import BaseCommand
from core.models import Especialidade, User, PerfilMedico
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Configura dados iniciais do sistema'

    def handle(self, *args, **options):
        self.stdout.write('Configurando dados iniciais...')
        
        # Criar especialidades
        especialidades_data = [
            {'nome': 'Cardiologia', 'descricao': 'Especialidade médica que se dedica ao diagnóstico e tratamento das doenças que acometem o coração'},
            {'nome': 'Dermatologia', 'descricao': 'Especialidade médica que se dedica ao diagnóstico, tratamento e prevenção de doenças da pele'},
            {'nome': 'Ginecologia', 'descricao': 'Especialidade médica que trata da saúde do aparelho reprodutor feminino'},
            {'nome': 'Neurologia', 'descricao': 'Especialidade médica que trata dos distúrbios estruturais do sistema nervoso'},
            {'nome': 'Ortopedia', 'descricao': 'Especialidade médica que cuida do aparelho locomotor'},
            {'nome': 'Pediatria', 'descricao': 'Especialidade médica dedicada à assistência à criança e ao adolescente'},
            {'nome': 'Psiquiatria', 'descricao': 'Especialidade médica que lida com a prevenção, diagnóstico e tratamento de transtornos mentais'},
            {'nome': 'Urologia', 'descricao': 'Especialidade médica que trata do trato urinário de homens e mulheres'},
            {'nome': 'Clínica Geral', 'descricao': 'Especialidade médica que proporciona atenção contínua e abrangente ao indivíduo'},
            {'nome': 'Oftalmologia', 'descricao': 'Especialidade médica que investiga e trata as doenças relacionadas aos olhos'},
            {'nome': 'Endocrinologia', 'descricao': 'Especialidade médica que cuida dos transtornos das glândulas endócrinas'},
            {'nome': 'Gastroenterologia', 'descricao': 'Especialidade médica que se dedica ao estudo, diagnóstico e tratamento das doenças do aparelho digestivo'},
        ]
        
        for esp_data in especialidades_data:
            especialidade, created = Especialidade.objects.get_or_create(
                nome=esp_data['nome'],
                defaults={'descricao': esp_data['descricao']}
            )
            if created:
                self.stdout.write(f'✓ Especialidade criada: {esp_data["nome"]}')
            else:
                self.stdout.write(f'- Especialidade já existe: {esp_data["nome"]}')
        
        # Criar usuário médico de exemplo
        if not User.objects.filter(username='medico_demo').exists():
            medico_user = User.objects.create(
                username='medico_demo',
                email='medico@exemplo.com',
                first_name='João',
                last_name='Silva',
                tipo_usuario='medico',
                telefone='(11) 99999-9999',
                password=make_password('demo123')
            )
            
            cardiologia = Especialidade.objects.get(nome='Cardiologia')
            PerfilMedico.objects.create(
                user=medico_user,
                crm='12345-DF',
                especialidade=cardiologia,
                valor_consulta=150.00,
                biografia='Médico cardiologista com 10 anos de experiência.'
            )
            
            self.stdout.write('✓ Médico demo criado: medico_demo / demo123')
        else:
            self.stdout.write('- Médico demo já existe')
        
        # Criar usuário paciente de exemplo
        if not User.objects.filter(username='paciente_demo').exists():
            User.objects.create(
                username='paciente_demo',
                email='paciente@exemplo.com',
                first_name='Maria',
                last_name='Santos',
                tipo_usuario='paciente',
                telefone='(11) 88888-8888',
                password=make_password('demo123')
            )
            
            self.stdout.write('✓ Paciente demo criado: paciente_demo / demo123')
        else:
            self.stdout.write('- Paciente demo já existe')
        
        # Mostrar informações importantes
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('DADOS INICIAIS CONFIGURADOS COM SUCESSO!'))
        self.stdout.write('='*50)
        self.stdout.write(f'Total de especialidades: {Especialidade.objects.count()}')
        self.stdout.write(f'Total de usuários: {User.objects.count()}')
        self.stdout.write('\nContas de teste criadas:')
        self.stdout.write('- Médico: medico_demo / demo123')
        self.stdout.write('- Paciente: paciente_demo / demo123')
        self.stdout.write('\nSenha para criar contas médicas: admin')
        self.stdout.write('='*50)
