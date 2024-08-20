# TDS-Gaia: Ideias e coisas a fazer na extensão

> **Legendas**:
> :white_check_mark: Pronto
> :walking: Em andamento, sem prazo
> :white_square_button: Em estudo/a fazer (pode ser cancelado)
> :alarm_clock: Ponto de atenção

## Inteligência Artificial (AdvPL++ LLM Web API)

- :white_check_mark: API para uso da inteligência artificial.
- :white_check_mark: :alarm_clock: Identificação de usuário (_login_).
  Efetuado parcialmente. Necessita de revisão de todo o processo.

- :white_square_button: Configuração do nível de detalhes das respostas.
  Nessa etapa, apresentar sempre de forma sucinta, com opção para detalhamento.
- :white_square_button: Configuração do idioma das respostas.
- :white_square_button: Adicionar suporte para outros idiomas.

- :white_check_mark: Definir tratamento para `What do you want me to explain?` ou `Explain What?`, inclusive de códigos já processados.
- :white_check_mark: Apresentado lista de opções ao final da resposta (`Show me...`). Como proceder?
- :white_check_mark: Eliminar frases duplicadas.
- :white_check_mark: Eliminar sugestões de código já existente.
- :white_check_mark: Adicionar tempo de processamento em todas as funções da API.
- :white_check_mark: Em alguns retornos de explicação de um bloco, retornou referências a linha (`First line`, `Second Line...`). Melhor seria textos mais corridos, sem ser linha a linha e de acordo com nível de detalhe desejado.
- :white_check_mark: Mecanismo de avaliação de respostas pelo usuário, que poderá ser utilizada para refinamento do modelo.
- :white_check_mark: API de log e avaliação de auto-complete

## API: Inteligência Artificial (interface IaApiInterface)

- :white_check_mark: API para a inteligência artificial.

- :white_square_button: Mensagens associadas a processamento.
  Encapsular o processamento e passar como _callback_ para ChatApi.Gaia e esse passa a tratar o retorno da mensagem (`messageId`).

- :white_check_mark: No caso de erro 504 e com informação de tempo para nova tentativa, agendar nova tentativa.
  Mensagem com tempo: ``The server encountered a temporary error and could not complete your request. Please try again in 30 seconds.``

## Extensão

- :white_square_button: Traduzir `l10n\bundle.l10n.json` para Russo.

- :alarm_clock: Revisar traduções.

- :white_check_mark: :alarm_clock: Identificação de usuário (_login_).
  Efetuado parcialmente. Necessita de revisão de todo o processo.
  Usar `vscode.AuthProvider` para autenticação.

- :white_check_mark: Implementar sistema de tradução L10N.
- :white_check_mark: Traduzir `l10n\bundle.l10n.json` para Português.
- :white_check_mark: Traduzir `l10n\bundle.l10n.json` para Espanhol.
- ::white_check_mark:: Implementar uma forma de _feedback_ do resultado do auto-complete.
  - Caso o usuário aceite o auto-complete, gerar um log com avaliação positiva.
  - Pensar em alguma solução para o usuário, ativamente, avaliar negativamente o auto-complete sugerido pela IA.

## API: Bate-papo (classe ChatApi)

- :white_check_mark: API para bate-papo.
- :white_check_mark: Implementar substituição de texto ao fazer o typify

- :white_square_button: Detalhar a `ajuda`(_help_) dos comandos.
- :white_square_button: Melhorar/implementar tratamento de argumentos em comandos.
- :white_square_button: Implementar processo de abertura de chamado (comando `open_issue`).

## Visual: Bate-papo

- :white_check_mark: Implementar `goto` em ligações (_links_) de posicionamento em fontes.
- :white_check_mark: Implementar indicador de "Processando" durante execução da API `complete`.
  Ideias: `Completing code...` ou barra de progresso (`vscode.window.withProgress`) ou outro indicador acima do campo `NewMessage`.
- :white_check_mark: Executar o comando ao acionar `Enter`.
- :white_check_mark: Associar visualmente mensagem de resposta com a mensagem de entrada.
  Tratar `MouseOver` sobre a mensagem de resposta ou de entrada e destacar as duas. Dessa forma, se o usuário disparar vários processos, pode acompanhar qual mensagem está sendo respondida.

## Visual: Editor de texto

- :white_square_button: Colocar _codeLens_ no código que esta sendo processado e outros indicadores visuais.

## Problemas gerais

- :white_square_button: Abrir GaiaChat no painel secundário

- :white_check_mark: Extensão não ativa corretamente caso a visão do GaiaChat tenha sido fechada anteriormente
- :white_check_mark: :alarm_clock: Identificação de usuário (_login_).
  Efetuado parcialmente. Necessita de revisão de todo o processo.
