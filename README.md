# Barber Shop Booking API

API para gestão de reservas de uma barbearia, desenvolvida com NestJS e PostgreSQL. O sistema permite gerir utilizadores, barbeiros, serviços de corte e reservas, utilizando RabbitMQ para processamento assíncrono de eventos e envio de notificações.

O projecto explora conceitos de Backend Development e System Design, incluindo mensageria, Outbox Pattern, processamento assíncrono, persistência de dados e containerização com Docker.

## 1. Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| Node.js 24 | Runtime JavaScript |
| NestJS | Framework backend |
| TypeScript | Linguagem de desenvolvimento |
| PostgreSQL | Base de dados relacional |
| Supabase | Hospedagem do PostgreSQL |
| RabbitMQ | Message Broker |
| @golevelup/nestjs-rabbitmq | Integração RabbitMQ com NestJS |
| Docker | Containerização |
| Docker Compose | Orquestração dos serviços |
| GitHub Actions | Integração contínua (CI) |
| Render | Hospedagem da API e Worker |

## 2. Arquitectura do sistema

O sistema segue uma arquitectura orientada a eventos para processar notificações sem bloquear o fluxo principal de criação de reservas.

### Fluxo de funcionamento

1. O cliente solicita uma reserva através da API.
2. A API valida os dados e regista a reserva no PostgreSQL.
3. Na mesma transação, é criado um evento na tabela `outbox_events`.
4. O Outbox Publisher identifica eventos ainda não publicados.
5. Os eventos são publicados no RabbitMQ.
6. O Notifications Consumer recebe os eventos.
7. O Notifications Service processa a notificação e regista-a na base de dados.
8. O sistema pode encaminhar a notificação para o canal de comunicação configurado.

### Outbox Pattern

O Outbox Pattern é utilizado para evitar inconsistências entre a persistência da reserva e a publicação de eventos.

Em vez de gravar uma reserva e publicar diretamente no RabbitMQ dentro do mesmo fluxo HTTP, a aplicação grava a reserva e o respetivo evento na mesma transação PostgreSQL.

Desta forma, se o RabbitMQ estiver temporariamente indisponível, o evento permanece na tabela `outbox_events` e poderá ser publicado posteriormente.

**Exemplo simplificado:**

```text
Booking Request
      |
      v
PostgreSQL Transaction
      |
      +---- Create Booking
      |
      +---- Create Outbox Event
      |
      v
Outbox Publisher
      |
      v
RabbitMQ
      |
      v
Notifications Consumer
      |
      v
Notifications Service
      |
      v
Notification Storage
```

## 3. Estrutura da base de dados

A aplicação utiliza PostgreSQL com UUIDs como identificadores principais e timestamps com timezone para representar datas e horas.

### 3.1. Users

Armazena os utilizadores registados na plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador do utilizador |
| username | TEXT | Nome de utilizador |
| email | TEXT | Email único |
| password | TEXT | Password armazenada de forma segura através de hash |
| contato | TEXT | Contacto telefónico |
| role | USER-DEFINED | Papel do utilizador |
| timezone | VARCHAR | Fuso horário do utilizador |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

O timezone permite interpretar corretamente as datas e horas das reservas de acordo com a localização do utilizador.

Valor padrão: `Africa/Maputo`.

### 3.2. Barbers

Armazena os barbeiros disponíveis na plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador do barbeiro |
| name | TEXT | Nome do barbeiro |
| user_id | UUID | Referência ao utilizador associado |

Relacionamento:

- Um utilizador pode estar associado a um registo de barbeiro.
- Cada barbeiro está associado a um utilizador através de `user_id`.

### 3.3. Stylist

Armazena os serviços ou estilos de corte disponibilizados pela barbearia.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador do serviço |
| cut_name | TEXT | Nome do corte |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

Exemplos de serviços:
- Low Fade
- Mid Fade
- High Fade
- Corte tradicional

### 3.4. Reservas

Armazena as reservas realizadas pelos utilizadores.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador da reserva |
| user_id | UUID | Utilizador que realizou a reserva |
| barber_id | UUID | Barbeiro selecionado |
| cut_id | UUID | Serviço de corte selecionado |
| scheduled_at | TIMESTAMPTZ | Data e hora agendadas |
| status_att | USER-DEFINED | Estado da reserva |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

Relacionamentos:
- Uma reserva pertence a um utilizador.
- Uma reserva pertence a um barbeiro.
- Uma reserva referencia um serviço de corte.

O campo `scheduled_at` utiliza `TIMESTAMPTZ`, permitindo armazenar instantes temporais de forma consistente, independentemente do timezone do utilizador.

### 3.5. Outbox Events

Armazena os eventos que devem ser publicados no RabbitMQ.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador do evento |
| event_type | VARCHAR | Tipo de evento |
| payload | JSONB | Dados associados ao evento |
| created_at | TIMESTAMPTZ | Data de criação |
| published_at | TIMESTAMPTZ | Data de publicação |

O campo `published_at` permite identificar eventos que ainda aguardam publicação.

Exemplo de evento:

```json
{
  "eventId": "uuid",
  "eventType": "booking.created",
  "payload": {
    "bookingId": "uuid",
    "userId": "uuid",
    "barberId": "uuid",
    "scheduledAt": "2026-11-27T13:00:00.000Z"
  }
}
```

### 3.6. Notifications

Armazena as notificações geradas pelo processamento dos eventos.

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | Identificador da notificação |
| event_id | UUID | Identificador único do evento processado |
| user_id | UUID | Destinatário |
| title | VARCHAR | Título da notificação |
| message | TEXT | Conteúdo da notificação |
| is_read | BOOLEAN | Indica se foi visualizada |
| created_at | TIMESTAMPTZ | Data de criação |

A restrição UNIQUE sobre `event_id` ajuda a impedir a criação de notificações duplicadas para o mesmo evento.

## 4. Relacionamentos

Representação simplificada das relações entre as tabelas:

```text
USERS
  |
  +------ BARBERS
  |          |
  |          |
  |       RESERVAS
  |          |
  +----------+
             |
          STYLIST

USERS
  |
  +------ NOTIFICATIONS

OUTBOX_EVENTS
  |
  +------ (event_id lógico) NOTIFICATIONS
```

Nota: `notifications.event_id` possui uma restrição UNIQUE, mas o schema atual não declara uma foreign key para `outbox_events`.

## 5. Pré-requisitos

Antes de executar o projecto, certifica-te de que tens instalado:

- Node.js 24 ou superior compatível com o projecto.
- npm.
- Docker Desktop.
- Docker Compose.
- Git.
- Uma instância PostgreSQL, local ou Supabase.

Não é necessário instalar RabbitMQ manualmente quando utilizas Docker Compose.

## 6. Instalação e execução local

### 6.1. Clonar o repositório

```bash
git clone <REPOSITORY_URL>

cd <PROJECT_DIRECTORY>
```

### 6.2. Instalar dependências

```bash
npm install
```

### 6.3. Configurar variáveis de ambiente

Cria um ficheiro `.env` na raiz do projecto:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://...

# RabbitMQ
RABBIIMQ_URI=amqp://appuser:apppassword@localhost:5672
```

**Importante:** o nome `RABBIIMQ_URI` deve corresponder exatamente ao nome utilizado no código actual. Recomenda-se uniformizar futuramente para `RABBITMQ_URI`.

Nunca publiques o ficheiro `.env` no GitHub.

### 6.4. Executar a aplicação

```bash
npm run start:dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

## 7. Docker

O projecto utiliza Docker para garantir um ambiente de execução consistente, independentemente da máquina onde a aplicação é executada.


Este Dockerfile utiliza multi-stage builds para separar a compilação da execução em produção, evitando incluir dependências de desenvolvimento na imagem final.

**Nota:** confirma o caminho de saída do teu build NestJS. Se a compilação gerar `dist/src/main.js`, ajusta o comando de inicialização.


### 7.1. Docker Compose

O Docker Compose permite executar os serviços necessários ao ambiente local através de uma única configuração.



**Atenção:** esta configuração pressupõe que existe um entrypoint `src/main-worker.ts`, compilado para `dist/main-worker.js`, e que o script de inicialização da API não executa também os consumidores do Worker. Se ainda não separaste os processos, adapta o Compose à estrutura atual.

Como a base de dados está no Supabase, o PostgreSQL não precisa de ser executado neste Compose. O container da API e o Worker utilizam a mesma `DATABASE_URL`.

### 7.1. Executar os containers

Construir as imagens:

```bash
docker compose build
```

Iniciar os serviços:

```bash
docker compose up -d
```

Verificar os serviços:

```bash
docker compose ps
```

Visualizar os logs:

```bash
docker compose logs -f
```

Visualizar apenas os logs do Worker:

```bash
docker compose logs -f worker
```

Visualizar os logs do RabbitMQ:

```bash
docker compose logs -f rabbitmq
```

Parar os serviços:

```bash
docker compose down
```

Para eliminar também os dados persistidos do RabbitMQ:

```bash
docker compose down -v
```

**Cuidado:** o último comando elimina o volume persistente do broker.

### 7.2. RabbitMQ Management

O RabbitMQ disponibiliza uma interface de gestão para acompanhar exchanges, queues, connections e mensagens.

Depois de iniciar os containers, acede a:

```text
http://localhost:15672
```

Credenciais locais:

```text
Username: appuser
Password: apppassword
```

Esta interface é destinada ao desenvolvimento local. Não exponhas a porta de gestão publicamente em produção.

## 8. Scripts disponíveis

Os scripts dependem da configuração do `package.json`. Uma organização possível:

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Executar API em desenvolvimento |
| `npm run build` | Compilar a aplicação |
| `npm run start:prod` | Executar API compilada |
| `npm run start:worker` | Executar processo Worker |
| `npm run test` | Executar testes automatizados |

## 9. CI/CD

O projecto utiliza GitHub Actions para automatizar a validação e compilação da aplicação.

O pipeline é executado quando:

- Existe um push para a branch `main`.
- É criado um Pull Request para `main`.
- É publicada uma tag com o formato `v*.*.*`.

Atualmente, o pipeline executa:

1. Checkout do repositório.
2. Configuração do Node.js.
3. Instalação das dependências através de `npm ci`.
4. Build da aplicação NestJS.

Os testes automatizados serão adicionados numa etapa posterior.

## 10. Deploy e infraestrutura

A arquitectura de produção pode utilizar os seguintes serviços:

| Componente | Serviço |
|---|---|
| Frontend | Vercel |
| Backend API | Render Web Service |
| Notifications Worker | Render Background Worker |
| Message Broker | CloudAMQP |
| Database | Supabase PostgreSQL |
| CI/CD | GitHub Actions |

### Configuração de produção

Na produção, o RabbitMQ pode ser disponibilizado através do CloudAMQP, evitando a necessidade de administrar o broker manualmente.

A API e o Worker devem receber as respetivas variáveis de ambiente através das configurações do Render.

O Worker funciona continuamente, consumindo mensagens da fila e processando os eventos recebidos.

O PostgreSQL permanece no Supabase, sendo partilhado pelos processos da aplicação.

## 11. Limitações e melhorias futuras

O projecto encontra-se em desenvolvimento. Algumas funcionalidades e mecanismos de robustez poderão ser adicionados nas próximas versões.

### Limitações atuais

- Não existe ainda um sistema completo de gestão de disponibilidade dos barbeiros.
- A prevenção de reservas simultâneas para o mesmo barbeiro e horário necessita de restrições e mecanismos adicionais na base de dados.
- Não existe ainda um mecanismo completo de gestão de pagamentos.
- O sistema de notificações depende da disponibilidade do RabbitMQ e do respetivo serviço de entrega.
- O pipeline CI ainda não inclui testes automatizados.
- O schema atual da Outbox não inclui campos específicos para tentativas, erros e controlo de concorrência entre publishers.
- A tabela de barbeiros ainda não possui campos de disponibilidade ou estado ativo/inativo.

### Melhorias planeadas

- Implementar testes unitários e de integração.
- Implementar controlo de disponibilidade dos barbeiros.
- Prevenir conflitos de horários através de transações e constraints no PostgreSQL.
- Implementar Retry e Dead Letter Queue (DLQ).
- Melhorar a recuperação de eventos pendentes na Outbox.
- Implementar idempotência no processamento de mensagens.
- Integrar canais externos de notificação, como SMS ou WhatsApp.
- Implementar documentação interativa com Swagger.
- Implementar monitorização e logging estruturado.
- Melhorar o pipeline CI/CD com deploy automatizado.

## 12. Conceitos de engenharia aplicados

O projecto procura demonstrar a aplicação prática dos seguintes conceitos:

- **Modular Architecture:** separação das responsabilidades por módulos.
- **Event-Driven Architecture:** comunicação assíncrona através de eventos.
- **Outbox Pattern:** consistência entre transações da base de dados e publicação de eventos.
- **Message Broker:** utilização do RabbitMQ para comunicação entre produtores e consumidores.
- **Asynchronous Processing:** processamento de notificações fora do ciclo principal HTTP.
- **Idempotency:** prevenção de efeitos duplicados durante o processamento de eventos.
- **Containerization:** utilização do Docker para empacotamento da aplicação.
- **CI/CD:** automatização da integração e validação do código.

## 13. Autor

**Lenox Mucumbi**

- GitHub: https://github.com/Lenox8
- LinkedIn: https://linkedin.com/in/lenoxmucumbi

---

Desenvolvido como projecto de estudo e aplicação prática de conceitos de Backend Development e System Design.