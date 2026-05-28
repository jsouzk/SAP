# Sistema de Atendimento Parlamentar

Sistema administrativo para atendimentos, encaminhamentos, oficios, usuarios, historico, auditoria e controle de gabinetes da Camara Municipal de Iranduba.

## Estrutura

```txt
atendimento_gabinete/
  frontend/   React + Vite + Tailwind CSS
  backend/    Django + Django REST Framework + JWT + PostgreSQL
```

## Principais recursos

- Dashboard administrativo
- Cadastro de pessoas atendidas
- Registro de atendimentos
- Controle de encaminhamentos
- Geracao e acompanhamento de oficios
- Gestao de usuarios por gabinete
- Historico e auditoria de movimentacoes
- Relatorios, pendencias, comentarios e anexos
- Controle manual de licencas de gabinetes
- Administracao SaaS para superusuarios da plataforma

## Teste local

### 1. Banco PostgreSQL

```bash
docker compose up -d postgres
```

Banco local padrao:

```txt
HOST=localhost
PORT=5432
DATABASE=atendimento_gabinete
USER=postgres
PASSWORD=postgres
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API local:

```txt
http://localhost:8000/api
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend local:

```txt
http://localhost:5173
```

## Variaveis de ambiente

Backend:

```txt
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
DATABASE_URL=
```

Frontend:

```txt
VITE_API_URL=http://localhost:8000/api
```

## Endpoints principais

```txt
POST /api/auth/token/
POST /api/auth/token/refresh/
GET  /api/auth/me/
GET  /api/admin-saas/overview/
GET  /api/gabinetes/
POST /api/gabinetes/<id>/renovar/
POST /api/gabinetes/<id>/teste/
POST /api/gabinetes/<id>/suspender/
GET  /api/dashboard/
GET  /api/historico/
GET  /api/usuarios/
GET  /api/pessoas/
GET  /api/atendimentos/
GET  /api/encaminhamentos/
GET  /api/oficios/
GET  /api/relatorios/
GET  /api/pendencias/
```

Todos os endpoints administrativos usam JWT ou cookies HTTP-only configurados pela API.

## Admin SaaS

O sistema possui uma camada de administracao da plataforma:

- cadastro de gabinetes;
- controle manual de status da licenca: `teste`, `ativa`, `suspensa`, `expirada`;
- renovacao manual por 30, 90 ou 365 dias;
- limite de usuarios por gabinete;
- visao geral de usuarios, atendimentos, encaminhamentos e oficios;
- isolamento de dados por gabinete para usuarios comuns.

Novos gabinetes entram por padrao como `suspensa`. O acesso dos usuarios do gabinete e liberado quando um administrador da plataforma ativa teste ou renova a licenca.

## Deploy

### Backend

Configure um banco PostgreSQL em producao e defina:

```txt
SECRET_KEY=<chave-forte>
DEBUG=False
ALLOWED_HOSTS=<dominio-do-backend>
CORS_ALLOWED_ORIGINS=<dominio-do-frontend>
CSRF_TRUSTED_ORIGINS=<dominio-do-frontend>,<dominio-do-backend>
FRONTEND_URL=<dominio-do-frontend>
BACKEND_URL=<dominio-do-backend>
DATABASE_URL=<connection-string-postgresql>
```

Comandos esperados:

```bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
gunicorn config.wsgi:application
```

### Frontend

Configure:

```txt
VITE_API_URL=<dominio-do-backend>/api
```

Build:

```bash
npm install
npm run build
```

## Pos-deploy

1. Rode as migrations no backend.
2. Crie o primeiro superusuario.
3. Acesse o Admin SaaS e cadastre o primeiro gabinete.
4. Vincule usuarios aos gabinetes.
5. Ative teste ou renove manualmente a licenca do gabinete.
