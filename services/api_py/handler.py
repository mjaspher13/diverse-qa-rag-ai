from __future__ import annotations

import awsgi

from app import app


def handler(event, context):
    # Adapter for API Gateway -> Flask (WSGI)
    return awsgi.response(app, event, context)
