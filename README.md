# GitHub Dev Dashboard

Uma aplicação web desenvolvida com React para explorar e analisar perfis e repositórios do GitHub através da GitHub API.

O projeto transforma dados públicos de desenvolvedores em uma interface organizada, responsiva e focada em uma experiência de navegação simples, objetiva e visual.

Além da exploração dos dados, o projeto está evoluindo para incorporar uma camada de **análise baseada em Inteligência Artificial**, permitindo que o usuário consulte uma IA especializada sobre o perfil e os repositórios analisados.

## Tecnologias

* React
* JavaScript
* Vite
* CSS
* GitHub API
* REST API
* Git e GitHub
* Inteligência Artificial

## Funcionalidades

### GitHub Dashboard

* Busca de usuários do GitHub
* Visualização de informações do perfil
* Listagem de repositórios
* Exibição de informações dos projetos
* Análise de atividade e dados públicos
* Consumo da GitHub REST API
* Interface responsiva
* Componentização com React
* Estados de carregamento
* Tratamento de erros e dados da API
* Dashboard focado na visualização dos dados

### AI Reviewer

O **AI Reviewer** analisa o contexto do perfil e dos repositórios carregados no dashboard. A interface envia as perguntas para `/api/ask-ai`, uma função server-side que encaminha a solicitação ao Gemini sem expor a chave no bundle do navegador.

Para ativar a integração local, copie `.env.example` para `.env`, adicione sua chave do Google AI Studio e reinicie `npm run dev`:

```env
GEMINI_API_KEY=
```

Obtenha a chave em [Google AI Studio](https://aistudio.google.com/app/apikey). Nunca a adicione a arquivos versionados nem use um prefixo `VITE_`. O `.gitignore` exclui arquivos `.env` e variantes, mantendo `.env.example` versionável.

No Vercel, adicione `GEMINI_API_KEY` nas variáveis de ambiente do projeto para os ambientes desejados (Production, Preview e/ou Development) e faça um novo deploy. A função `api/ask-ai.js` atende à rota `/api/ask-ai`; no desenvolvimento, o Vite registra a mesma função como middleware local.

A proposta é transformar o dashboard em uma ferramenta não apenas de visualização, mas também de **interpretação dos dados do desenvolvedor**.

O usuário poderá acessar uma área de **AI Opinion**, onde encontrará perguntas previamente definidas e também poderá realizar perguntas personalizadas.

Exemplos de perguntas:

```text
> O que você acha da organização deste repositório?

> Quais tecnologias aparecem com maior frequência?

> Como está a atividade recente deste desenvolvedor?

> Quais pontos do projeto poderiam ser melhorados?

> Quais repositórios parecem ter maior nível de complexidade?

> Faça uma análise geral deste perfil.

> Quais padrões você identifica nos projetos?
```

A IA deverá responder utilizando como contexto os dados coletados do GitHub e as informações específicas do perfil ou repositório atualmente analisado.

### Contexto controlado

A camada de IA será projetada para trabalhar dentro de um escopo definido.

O modelo receberá informações estruturadas, como:

* Nome do usuário
* Biografia
* Linguagens utilizadas
* Repositórios
* Descrições
* Estrelas
* Forks
* Issues
* Commits e eventos disponíveis
* Datas de atividade
* Tecnologias identificadas
* Métricas disponíveis no dashboard

A intenção é evitar que a IA funcione como um chatbot genérico.

Seu objetivo será atuar como um **avaliador especializado nos dados apresentados pelo GitHub Dev Dashboard**.

Quando uma pergunta estiver fora do contexto disponível, a aplicação deverá orientar a IA a informar que aquela informação não pode ser determinada a partir dos dados analisados.

## AI Reviewer — Arquitetura

A implementação da Inteligência Artificial será baseada em uma arquitetura de contexto.

```text
GitHub API
     │
     ▼
GitHub Dev Dashboard
     │
     ├── Perfil
     ├── Repositórios
     ├── Atividade
     ├── Tecnologias
     └── Métricas
            │
            ▼
      Context Builder
            │
            ▼
     AI Instructions
            │
            ▼
         AI API
            │
            ▼
       AI Reviewer
            │
            ▼
     Resposta no Dashboard
```

A aplicação monta um contexto estruturado antes de enviar uma pergunta para o modelo.

Isso permite que a IA receba somente as informações relevantes para a análise, juntamente com instruções que definem seu comportamento, escopo e formato de resposta.

### Princípios da IA

O AI Reviewer deverá seguir alguns princípios:

* Analisar somente o contexto fornecido pela aplicação.
* Não inventar informações sobre o repositório.
* Diferenciar dados reais de interpretações.
* Informar quando determinada informação não estiver disponível.
* Responder perguntas relacionadas ao perfil e aos repositórios analisados.
* Explicar suas conclusões utilizando os dados disponíveis.
* Evitar avaliações baseadas em informações que não foram fornecidas.
* Manter respostas objetivas e úteis para desenvolvedores.
* Permitir evolução futura dos critérios de análise.

## Experiência de uso

A interface do AI Reviewer será inspirada em uma experiência de terminal, mantendo a identidade visual do projeto.

```text
┌─────────────────────────────────────────────┐
│ AI OPINION                                  │
│                                             │
│ > Analise este repositório                  │
│                                             │
│ AI Reviewer                                 │
│                                             │
│ Este projeto utiliza React e JavaScript...  │
│                                             │
│ > Faça outra pergunta...                    │
└─────────────────────────────────────────────┘
```

A proposta é combinar:

* Interface de dashboard
* Elementos visuais inspirados no GitHub
* Experiência semelhante a terminal
* Análise baseada em IA
* Dados reais provenientes da GitHub API

## Roadmap

### Dashboard

* [x] Busca de usuários
* [x] Visualização de perfil
* [x] Listagem de repositórios
* [x] Integração com GitHub API
* [x] Interface responsiva
* [x] Componentização com React
* [x] Tratamento de estados e erros
* [ ] Evolução das métricas
* [ ] Melhorias de UX e visualização de dados

### Analytics

* [x] Visualização de métricas
* [x] Análise de atividade
* [ ] Evolução das análises
* [ ] Melhorias nos gráficos
* [ ] Novos indicadores de atividade

### AI Reviewer

* [ ] Criar área AI Opinion
* [ ] Criar interface em estilo terminal
* [ ] Criar perguntas predefinidas
* [ ] Permitir perguntas personalizadas
* [ ] Criar estrutura de contexto para a IA
* [x] Integrar API de Inteligência Artificial (Gemini no servidor local do Vite)
* [ ] Definir instruções e limites do AI Reviewer
* [ ] Implementar tratamento de perguntas fora do contexto
* [ ] Melhorar formatação das respostas
* [ ] Criar diferentes tipos de análise
* [ ] Evoluir os critérios de avaliação

## Estrutura

```text
src/
├── components/
├── pages/
├── services/
├── utils/
├── App.jsx
└── main.jsx

public/
```

A estrutura poderá evoluir conforme novas funcionalidades forem adicionadas, principalmente com a implementação da camada de Inteligência Artificial.

## Execução

```bash
git clone https://github.com/G-Leao/Github-Dev-dashboard.git
cd Github-Dev-dashboard
npm install
npm run dev
```

O projeto será executado localmente através do servidor de desenvolvimento do Vite.

## Objetivo

O GitHub Dev Dashboard nasceu como um projeto prático para explorar a integração entre **React, APIs e dados públicos do GitHub**.

A evolução do projeto busca transformá-lo em uma ferramenta mais completa para análise de desenvolvedores e seus projetos, combinando:

```text
GitHub Data
     +
Dashboard
     +
Analytics
     +
Artificial Intelligence
     =
Developer Analysis Platform
```

A proposta é explorar como dados públicos podem ser organizados, visualizados e posteriormente interpretados por Inteligência Artificial para gerar análises contextualizadas sobre projetos de software.

## Autor

**Gustavo Leão**

Engenharia de Software | Front-end Developer

[GitHub](https://github.com/G-Leao) · [LinkedIn](https://www.linkedin.com/in/Gustavo-leaodev/)
