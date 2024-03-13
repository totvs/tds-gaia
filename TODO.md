# TDS-Dito: Ideias e coisas a fazer na extensão

> **Legendas**:
> :white_check_mark: Pronto
> :walking: Em andamento, sem prazo
> :white_square_button: Em estudo/a fazer (pode ser cancelado)

## Inteligência Artificial (Carol Clockin Web API)

- :white_check_mark: Criar API para uso da inteligência artificial.
- :white_square_button: Controle de acesso (_login_).
- :white_square_button: Definir tratamento para `What do you want me to explain?` ou `Explain What?`, inclusive de códigos já processados.
- :white_square_button: Eliminar frases duplicadas.
- :white_square_button: Mecanismo de avaliação de respostas pelo usuário, que será utilizada para refinamento do modelo.
- :white_square_button: Configuração do idioma das respostas.
- :white_square_button: Eliminar sugestões de código já existente.
- :white_square_button: Adicionar suporte para outros idiomas.
- :white_square_button: Adicionar tempo de processamento em todas as funções da API.
- :white_square_button: Configuração do nível de detalhes das respostas.
- :white_square_button: Em alguns retornos de explicação de um bloco, retornou referências a linha (`First line`, `Second Line...`). Melhor seria textos mais corridos, sem ser linha a linha e de acordo com nível de detalhe desejado.

## API: Inteligência Artificial (interface IaApiInterface)

- :white_check_mark: Criar API para a inteligência artificial.
- :white_square_button: Identificação de usuário (_login_).
  Usar `vscode.AuthProvider` para autenticação.
- :white_square_button: Mensagens associadas a processamento.
  Encapsular o processamento e passar como _callback_ para ChatApi.Dito e esse passa a tratar o retorno da mensagem (`messageId`).

## API: Bate-papo (classe ChatApi)

- :white_check_mark: Criar API para bate-papo.
- :white_square_button: Detalhar a `ajuda`(_help_) dos comandos.

## Visual: Bate-papo

- :white_square_button: Executar o comando ao acionar `Enter`.
- :white_square_button: Associar visualmente mensagem de resposta com a mensagem de entrada.
  Tratar `MouseOver` sobre a mensagem de resposta ou de entrada e destacar as duas. Dessa forma, se o usuário disparar vários processos, pode acompanhar qual mensagem está sendo respondida.
- :white_square_button: Implementar `goto`em links de posicionamento de fontes.

## Visual: Editor de texto

- :white_square_button: Colocar _codeLens_ no código que esta sendo processado.
