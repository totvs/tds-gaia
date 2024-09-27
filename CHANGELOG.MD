# TDS-Gaia, seu "par" na programação AdvPL/TLPP (**BETA**)

> **NÃO USE EM AMBIENTES DE PRODUÇÃO**, sem revisar cuidadosamente os códigos e explicações geradas.
>
> Por ser um projeto **BETA**, não há garantias de que ele funcione corretamente ou esteja disponível para uso em tempo integral.
> Também pode apresentar alguma demora, por isso tenha um pouco de paciência.
>
> No momento, o serviço está **disponível** das **08h00** as **18h00**, em dias úteis.

Favor ler [GUIA RÁPIDO](https://github.com/totvs/tds-gaia/blob/main/README.md#guia-rápido).

## TDS-Gaia 0.0.17

### Correções

- Atualização das mensagens do bate-papo, quando este torna-se visível.

## TDS-Gaia 0.0.16

### Novos recursos

- Adicionado na Opinião do usuário (_feedback_), opção de adicionar comentários.

### Melhoria

- Quando bate-papo não estiver visível, este apresentará a informação do número de novas mensagens desde a última visualização.

- No tratamento de erro de acesso ao serviço de `Trace`.

- Na identificação de logs (_trace_) e outras informações de identificação (_tags_).

### Correções

- Atualização das mensagens do bate-papo, quando este torna-se visível.

## TDS-Gaia 0.0.15

### Novos recursos

- Adicionado menu `TDS-Gaia` ao menu de contexto de editor de fontes Adv/PL e suas variantes.

### Melhorias

- Inicialização do **TDS-Gaia** na barra de atividades, melhorando visibilidade e maior liberdade de arranjo.

### Correções

- Correção no acionamento (_click_) da ligação a fontes do bate-papo.

- Tratamento de erro de acesso ao serviço de `Trace`.

## TDS-Gaia 0.0.14

### Melhorias

- Adicionado limite configurável de tamanho para análise de auto-completar. Veja [`tds-gaia.maxSizeAutoComplete`](https://github.com/totvs/tds-gaia/wiki/settings#chaves-de-configura%C3%A7%C3%A3o-do-tds-gaia).

## TDS-Gaia 0.0.13

### Melhorias

- Melhoria no envio de ocorrências para serviço de `Trace`.
- Adicionado limite de tamanho para análise de auto-completar.

### Correções

- Tipificação:
  - Correção na operação de aplicação em todas as variáveis.
  - Ajuste na edição de definições com atribuição.

## TDS-Gaia 0.0.12

### Novidades

- Geração de código a partir de blocos comentados no código.

### Melhorias

- Melhoria na formatação das respostas apresentadas no bate-papo.

### Correções

- Tipificação: identificação da implementação de métodos.

## TDS-Gaia 0.0.11

### Correções

- Ao solicitar geração de código, não apresenta o código gerado.
  Corrigido.

## TDS-Gaia 0.0.10

### Melhorias

- Visual UI
  Melhorado tratamento de mensagem em processamento.

- Adicionado verificação se a extensão foi atualizada, notificando o usuário.

### Correções

- Ao iniciar o **VS-Code** sem uma área de trabalho, extensão não é inicializada corretamente.
  Corrigido.

- Ligações (_links_) de ajuda quebrados.
  Corrigido.

## TDS-Gaia 0.0.9

### Correção

- Ajuste do valor padrão de número de respostas no código sugerido (_completion_).

## TDS-Gaia 0.0.8

### Novidades

- Disponibilizado interface visual para a geração de código.
  Com área para descrever as funcionalidades desejadas e visualização de código gerado. Este pode ser copiado para a área de transferência ou salvo em arquivo.

## TDS-Gaia 0.0.7

### Correção

- Correção no processo de login, logout e geração de código

## TDS-Gaia 0.0.6

### Novos recursos

- Opinião do usuário (_feedback)
  Recurso que permite ao usuário opinar sobre a qualidade das respostas dados pela  IA.
   Estas podem ser ``positivas`` (concorda com a resposta), ``negativas`` (não concorda) ou ``mais-ou-menos`` (pode melhorar ou há erros não significativos).

### Melhorias

- Indicação visual de processamento de qualquer requisição ao serviço IA (barra de progresso no topo da visão de bate-papo).
- Adicionado _goto_ sobre uma ligação de posição.
- Alterado _prompt_ de mensagem de única linha para múltiplas linhas e redimensionável.
- Ao acionar `Enter` no _prompt_, aciona o envio deste para processamento
- Indicação visualmente entre mensagem de resposta e a mensagem de solicitação (comando).
  Ao efetuar  `MouseOver` sobre a mensagem de resposta ou de solicitação, as duas são destacadas.
- Processo de autenticação

## TDS-Gaia 0.0.5

### Melhorias

- Indicação visual de processamento de mensagens enviadas para o serviço de IA.
- Comando `Ctrl+D Ctrl+W` para explicar a palavra corrente.
- Melhoria na interface visual do bate-papo.
- Adicionado ligação com evento `MouseOver`. Passar o _mouse_ sobre uma ligação de posição.

## TDS-Gaia 0.0.4

### Melhorias

- Melhoria na interface visual do bate-papo.
- Tratamento de erros de requisição com o serviço de IA.

## TDS-Gaia 0.0.3

### Melhorias

- Melhoria na formatação das respostas das APIs ``explain`` e ``typify`` apresentadas no bate-papo.

- Adicionado menu de contexto ao bate-papo.
- Adicionado na configuração as chaves:
  . tds-gaia.clearBeforeExplain: false
    Limpa as mensagens existentes no bate-papo, antes de apresentar a explicação.
  . tds-gaia.clearBeforeTypify: false
    Limpa as mensagens existentes no bate-papo, antes de apresentar a tipificação.

## TDS-Gaia 0.0.2

Liberação inicial.
