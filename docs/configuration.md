# Configurações

As configurações do **TDS-Gaia** seguem a estrutura de configurações do **VS-Code**. Para acessar as configurações, acione o comando `Preferences: Open Settings (UI)` ou `Preferences: Open User Settings` ou se preferir pode editar (texto) diretamente os arquivos acionando os comando `Preferences: Open Settings (JSON)` ou `Preferences: Open User Settings (JSON)`.

> Para detalhes de como funciona a estrutura de configurações do **VS-Code**, acesse a documentação oficial: [User and Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings).

## Chaves de configuração do **TDS-Gaia**

Essas chaves de configuração são específicas do **TDS-Gaia** e podem ser utilizadas para personalizar o comportamento da extensão.

> Por questão de clareza da documentação, todas as chaves devem ter o prefixo `tds-gaia.` e aqui será suprimido. Por exemplo: ``tds-gaia.endPoint`` será apresentada como ``.endPoint``.
> Chaves enumeradas terão seu valores listados em tópico específico, mais a frente.

<!-- Manter as linhas desta tabela em ordem alfabética -->
| Chave | Padrão | Descrição  |
| .endPoint | <https://advpl.ds.dta.totvs.ai> | URL do serviço de IA do TDS-Gaia. Altere somente se orientado. |
| .apiVersion | v1 | Versão da API. Altere somente se orientado. |
| .documentFilter | * | Filtro de documentos para habilitar sugestões (_auto suggest_). |
| .enableAutoSuggest | true | Habilita auto-sugestão durante a edição. |
| .requestDelay | 400 | Intervalo na digitação para ativação do auto-sugestão. |
| .maxLine | 5 | Número máximo de linhas para cada sugestão. |
| .maxSuggestions | 1 | Máximo de sugestões por requisição de auto-sugestão. |
| .showBanner | true | Apresenta _banner_ na inicialização. |
| .tryAutoReconnection | 3 | Número de tentativas de reconexão caso o serviço de IA esteja indisponível. 0 para desabilitar.
| .clearBeforeExplain |  false | Limpa o bate-papo antes de apresentar um explicação. |
| .clearBeforeInfer |  false | Limpa o bate-papo antes de apresentar resultado de uma tipificação. |
| .logLevel | debug | Nível de severidade mínima a ser gravada no arquivo de ocorrências (_log_). |

* Filtro padrão de [seleção de documentos](https://code.visualstudio.com/api/references/document-selector):

```json
[
    {
        "language": "advpl",
        "scheme": "file"
    },
    {
        "language": "advpl-asp",
        "scheme": "file"
    }
]
```

## Valores das chaves enumeradas

### tds-gaia.logLevel

| Valor   | Uso |
| ------- | --- |
| off     | Desligado (não recomendado). |
| debug   | Depuração (padrão). |
| verbose | Detalhado. |
| http    | Requisições HTTP. |
| info    | Informações. |
| warn    | Avisos. |
| error   | Erros. |
