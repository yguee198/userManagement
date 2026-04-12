import socket
import smtplib
from django.core.mail.backends.smtp import EmailBackend


class FixedSMTPBackend(EmailBackend):
    def open(self):
        # Override hostname before connecting
        self._orig_getfqdn = socket.getfqdn
        socket.getfqdn = lambda: 'localhost'
        try:
            return super().open()
        except Exception:
            socket.getfqdn = self._orig_getfqdn
            raise

    def close(self):
        # Restore original hostname
        if hasattr(self, '_orig_getfqdn'):
            socket.getfqdn = self._orig_getfqdn
        super().close()