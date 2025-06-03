# 🏥 Sistema Médico - Agendamento de Consultas

Sistema web completo para agendamento de consultas médicas desenvolvido em Django com autenticação JWT, programação orientada a objetos avançada, calendário visual e sistema de intervalos inteligente.

## ✨ Funcionalidades

### 📱 Interface Visual Avançada
- **Calendário Visual**: Datas disponíveis destacadas em verde
- **Seleção de Horários**: Interface intuitiva para escolha de horários
- **Responsivo**: Funciona em dispositivos móveis e desktop
- **Design Moderno**: Interface limpa e profissional

### 👨‍⚕️ Para Médicos
- **Dashboard Completo**: Estatísticas e visão geral das consultas
- **Gerenciamento de Agenda**: Calendário visual para adicionar disponibilidade
- **Intervalos Configuráveis**: Defina intervalos de 15, 30, 45 ou 60 minutos entre consultas
- **Edição de Valores**: Altere o valor da consulta diretamente no dashboard

### 👨‍👩‍👧‍👦 Para Pacientes
- **Visualização de Médicos**: Lista de médicos com especialidades e valores
- **Agendamento Visual**: Calendário com datas disponíveis destacadas
- **Seleção de Horários**: Escolha entre horários disponíveis
- **Histórico de Consultas**: Acompanhamento de consultas agendadas

## 🏗️ Arquitetura

### 🧩 Programação Orientada a Objetos
- **Classes Abstratas**: `AgendamentoInterface` e `NotificacaoInterface`
- **Herança**: `User` herda de `AbstractUser` e `UsuarioMixin`
- **Interfaces/Mixins**: `UsuarioMixin` para funcionalidades comuns
- **Decorator Personalizado**: `@log_evento` para logging automático
- **Classes de Serviço**: `GerenciadorConsultas`, `RelatorioConsultas`

### 🏭 12 Factor App
- ✅ **Codebase**: Código versionado em repositório único
- ✅ **Dependencies**: requirements.txt com todas as dependências
- ✅ **Config**: Variáveis de ambiente em .env
- ✅ **Backing Services**: MySQL, Redis como serviços externos
- ✅ **Build/Release/Run**: Separação clara dos estágios
- ✅ **Processes**: Aplicação stateless
- ✅ **Port Binding**: Configurado para rodar em 0.0.0.0:8000
- ✅ **Concurrency**: Celery para tarefas assíncronas
- ✅ **Disposability**: Inicialização e finalização rápidas
- ✅ **Dev/Prod Parity**: Configuração similar entre ambientes
- ✅ **Logs**: Sistema de logging estruturado
- ✅ **Admin Processes**: Comandos de administração via manage.py

## 🛠️ Tecnologias

- **Backend**: Django 4.2, Django REST Framework
- **Autenticação**: JWT (djangorestframework-simplejwt)
- **Banco de Dados**: MySQL
- **Cache/Queue**: Redis + Celery
- **Frontend**: Bootstrap 5, HTML5, JavaScript
- **Deploy**: Configurado para AWS EC2

## 📋 Pré-requisitos

- Python 3.8+
- MySQL 5.7+
- Redis 6.0+
- Git

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd projeto_consultas_medicas
```

### 2. Crie um ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure o banco de dados MySQL
```sql
CREATE DATABASE medical_system;
CREATE USER 'medical_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON medical_system.* TO 'medical_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure suas variáveis.

### 6. Execute as migrações
```bash
python manage.py makemigrations core
python manage.py makemigrations
python manage.py migrate
```

### 7. Crie dados iniciais
```bash
python manage.py setup_initial_data
python manage.py migrar_horarios
```

### 8. Crie um superusuário
```bash
python manage.py createsuperuser
```

### 9. Inicie o Redis (em terminal separado)
```bash
redis-server
```

### 10. Inicie o Celery (em terminal separado)
```bash
celery -A medical_system worker --loglevel=info
```

### 11. Inicie o servidor Django
```bash
python manage.py runserver 0.0.0.0:8000
```

## 📱 Guia de Uso

### Para Médicos

1. **Login**: Acesse com suas credenciais de médico
2. **Dashboard**: Visualize estatísticas e consultas agendadas
3. **Gerenciar Agenda**:
   - Clique em uma data no calendário
   - Defina horário de início e fim (ex: 09:00 às 12:00)
   - O sistema divide automaticamente em slots conforme o intervalo configurado
4. **Configurações**:
   - Altere o valor da consulta no dashboard
   - Configure o intervalo entre consultas (15, 30, 45 ou 60 minutos)

### Para Pacientes

1. **Login/Cadastro**: Acesse ou crie sua conta
2. **Dashboard**: Visualize médicos disponíveis
3. **Agendamento**:
   - Escolha um médico
   - Selecione uma data disponível (verde) no calendário
   - Escolha um horário disponível
   - Confirme o agendamento
4. **Minhas Consultas**: Acompanhe e gerencie suas consultas



