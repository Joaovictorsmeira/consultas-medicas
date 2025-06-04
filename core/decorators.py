import logging
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)

def log_evento(nivel='INFO', mensagem_personalizada=None):
    """
    Decorator personalizado para log de eventos
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            
            # Log de início
            mensagem = mensagem_personalizada or f"Executando {func.__name__}"
            getattr(logger, nivel.lower())(f"[INÍCIO] {mensagem}")
            
            # DEBUG: logar parâmetros
            logger.debug(f"[DEBUG] {func.__name__} chamado com args={args}, kwargs={kwargs}")
            
            try:
                result = func(*args, **kwargs)
                
                # Log de sucesso
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                logger.info(f"[SUCESSO] {func.__name__} executado em {duration:.2f}s")
                
                return result
                
            except Exception as e:
                # Log de erro
                logger.error(f"[ERRO] {func.__name__}: {str(e)}")
                
                # CRITICAL: log extra para falha grave
                logger.critical(f"[CRITICAL] Falha crítica na execução de {func.__name__}: {str(e)}")
                
                raise
                
        return wrapper
    return decorator
