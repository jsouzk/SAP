from datetime import timedelta
import hashlib
import hmac
from urllib.parse import urlparse

import mercadopago
from django.conf import settings
from django.utils import timezone

from .models import Cobranca, Gabinete


class MercadoPagoError(Exception):
    pass


def _sdk():
    if not settings.MERCADO_PAGO_ACCESS_TOKEN:
        raise MercadoPagoError("Configure MERCADO_PAGO_ACCESS_TOKEN no backend/.env.")

    return mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)


def _response_data(result, expected_statuses):
    status = result.get("status")
    response = result.get("response", {})

    if status not in expected_statuses:
        message = response.get("message") or response.get("error") or str(response)
        raise MercadoPagoError(message)

    return response


def validate_webhook_signature(request):
    secret = settings.MERCADO_PAGO_WEBHOOK_SECRET
    if not secret:
        return True

    signature = request.headers.get("x-signature", "")
    request_id = request.headers.get("x-request-id", "")
    if not signature:
        return False

    signature_parts = {}
    for part in signature.split(","):
        key, _, value = part.partition("=")
        if key and value:
            signature_parts[key.strip()] = value.strip()

    timestamp = signature_parts.get("ts")
    received_hash = signature_parts.get("v1")
    if not timestamp or not received_hash:
        return False

    manifest_parts = []
    data_id = request.query_params.get("data.id")
    if data_id:
        manifest_parts.append(f"id:{data_id};")
    if request_id:
        manifest_parts.append(f"request-id:{request_id};")
    manifest_parts.append(f"ts:{timestamp};")

    manifest = "".join(manifest_parts)
    expected_hash = hmac.new(secret.encode(), msg=manifest.encode(), digestmod=hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_hash, received_hash)


def _payment_return_url(status):
    return f"{settings.MERCADO_PAGO_RETURN_URL.rstrip('/')}/pagamentos/retorno/{status}"


def _backend_url(path):
    return f"{settings.BACKEND_URL.rstrip('/')}{path}"


def _is_public_https_url(url):
    parsed = urlparse(url or "")
    host = parsed.hostname or ""
    return parsed.scheme == "https" and host not in {"localhost", "127.0.0.1", "0.0.0.0"}


def create_checkout_preference(cobranca):
    notification_url = settings.MERCADO_PAGO_WEBHOOK_URL
    if not notification_url:
        notification_url = _backend_url("/api/mercado-pago/webhook/")

    payload = {
        "items": [
            {
                "title": f"Licenca SAP - {cobranca.gabinete.nome} - {cobranca.referencia}",
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": float(cobranca.valor),
            }
        ],
        "payer": {
            "email": cobranca.gabinete.email_responsavel,
        },
        "external_reference": str(cobranca.id),
        "metadata": {
            "cobranca_id": cobranca.id,
            "gabinete_id": cobranca.gabinete_id,
            "referencia": cobranca.referencia,
        },
    }

    if _is_public_https_url(notification_url):
        payload["notification_url"] = notification_url

    if _is_public_https_url(settings.MERCADO_PAGO_RETURN_URL):
        payload["back_urls"] = {
            "success": _payment_return_url("sucesso"),
            "failure": _payment_return_url("falha"),
            "pending": _payment_return_url("pendente"),
        }
        payload["auto_return"] = "approved"

    result = _sdk().preference().create(payload)
    data = _response_data(result, {200, 201})
    checkout_url = data.get("init_point") or data.get("sandbox_init_point") or ""

    cobranca.gateway = "mercadopago"
    cobranca.gateway_payment_id = data.get("id", "")
    cobranca.codigo_pagamento = checkout_url
    cobranca.metodo_pagamento = Cobranca.Metodo.PIX
    cobranca.save(update_fields=["gateway", "gateway_payment_id", "codigo_pagamento", "metodo_pagamento", "atualizado_em"])

    return {
        "preference_id": data.get("id"),
        "init_point": data.get("init_point"),
        "sandbox_init_point": data.get("sandbox_init_point"),
        "checkout_url": checkout_url,
    }


def get_payment(payment_id):
    result = _sdk().payment().get(payment_id)
    return _response_data(result, {200})


def apply_payment_update(payment_data):
    cobranca_id = payment_data.get("external_reference") or payment_data.get("metadata", {}).get("cobranca_id")
    if not cobranca_id:
        return None

    cobranca = Cobranca.objects.select_related("gabinete").filter(id=cobranca_id).first()
    if not cobranca:
        return None

    status = payment_data.get("status")
    payment_method = payment_data.get("payment_method_id") or payment_data.get("payment_type_id") or ""
    payment_id = str(payment_data.get("id") or "")

    if payment_method:
        cobranca.metodo_pagamento = _normalize_payment_method(payment_method)
    if payment_id:
        cobranca.gateway_payment_id = payment_id
    cobranca.gateway = "mercadopago"

    if status == "approved":
        _mark_as_paid(cobranca)
    elif status in {"cancelled", "rejected", "refunded", "charged_back"} and cobranca.status != Cobranca.Status.PAGA:
        cobranca.status = Cobranca.Status.CANCELADA
        cobranca.save(update_fields=["status", "metodo_pagamento", "gateway", "gateway_payment_id", "atualizado_em"])
    else:
        cobranca.save(update_fields=["metodo_pagamento", "gateway", "gateway_payment_id", "atualizado_em"])

    return cobranca


def _mark_as_paid(cobranca):
    today = timezone.localdate()
    base_date = cobranca.gabinete.fim_licenca or today
    if base_date < today:
        base_date = today

    cobranca.status = Cobranca.Status.PAGA
    cobranca.pago_em = today
    cobranca.save(update_fields=["status", "pago_em", "metodo_pagamento", "gateway", "gateway_payment_id", "atualizado_em"])

    gabinete = cobranca.gabinete
    gabinete.status_licenca = Gabinete.StatusLicenca.ATIVA
    gabinete.fim_licenca = base_date + timedelta(days=30)
    gabinete.save(update_fields=["status_licenca", "fim_licenca", "atualizado_em"])


def _normalize_payment_method(value):
    normalized = str(value).lower()
    if "pix" in normalized:
        return Cobranca.Metodo.PIX
    if "bol" in normalized:
        return Cobranca.Metodo.BOLETO
    if "card" in normalized or "credit" in normalized or "debit" in normalized:
        return Cobranca.Metodo.CARTAO
    return Cobranca.Metodo.MANUAL
