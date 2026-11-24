import os
from pathlib import Path

from core.env import env_choice, env_int, env_str

LLM_EFFORT_LEVELS = ("low", "medium", "high", "xhigh", "max")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG") == "true"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost").split(",")
CSRF_TRUSTED_ORIGINS = [o for o in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "council",
    "simulation",
    "ai",  # M4/03
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

STATIC_URL = "/api/static/"

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["POSTGRES_DB"],
        "USER": os.environ["POSTGRES_USER"],
        "PASSWORD": os.environ["POSTGRES_PASSWORD"],
        "HOST": os.environ.get("POSTGRES_HOST", "db"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        "OPTIONS": {"options": "-c search_path=app,public"},
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "America/New_York"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["core.authentication.AuthServiceJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["core.permissions.IsWorkspaceMember"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "UNAUTHENTICATED_USER": None,
    "EXCEPTION_HANDLER": "core.exceptions.exception_handler",
}

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ISSUER = os.environ.get("JWT_ISSUER", "seventh-vote-auth")
JWT_AUDIENCE = os.environ.get("JWT_AUDIENCE", "seventh-vote")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://auth:4000").rstrip("/")

# --- M4: AI simulation. Deployment configuration only; defaults are the values the app was built with. ---
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or None
LLM_MODEL = env_str("LLM_MODEL", "claude-opus-5-5")
LLM_EFFORT = env_choice("LLM_EFFORT", "medium", LLM_EFFORT_LEVELS)
# Output budget for one member's answer, shared by thinking and the JSON answer; the answer is cut off
# (and the run fails) if it runs out, so it must leave room for thinking at the configured LLM_EFFORT.
LLM_MAX_TOKENS = env_int("LLM_MAX_TOKENS", 16000, minimum=2048, maximum=64000)

# Local embedding model (fastembed). Its vector size must match ai.models.DossierEmbedding.embedding;
# ai.embeddings checks this when it loads the model.
EMBEDDING_MODEL = env_str("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
EMBEDDING_CACHE_DIR = env_str("EMBEDDING_CACHE_DIR", "/models")

# Dossier pieces retrieved per member and sent to Claude as evidence.
SIMULATION_EVIDENCE_COUNT = env_int("SIMULATION_EVIDENCE_COUNT", 6, minimum=1, maximum=20)
# Members whose Claude calls run at the same time in one simulation.
SIMULATION_MAX_WORKERS = env_int("SIMULATION_MAX_WORKERS", 13, minimum=1, maximum=32)
# Wall-clock budget for one simulation, Claude retries included. Kept below gunicorn's --timeout (300 in
# services/api/Dockerfile): a run that outlives the worker would be killed before it is saved as failed.
SIMULATION_TIMEOUT_SECONDS = env_int("SIMULATION_TIMEOUT_SECONDS", 270, minimum=30, maximum=280)
