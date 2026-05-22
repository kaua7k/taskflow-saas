# TaskFlow Apple Style

SaaS de tarefas com Flask, visual inspirado em interfaces premium minimalistas, painel funcional e interações completas.

## Estrutura

```bash
output/taskflow-apple/
├── app.py
├── README.md
├── templates/
│   └── index.html
└── statics/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Como rodar

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Instale o Flask:

```bash
pip install flask
```

Execute:

```bash
python app.py
```

Abra:

```bash
http://127.0.0.1:5000
```

## Funções prontas

- Criar tarefa
- Buscar tarefa
- Filtrar por status
- Ordenar por prioridade
- Marcar como concluída
- Avançar status
- Excluir tarefa
- Limpar concluídas
- Tema claro/escuro
- Painel de atividade