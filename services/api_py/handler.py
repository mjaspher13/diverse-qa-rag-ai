from __future__ import annotations

import awsgi

from app import app


def handler(event, context):
    return awsgi.response(app, event, context)
