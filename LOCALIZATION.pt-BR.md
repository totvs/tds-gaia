
# Tradução **TDS-Gaia**

*Também disponível em [Inglês](LOCALIZATION.md), [Português](LOCALIZATION.pt-BR.md)*

O **TDS-Gaia** utiliza como idioma padrão o inglês e necessitamos de colaboração para tradução e revisão do material traduzido, que podem ser:

- arquivos de textos, identificados com a extensão ``MD``;
- mensagens e textos utilizados nos arquivos-fonte.

A revisão pode ser ortográfica, gramatical e de procedimentos. Faça aquela que você se sentir mais confortável.

## Tradução ou revisão de textos (arquivos de textos)

### Procedimentos

- Clone o projeto **TDS-Gaia**, preferencialmente o ramo ``Dev``. Opcionalmente, transfira-o para sua estação de trabalho;
- Duplique o arquivo a ser traduzido conforme o ambiente (*web* ou *local*), adicionando a extensão ``.<locale>.MD``. Onde, ``<locale>`` é o código do idioma de [suportado pelo VSCode](https://code.visualstudio.com/docs/getstarted/locales#_available-locales);
- Abra o arquivo para edição conforme o ambiente;
- Faça a tradução ou a revisão;
- Ao final do processo:
  - Se o ambiente for local, confirme as modificações efetuadas;
  - Solicite a reintegração do seu clone ao projeto original.

### Recomendações a tradutores e revisores

- Evite o uso de termos estrangeiros. Utilize-o somente quando não há uma tradução ou para melhorar o entendimento, colocando-o em itálico ou traduzindo e colocando o original entre parenteses. Por exemplo, "mouse click" fica "acione o *mouse*" ou "acione o rato (*mouse*)";
- Antes de iniciar a tradução, leia os textos já traduzidos por outros colaboradores. Dessa forma, você se acostuma com os termos utilizados e mantemos um padrão de linguagem;
- Em caso de ligações (*links*), verifique se há um arquivo com a tradução para o idioma sendo trabalho e ajuste-o, caso contrário, mantenha o original;
- Não traduza comandos ou códigos. Normalmente estes estarão formatados como código, que é indicado pela marcação \`\` ou \`\`\`;
- Não traduza nomes de produtos, usuários, marcas e outros similares, exceto se orientado a isso.
- Os nomes dos arquivos e pastas, devem ser sempre em inglês.
- Ao usar siglas que se repetem no texto, na primeira ocorrência desta, coloque-a por extenso e a sigla entre parenteses. Por exemplo, "O Repositórios de Objetos Protheus (RPO, do inglês *Repository Protheus Objects*) é utilizado para...".
- Sempre que possível, ajuste o texto as normas cultas do idioma.
- Em caso de numerais, utilize as regras/recomendações do idioma de trabalho. No caso do português, números (cardinais ou ordinais) até dez, cem, mil, em inicio de frases e fracionários (dois terço, um quarto), devem ser por extenso.
- Em mensagens para tradução, pode aparecer um número entre chaves, p.e. ``{0} attribute required.``. Essas chaves indicam que é um argumento que será utilizado na apresentação final e deve ser considerada na tradução e colocada na posição correta do texto traduzido.

## Tradução ou revisão de mensagens e textos (arquivos fontes)

### Procedimentos para tradutores ou revisores

### Procedimentos para desenvolvedores

### Recomendações ao desenvolvedor

- O idioma padrão é o inglês, portanto qualquer *string* deverá ser escrita em inglês, independente se será traduzida ou não;
- Todas as *strings* a serem traduzidas deverão ser utilizado [``vscode.l10n.t``](https://github.com/microsoft/vscode-l10n);;
- Procure utilizar texto genéricos e se necessário com argumentos. Por exemplo, no lugar de escrever:

  ```typescript
  ...
  if (productCode === '') {
    msgErro.push(localize("productCode", "Required product code."))
  }
  if (productName === '') {
    msgErro.push(localize("productName", "Required product name."))
  }
  console.log(`Validation with ${msgErro.length} errors`);
  ...
  ```

  Escreva:

  ```typescript
  ...
  if (productCode === '') {
    msgErro.push(vscode.l10.t("{0} attribute required.", vscode.l10t.("Product Code")));
  }
  if (productName === '') {
    msgErro.push(vscode.l10.t("{0} attribute required.", vscode.l10.t("Product Name")));
  }
  console.log(vscode.l10.t("Validation with {0} errors", msgErro.length);
  ...
  ```

- Em textos mais longos, deve-se usar o ``vscode.10.t`` por parágrafo;
- Não use variáveis de qualquer tipo ou escopo, no lugar da *string* a ser traduzida. Por exemplo:

  ```typescript
  const ATT_REQ = "{0} attribute required.";
  ...
  if (productCode === '') {
   msgErro.push(localize("ATTRIBUTE_REQUIRED", ATT_REQ, localize("productCode", "Product Code")));
  }
  if (productName === '') {
   msgErro.push(localize("ATTRIBUTE_REQUIRED", ATT_REQ, localize("productName", "Product Name")));
  }
  ...
  ```

  O trecho de código acima está errado e não funcionará no processo de tradução. O correto é:
  
  ```typescript
  const ATT_REQ = (attribute) =>  vscode.l10.t( "{0} attribute required.", attribute);
  ...
  if (productCode === '') {
    msgErro.push(ATT_REG(vscode.l10.t("Product Code")));
  }
  if (productName === '') {
    msgErro.push(ATT_REQ(vscode.l10.t("Product Name")));
  }
  ...
  ```

## Extensões VSCode de apoio (somente local)

Estas extensões podem ajudá-lo no processo:

- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) e a extensão com o dicionário para o idioma sendo trabalhado.
- [VSCode Google Translate](https://marketplace.visualstudio.com/items?itemName=funkyremi.vscode-google-translate).
