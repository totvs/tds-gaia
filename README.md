# TDS-Dito, seu "par" na programação AdvPL/TLPP (**EXPERIMENTAL**)

> **NÃO USO EM AMBIENTES DE PRODUÇÃO**, sem revisar cuidadosamente os códigos e explicações geradas.
>
> Por ser um projeto **experimental**, não há garantias de que ele funcione corretamente ou esteja disponível para uso em tempo integral.
> No momento, o serviço está **disponível** das **09h00** as **17h00**, em dias úteis.
>

<!--[![GitHub stars](https://img.shields.io/github/stars/brodao2/tds-dito?style=plastic)](https://github.com/brodao2/tds-dito/stargazers)
![GitHub top language](https://img.shields.io/github/languages/top/brodao2/tds-dito)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/brodao2/tds-dito/Deploy%20Extension)
![GitHub last commit](https://img.shields.io/github/last-commit/brodao2/tds-dito)
-->
<!-- prettier-ignore-start -->
[![GitHub license](https://img.shields.io/github/license/brodao2/tds-dito?style=plastic)](https://github.com/brodao2/tds-dito/blob/master/LICENSE)
![Version](https://img.shields.io/visual-studio-marketplace/v/TOTVS.tds-dito)
![Installs](https://img.shields.io/visual-studio-marketplace/i/TOTVS.tds-dito)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/TOTVS.tds-dito)
![Rating](https://img.shields.io/visual-studio-marketplace/stars/TOTVS.tds-dito)
[![GitHub issues](https://img.shields.io/github/issues/brodao2/tds-dito?style=plastic)](https://github.com/brodao2/tds-dito/issues)
[![GitHub forks](https://img.shields.io/github/forks/brodao2/tds-dito?style=plastic)](https://github.com/brodao2/tds-dito/network)
![Visual Studio Marketplace Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/TOTVS.tds-dito)
<!-- markdownlint-disable -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- markdownlint-enabled -->
<!-- prettier-ignore-end -->

A extensão **TDS-Dito** é uma extensão para o [Visual Studio Code](https://code.visualstudio.com/) que fornece uma interface visual para o serviço de IA da **TOTVS**, que provê serviço de inteligência artificial para ajudá-lo no desenvolvimento de aplicações AdvPL/TLPP.

## Funcionalidades

- \[X\] Complemento de código
- \[X\] Explicação de código
- \[X\] Tipificação de variáveis
- \[?\] Geração de código a partir de uma descrição
- \[ \] Análise de código
- \[ \] Tradução automatizada

\[X\] Experimental \[?\] Previsto, mas sem prazo \[ \] Em estudo (pode ser cancelado)

## Instalação

> Requer a extensão [**TDS-VSCode**](/https://github.com/totvs/tds-vscode). Caso não o tenha, este será instalado automaticamente. Atente-se ao requisitos desta extensão.
>
> O **VS Code** pode apresentar problemas em suas funcionalidades em sistemas operacionais da linha **Windows Server**.
> Veja os requisitos para uso do **VS Code** em [Requirements](https://code.visualstudio.com/docs/supporting/requirements).

### Procurando pela extensão (não disponível)

Você pode procurar e instalar extensões de dentro do **VS Code**. Abra a visão de extensões clicando no ícone de extensões na barra de atividades na lateral do **VS Code** ou acione o comando "Visão: Extensões" (``Ctrl+Shift+X``).

![Ícone da Visão Extensões](images/extensions-view-icon.png)

Em seguida digite ``tds`` no campo de pesquisa e selecione a extensão ``TDS-Dito``.

Acione  o botão ``Instalar``. Após completar a instalação, o botão ``Instalar`` será alterado para ``Gerenciar``. 

### Instalando de um arquivo VSIX

Você pode instalar manualmente uma extensão do **VS Code** empacotada em um arquivo ``.vsix``. Utilize o comando ``Instalar do VSIX...`` na visão de extensões após clicar em ``Modo de Exibição e Mais Ações...`` (ícone com "...") ou acione o comando ``Extensões: Instalar do VSIX...`` após acionar (``CTRL+SHIFT+P``) e selecione o arquivo ``.vsix``.

Acesse o [releases](https://github.com/brodao2/tds-dito/releases) para baixar a última versão liberada.

> Caso o acesso seja negado, solicite liberação.
> Sua solicitação será analisada, podendo ser liberado ou negada sem maiores explicações.

Você pode instalar também usando a opção ``--install-extension`` através da linha de comando e informando o caminho do arquivo ``.vsix``.

> ``code --install-extension tds-dito-0.0.1.vsix``

Ao finalizar a instalação, lhe será apresentado um bate-bato (_chat_). É através dele que você pode falar com o **Dito, seu parceiro na programação AdvPL/TLPP**.

### Revertendo uma atualização

Se for necessário reverter uma atualização, selecione o comando ``Instalar Outra Versão...`` após acionar o botão ``Gerenciar`` e selecione a outra versão que deseja instalar.

### Desinstalando a extensão

Para desinstalar a extensão, selecione o comando "Desinstalar" após acionar o botão "Gerenciar".

## Como usar

### Configuração

A extensão já vem configurada pronto para uso, não requerendo nenhuma configuração adicional. Caso queira saber mais, acesse [Configuração](/docs/configuration.md).

### Complemento de código

A extensão fornece um complemento de código para o códigos AdvPL/TLPP. Para ativar o complemento, abra um arquivo AdvPL/TLPP e digite algum código (ou aguarde) e uma lista de possíveis complementos será exibido.

> A funcionalidade pode ser configurada para ser acionada [manualmente](/docs/configuration.md) ou ter o [intervalo de espera](/docs/configuration.md) alterado.

### Explicação de código


## Erros comuns

### Bloqueio por _firewall_ e outros sistemas de proteção  

O ``TDS-Dito``, depende de acesso a URL´s de serviços externos que, eventualmente, precisam ser liberados por sistemas de proteção (_firewalls_, anti-virus e outros).

#### Sintoma

Apresenta, na visão ``TDS-Dito`` da aba ``Output``, mensagem semelhante:

```console
Cause: Error: unable to get local issuer certificate
Stack: TypeError: fetch failed
 at fetch (w:\ws_tds_vscode\tds-dito\node_modules\undici\index.js:103:13)
 at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
 at async CarolApi.checkHealth (w:\ws_tds_vscode\tds-dito\out\api\carolApi.js:30:20)
```

#### Correção

Entre em contato com o suporte de segurança de sua empresa/organização para que ele libere o acesso a URL ``https://advpl.ds.dta.totvs.ai`` ou outro _endpoint_ indicado.

Dependendo de configurações de seu sistema operacional/ambiente de trabalho, você mesmo pode liberar o acesso, desde que tenha os conhecimentos de como fazê-las.
