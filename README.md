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
VITE_MERCADO_PAGO_PUBLIC_KEY=<sua-public-key-de-teste>
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
GET  /api/admin-saas/overview/
GET  /api/gabinetes/
POST /api/gabinetes/<id>/cobrar/
GET  /api/cobrancas/
POST /api/cobrancas/<id>/gerar-pagamento/
POST /api/mercado-pago/webhook/
POST /api/mercado-pago/retorno/
GET  /api/dashboard/
GET  /api/historico/
GET  /api/usuarios/
GET  /api/pessoas/
GET  /api/atendimentos/
GET  /api/encaminhamentos/
GET  /api/oficios/
```

Todos os endpoints administrativos usam JWT:

```txt
Authorization: Bearer <access_token>
```

## Modo SaaS

O sistema possui uma camada de administracao da plataforma:

- `Admin SaaS`: visivel para superusuarios ou usuarios com `is_platform_admin=True`;
- cadastro de gabinetes;
- controle de status da licenca: `teste`, `ativa`, `suspensa`, `expirada`;
- limite de usuarios por gabinete;
- cobrancas e pagamentos por gabinete;
- geracao de link de pagamento pelo Mercado Pago;
- webhook para confirmar pagamento e ativar/renovar licenca;
- liberacao automatica do gabinete quando o Mercado Pago confirmar pagamento aprovado;
- visao geral de usuarios, atendimentos, encaminhamentos e oficios;
- isolamento de dados por gabinete para usuarios comuns.

Novos gabinetes entram por padrao como `suspensa`. O acesso dos usuarios do gabinete so e liberado quando:

- o administrador da plataforma muda a licenca para `teste`; ou
- uma cobranca do Mercado Pago e confirmada como `approved`, ativando automaticamente a licenca por 30 dias.

Para usar Mercado Pago, configure no `backend/.env`:

```txt
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
MERCADO_PAGO_ACCESS_TOKEN=<seu-access-token>
MERCADO_PAGO_PUBLIC_KEY=<sua-public-key>
MERCADO_PAGO_WEBHOOK_URL=https://seudominio.com/api/mercado-pago/webhook/
MERCADO_PAGO_WEBHOOK_SECRET=<chave-secreta-do-webhook>
MERCADO_PAGO_RETURN_URL=https://seudominio.com
```

O backend usa o SDK oficial Python do Mercado Pago, instalado pelo `backend/requirements.txt`:

```bash
pip install -r requirements.txt
```

Em desenvolvimento local, o Mercado Pago so conseguira chamar o webhook se o backend tiver uma URL publica, como um tunnel temporario. Em producao, use a URL HTTPS real do backend.

No painel do Mercado Pago, em `Suas integrações > Webhooks`, configure:

```txt
URL: https://api.seudominio.com/api/mercado-pago/webhook/
Evento: Pagamentos
```

Depois de salvar, copie a chave secreta do webhook para `MERCADO_PAGO_WEBHOOK_SECRET`. Quando essa variavel estiver preenchida, o backend valida o header `x-signature` usando HMAC SHA256 antes de processar a notificacao.

Fluxo do pagamento:

1. Crie uma cobranca em `Admin SaaS`.
2. Clique no botao de cartao da cobranca para gerar o checkout do Mercado Pago.
3. Envie ou abra o link gerado.
4. Quando o Mercado Pago confirmar o pagamento, o webhook marca a cobranca como `paga` e renova a licenca do gabinete por 30 dias.
5. Se o cliente voltar pela URL de retorno, o frontend chama `POST /api/mercado-pago/retorno/` para sincronizar o pagamento imediatamente.
6. Com a cobranca aprovada, o gabinete fica `ativa`, recebe nova data de fim de licenca e o acesso ao sistema e liberado automaticamente.

Também é possível cobrar diretamente pela tabela de gabinetes:

1. Acesse `/admin-saas`.
2. Clique no botão de cobrança do gabinete.
3. Confirme referência, vencimento e valor.
4. O sistema cria a cobrança, gera a preferência no Mercado Pago e abre o modal com o botão Wallet.

Criacao da preferencia de pagamento:

```txt
POST /api/cobrancas/<id>/gerar-pagamento/
```

Esse endpoint cria uma nova `preference` no Mercado Pago para a cobranca informada. A resposta inclui:

```json
{
  "pagamento": {
    "preference_id": "787997534-6dad21a1-6145-4f0d-ac21-66bf7a5e7a58",
    "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
    "sandbox_init_point": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
    "checkout_url": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..."
  }
}
```

O frontend usa `checkout_url` para abrir o Checkout Pro. Em credenciais de teste, o link pode apontar para `sandbox_init_point`; em credenciais de producao, normalmente aponta para `init_point`.

No React, a tela `Admin SaaS` usa o SDK oficial `@mercadopago/sdk-react` para renderizar o botão Wallet do Checkout Pro a partir do `preference_id`. Configure a chave publica no `frontend/.env`:

```txt
VITE_MERCADO_PAGO_PUBLIC_KEY=<sua-public-key>
```

URLs de retorno configuradas na preference:

```txt
success: MERCADO_PAGO_RETURN_URL/pagamentos/retorno/sucesso
failure: MERCADO_PAGO_RETURN_URL/pagamentos/retorno/falha
pending: MERCADO_PAGO_RETURN_URL/pagamentos/retorno/pendente
```

Use um dominio publico com HTTPS em `MERCADO_PAGO_RETURN_URL` quando testar o Checkout Pro fora do ambiente local. O Mercado Pago pode rejeitar `localhost` ou `127.0.0.1` no retorno do checkout.

### Teste de integração do Mercado Pago

Para testar o Checkout Pro antes de usar credenciais de produção:

1. Acesse o painel do Mercado Pago Developers.
2. Entre em `Suas integrações` e selecione a aplicação do sistema.
3. Vá em `Dados da integração > Credenciais de teste`.
4. Copie o `Access Token` de teste para `backend/.env`:

```txt
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
```

5. Copie a `Public Key` de teste para `frontend/.env`:

```txt
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-...
```

6. Em `Contas de teste`, selecione o perfil `Comprador` e anote usuário e senha.
7. Inicie backend e frontend.
8. Acesse `/admin-saas`, crie uma cobrança e clique no botão de cartão.
9. No modal do Mercado Pago, use o botão Wallet ou abra o checkout em nova aba.
10. Faça login no Mercado Pago com a conta comprador de teste e conclua a compra.

Para testar o webhook em desenvolvimento, exponha o backend com uma URL pública HTTPS, por exemplo com Ngrok ou Cloudflare Tunnel, e configure:

```txt
MERCADO_PAGO_WEBHOOK_URL=https://sua-url-publica/api/mercado-pago/webhook/
MERCADO_PAGO_RETURN_URL=https://sua-url-publica-do-frontend
```

Pagamentos criados com credenciais de teste podem depender do simulador de webhook do painel do Mercado Pago para validar o recebimento de notificações. Use `Suas integrações > Webhooks > Simular`, selecione o evento `Pagamentos` e informe o `data.id` do pagamento.

### Compras de teste no Checkout Pro

Use sempre uma janela anônima para compras de teste. Isso evita conflito entre sua conta real, conta vendedor de teste e conta comprador de teste.

Fluxo recomendado:

1. Faça login no sistema em `http://localhost:5173`.
2. Acesse `/admin-saas`.
3. Crie uma cobrança para um gabinete.
4. Clique no botão de cartão para gerar a preferência de pagamento.
5. Use o botão Wallet do Mercado Pago ou abra o checkout em nova aba.
6. Na janela anônima, entre com a conta comprador de teste criada no painel do Mercado Pago.
7. Escolha cartão, Pix ou boleto e conclua o teste.

Cartões de teste:

| Tipo | Bandeira | Número | CVV | Vencimento |
| --- | --- | --- | --- | --- |
| Crédito | Mastercard | `5031 4332 1540 6351` | `123` | `11/30` |
| Crédito | Visa | `4235 6477 2802 5682` | `123` | `11/30` |
| Crédito | American Express | `3753 651535 56885` | `1234` | `11/30` |
| Débito | Elo | `5067 7667 8388 8311` | `123` | `11/30` |

Use estes nomes no titular do cartão para simular resultados:

| Resultado esperado | Nome do titular | CPF |
| --- | --- | --- |
| Pagamento aprovado | `APRO` | `12345678909` |
| Recusado por erro geral | `OTHE` | `12345678909` |
| Pagamento pendente | `CONT` | `12345678909` |
| Recusado para autorizar | `CALL` | `12345678909` |
| Saldo insuficiente | `FUND` | `12345678909` |
| Código de segurança inválido | `SECU` | `12345678909` |
| Data de vencimento inválida | `EXPI` | `12345678909` |
| Erro no formulário | `FORM` | `12345678909` |
| Pagamento duplicado | `DUPL` | `12345678909` |

Para meios offline, como Pix ou boleto, o comportamento esperado é a cobrança ficar como `pendente` até o Mercado Pago confirmar a atualização pelo webhook.

Para criar o primeiro administrador da plataforma:

```bash
cd backend
python manage.py createsuperuser
```

Depois de logar, acesse `/admin-saas`, cadastre o gabinete e associe os usuarios ao gabinete na tela de usuarios.

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

Arquitetura recomendada para este projeto:

```txt
Frontend: Vercel
Backend: Render
Banco: Supabase PostgreSQL
Pagamentos: Mercado Pago
```

### 1. Supabase PostgreSQL

1. Crie um projeto no Supabase.
2. Copie a connection string PostgreSQL em `Project Settings > Database`.
3. Use a string com SSL habilitado. Exemplo:

```txt
postgresql://postgres:<senha>@<host>:5432/postgres?sslmode=require
```

Essa URL será usada no Render como `DATABASE_URL`.

### 2. Mercado Pago

Ative as credenciais de producao no painel do Mercado Pago:

```txt
Mercado Pago Developers > Suas integrações > Dados da integração > Credenciais > Produção
```

Use as credenciais produtivas no lugar das credenciais `TEST-...`:

```txt
MERCADO_PAGO_ACCESS_TOKEN=<access-token-producao>
MERCADO_PAGO_PUBLIC_KEY=<public-key-producao>
VITE_MERCADO_PAGO_PUBLIC_KEY=<public-key-producao>
```

### 3. Backend no Render

O projeto possui um `render.yaml` na raiz. No Render:

1. Crie um novo Blueprint ou Web Service conectado ao repositório GitHub.
2. Se usar configuração manual, selecione:

```txt
Root Directory: backend
Build Command: pip install -r requirements.txt && python manage.py collectstatic --no-input
Start Command: python manage.py migrate && gunicorn config.wsgi:application
```

3. Configure as variáveis de ambiente:

```txt
SECRET_KEY=<chave-forte>
DEBUG=False
ALLOWED_HOSTS=<seu-backend>.onrender.com
CORS_ALLOWED_ORIGINS=https://<seu-frontend>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<seu-frontend>.vercel.app,https://<seu-backend>.onrender.com
FRONTEND_URL=https://<seu-frontend>.vercel.app
BACKEND_URL=https://<seu-backend>.onrender.com
DATABASE_URL=<connection-string-do-supabase>
MERCADO_PAGO_ACCESS_TOKEN=<access-token-producao>
MERCADO_PAGO_PUBLIC_KEY=<public-key-producao>
MERCADO_PAGO_WEBHOOK_URL=https://<seu-backend>.onrender.com/api/mercado-pago/webhook/
MERCADO_PAGO_WEBHOOK_SECRET=<chave-secreta-do-webhook>
MERCADO_PAGO_RETURN_URL=https://<seu-frontend>.vercel.app
```

### 4. Frontend na Vercel

No Vercel:

1. Importe o mesmo repositório.
2. Configure:

```txt
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

3. Configure as variáveis:

```txt
VITE_API_URL=https://<seu-backend>.onrender.com/api
VITE_MERCADO_PAGO_PUBLIC_KEY=<public-key-producao>
```

O arquivo `frontend/vercel.json` já redireciona todas as rotas para `index.html`, então refresh em `/dashboard`, `/admin-saas` e `/pagamentos/retorno/...` não quebra.

### 5. Webhook Mercado Pago

No painel do Mercado Pago, configure o webhook produtivo:

```txt
URL: https://<seu-backend>.onrender.com/api/mercado-pago/webhook/
Evento: Pagamentos
```

Depois copie a chave secreta gerada para:

```txt
MERCADO_PAGO_WEBHOOK_SECRET=<chave-secreta-do-webhook>
```

### 6. Pós-deploy

Depois do primeiro deploy:

1. Verifique se o Render executou `python manage.py migrate`.
2. Crie o primeiro administrador da plataforma no shell do Render:

```bash
python manage.py createsuperuser
```

3. Acesse o frontend na Vercel e faça login.
4. Cadastre um gabinete e gere uma cobrança.
5. Faça uma compra real de baixo valor para validar checkout, retorno e webhook.
6. Meça a qualidade da integração no painel do Mercado Pago, se disponível para sua aplicação.
