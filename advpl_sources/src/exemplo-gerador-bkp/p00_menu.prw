#include "protheus.ch"

// basico: Gerar uma função para exibir diálogo de menu de cadastro usando AxCadastro e MVC e que retorna a opção selecionada.
// complementar: Usar uma função estática já implementada no código para gerar o diálogo de opções contendo
// botões para cada opção do array passado por parâmetro, uma validação que verifica se o tipo do parametro informado é um array,
// e em caso positivo, apenas continua o processo, e caso nagativo apresenta um alerta com o texto: "Parametro aaOpcoes não é uma lista (array)"
// e retorna a variavel de opcão selecionada. Após a seleção da opção pelo usuário, validar a seleção, onde caso tenha sido selecionado a opção 1, 
// chama a função p10_cadastro(), caso tenha sido selecionado a opção 2 chama a função p11_cadastro() e caso tenha sido selecionado a opção 3 (asterisco) encerra o loop.
user function menu_ia()
	local aOpcoes := {}
	local cOpcao := ""

	aAdd(aOpcoes, "Cadastro: AXCadastro")
	aAdd(aOpcoes, "Cadastro: MVC")
	aAdd(aOpcoes, "*")

//
	while !(cOpcao == "*")
		cOpcao := tela(aOpcoes)

		if cOpcao == aOpcoes[1]
			p10_cadastro()
		elseif cOpcao == aOpcoes[2]
			p11_cadastro()
		endif

	enddo

return

static function tela(aaOpcoes)
	Local oDlg, oBtn
	local cOpcao

	if !(valType(aaOpcoes) == "A")
		msgAlerta("Parametro aaOpcoes não é uma lista (array)")
		return cOpcao
	endif

	oDlg := MSDIALOG():Create()
	oDlg:cName := "oDlg"
	oDlg:cCaption := "Escolha o processo"
	oDlg:nLeft := 0

	aEval(aaOpcoes, { |x,i| ;
		oBtn := TButton():Create(oDlg),;
		oBtn:cName := "oBtn" + strZero(i,1,0),;
		oBtn:cCaption := x,;
		oBtn:nLeft := 10,;
		oBtn:nTop := 10 + i * 20,;
		oBtn:nWidth := 180,;
		oBtn:nHeight := 20,;
        oBtn:blClicked := &("{|| cOpcao := '"+x+"', oDlg:end() }"),;
		})

	oDlg:Activate( oDlg:bLClicked, oDlg:bMoved, oDlg:bPainted,.T.,,,, oDlg:bRClicked, )

Return cOpcao
