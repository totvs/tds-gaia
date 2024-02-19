# TDS-Dito, seu "par" na programação AdvPL

## Erros comuns

### Bloqueio por _firewall_ e outros sistemas de proteção  

O ``TDS-Dito``, depende de acesso a URL´s de serviços externos que, eventualmente, precisam ser liberados por sistemas de proteção (_firewalls_, anti-virus e outros).

### Sintoma

Apresenta, na visão ``TDS-Dito`` da aba ``Output``, mensagem semelhante:

```console
Cause: Error: unable to get local issuer certificate
Stack: TypeError: fetch failed
 at fetch (w:\ws_tds_vscode\tds-dito\node_modules\undici\index.js:103:13)
 at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
 at async CarolApi.checkHealth (w:\ws_tds_vscode\tds-dito\out\api\carolApi.js:30:20)
```

### Correção

Entre em contato com o suporte de segurança de sua empresa/organização para que ele libere o acesso a URL ``https://advpl.ds.dta.totvs.ai`` ou outro _endpoint_ indicado.

Dependendo de configurações de seu sistema operacional/ambiente de trabalho, você mesmo pode liberar o acesso, desde que tenha os conhecimentos de como fazê-las.
