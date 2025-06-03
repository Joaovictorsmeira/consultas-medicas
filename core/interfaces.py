from abc import ABC, abstractmethod
from typing import List, Dict, Any

class NotificacaoInterface(ABC):
    """Interface para sistema de notificações"""
    
    @abstractmethod
    def enviar_notificacao(self, destinatario: str, mensagem: str) -> bool:
        pass
    
    @abstractmethod
    def validar_destinatario(self, destinatario: str) -> bool:
        pass

class AgendamentoInterface(ABC):
    """Interface abstrata para sistema de agendamento"""
    
    @abstractmethod
    def agendar(self, medico_id: int, paciente_id: int, data_hora: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def cancelar(self, consulta_id: int) -> bool:
        pass
    
    @abstractmethod
    def listar_disponibilidade(self, medico_id: int) -> List[Dict[str, Any]]:
        pass

class UsuarioMixin:
    """Mixin para funcionalidades comuns de usuário"""
    
    def get_nome_completo(self):
        if hasattr(self, 'first_name') and hasattr(self, 'last_name'):
            return f"{self.first_name} {self.last_name}".strip()
        return str(self)
    
    def is_medico(self):
        return hasattr(self, 'tipo_usuario') and self.tipo_usuario == 'medico'
    
    def is_paciente(self):
        return hasattr(self, 'tipo_usuario') and self.tipo_usuario == 'paciente'
