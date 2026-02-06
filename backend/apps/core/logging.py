import uuid
from threading import local

_thread_locals = local()

def get_correlation_id():
    return getattr(_thread_locals, 'correlation_id', None)

class CorrelationIdFilter:
    def filter(self, record):
        record.correlation_id = get_correlation_id() or 'unknown'
        return True
