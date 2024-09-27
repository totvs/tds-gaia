#include "protheus.ch"

// Gerar uma fun��o para exibir di�logo de menu de cadastro usando AxCadastro e MVC e que retorna a op��o selecionada.

// complementar: Usar uma fun��o est�tica j� implementada no c�digo para gerar o di�logo de op��es contendo
// bot�es para cada op��o do array passado por par�metro, uma valida��o que verifica se o tipo do parametro informado � um array,
// e em caso positivo, apenas continua o processo, e caso nagativo apresenta um alerta com o texto: "Parametro aaOpcoes n�o � uma lista (array)"
// e retorna a variavel de opc�o selecionada. Ap�s a sele��o da op��o pelo usu�rio, validar a sele��o, onde caso tenha sido selecionado a op��o 1, 
// chama a fun��o p10_cadastro(), caso tenha sido selecionado a op��o 2 chama a fun��o p11_cadastro() e caso tenha sido selecionado a op��o 3 (asterisco) encerra o loop.
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
		msgAlerta("Parametro aaOpcoes n�o � uma lista (array)")
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
