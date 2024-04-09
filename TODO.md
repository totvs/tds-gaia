# TDS-Dito: Ideias e coisas a fazer na extensão

> **Legendas**:
> :white_check_mark: Pronto
> :walking: Em andamento, sem prazo
> :white_square_button: Em estudo/a fazer (pode ser cancelado)

## Inteligência Artificial (Carol Clockin Web API)

- :walking: API para uso da inteligência artificial.
- :white_square_button: Definir tratamento para `What do you want me to explain?` ou `Explain What?`, inclusive de códigos já processados.
- :white_square_button: Apresentado lista de opções ao final da resposta (`Show me...`). Como proceder?
- :white_square_button: Eliminar frases duplicadas.
- :white_square_button: Eliminar sugestões de código já existente.
- :white_square_button: Adicionar tempo de processamento em todas as funções da API.
- :white_square_button: Configuração do nível de detalhes das respostas.
  Nessa etapa, apresentar sempre de forma sucinta, com opção para detalhamento.

- :white_square_button: Controle de acesso (_login_).
- :white_square_button: Configuração do idioma das respostas.
- :white_square_button: Adicionar suporte para outros idiomas.
- :white_square_button: Em alguns retornos de explicação de um bloco, retornou referências a linha (`First line`, `Second Line...`). Melhor seria textos mais corridos, sem ser linha a linha e de acordo com nível de detalhe desejado.

- :white_square_button: Mecanismo de avaliação de respostas pelo usuário, que poderá ser utilizada para refinamento do modelo.
- :white_square_button: API de log e avaliação de auto-complete

## API: Inteligência Artificial (interface IaApiInterface)

- :walking: API para a inteligência artificial.
- :white_square_button: Identificação de usuário (_login_).
  Usar `vscode.AuthProvider` para autenticação.
- :white_square_button: Mensagens associadas a processamento.
  Encapsular o processamento e passar como _callback_ para ChatApi.Dito e esse passa a tratar o retorno da mensagem (`messageId`).
- :white_square_button: No caso de erro 504 e com informação de tempo para nova tentativa, agendar nova tentativa.
  Mensagem com tempo: ``The server encountered a temporary error and could not complete your request. Please try again in 30 seconds.``

## Extensão

- :white_square_button: Implementar sistema de tradução L10N.
- :walking: Implementar uma forma de _feedback_ do resultado do auto-complete.
  - Caso o usuário aceite o auto-complete, gerar um log com avaliação positiva.
  - Pensar em alguma solução para o usuário, ativamente, avaliar negativamente o auto-complete sugerido pela IA.

## API: Bate-papo (classe ChatApi)

- :walking: API para bate-papo.
- :white_square_button: Detalhar a `ajuda`(_help_) dos comandos.
- :white_square_button: Melhorar/implementar tratamento de argumentos em comandos.
- :white_square_button: Implementar processo de abertura de chamado (comando `open_issue`).
- :walking: Implementar substituicao de texto ao fazer o typify

## Visual: Bate-papo

- :white_square_button: Executar o comando ao acionar `Enter`.
- :white_square_button: Associar visualmente mensagem de resposta com a mensagem de entrada.
  Tratar `MouseOver` sobre a mensagem de resposta ou de entrada e destacar as duas. Dessa forma, se o usuário disparar vários processos, pode acompanhar qual mensagem está sendo respondida.
- :walking: Implementar `goto` em ligações (_links_) de posicionamento em fontes.
- :white_check_mark: Implementar indicador de "Processando" durante execução da API `complete`.
  Ideias: `Completing code...` ou barra de progresso (`vscode.window.withProgress`) ou outro indicador acima do campo `NewMessage`.

## Visual: Editor de texto

- :white_square_button: Colocar _codeLens_ no código que esta sendo processado.

## Problemas gerais

- :white_check_mark: Extensão não ativa corretamente caso a visão do DitoChat tenha sido fechada anteriormente
- :white_square_button: Abrir DitoChat no painel secundário
