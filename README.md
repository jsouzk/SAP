# Sistema de Atendimento Parlamentar

Sistema administrativo para atendimentos, encaminhamentos, oficios, usuarios e historico da Camara Municipal de Iranduba.

## Estrutura

```txt
atendimento_gabinete/
  frontend/   React + Vite + TailwindCSS
  backend/    Django + DRF + JWT + PostgreSQL
```

## Teste local com API e frontend

### 1. Subir o banco PostgreSQL

Opcao recomendada: Docker Desktop instalado e aberto.

```bash
docker compose up -d postgres
```

O banco ficara disponivel em:

```txt
HOST=localhost
PORT=5432
DATABASE=atendimento_gabinete
USER=postgres
PASSWORD=postgres
```

Se preferir instalar manualmente, instale o PostgreSQL, crie um banco chamado `atendimento_gabinete` e confira se os dados batem com `backend/.env`.

### 2. Configurar o backend

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

Login JWT:

```txt
POST http://localhost:8000/api/auth/token/
```

Use o email e senha criados no `createsuperuser`.

### 3. Configurar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend local:

```txt
http://localhost:5173
```

O arquivo `frontend/.env` aponta para:

```txt
VITE_API_URL=http://localhost:8000/api
```

## Arquivos de ambiente

Arquivos reais:

```txt
backend/.env
frontend/.env
```

Esses arquivos ficam no `.gitignore`, pois podem conter senhas e chaves.

Arquivos para enviar a outras maquinas:

```txt
backend/.env.example
frontend/.env.example
```

Em outra maquina, copie o exemplo para `.env` e ajuste as credenciais:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

## Endpoints principais

```txt
POST /api/auth/token/
POST /api/auth/token/refresh/
GET  /api/dashboard/
GET  /api/historico/
GET  /api/usuarios/
GET  /api/atendimentos/
GET  /api/encaminhamentos/
GET  /api/oficios/
```

Todos os endpoints administrativos usam JWT:

```txt
Authorization: Bearer <access_token>
```

## Fluxo para testar

1. Suba o PostgreSQL.
2. Rode migrations no backend.
3. Crie um superusuario.
4. Inicie o backend em `localhost:8000`.
5. Inicie o frontend em `localhost:5173`.
6. Entre no sistema com email e senha do superusuario.
7. Cadastre usuarios.
8. Cadastre atendimento.
9. Gere encaminhamento.
10. Gere oficio e teste PDF/impressao.

## Deploy

Checklist recomendado:

1. Criar um banco PostgreSQL de producao.
2. Configurar `backend/.env` de producao:

```txt
SECRET_KEY=<chave-forte>
DEBUG=False
ALLOWED_HOSTS=seudominio.com,www.seudominio.com
CORS_ALLOWED_ORIGINS=https://seudominio.com
POSTGRES_DB=<banco>
POSTGRES_USER=<usuario>
POSTGRES_PASSWORD=<senha>
POSTGRES_HOST=<host>
POSTGRES_PORT=5432
```

3. Instalar dependencias do backend e rodar:

```bash
python manage.py migrate
python manage.py collectstatic
gunicorn config.wsgi:application
```

4. Configurar o frontend com a URL publica da API:

```txt
VITE_API_URL=https://api.seudominio.com/api
```

5. Gerar build do frontend:

```bash
cd frontend
npm install
npm run build
```

6. Publicar `frontend/dist` em um servidor web ou hospedagem estatica.

Opcoes comuns:

- Backend: VPS com Nginx + Gunicorn, Render, Railway, Fly.io ou servidor institucional.
- Banco: PostgreSQL gerenciado ou PostgreSQL na VPS.
- Frontend: Nginx, Vercel, Netlify ou hospedagem estatica institucional.

Para producao real, tambem configure HTTPS, backups do banco, logs, dominio, firewall e uma politica de senhas.
