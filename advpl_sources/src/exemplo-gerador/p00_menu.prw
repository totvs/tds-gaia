#include "protheus.ch"

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
			u_p10_cadastro()
		elseif cOpcao == aOpcoes[2]
			u_p11_cadastro()
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

//ACTIVATE DIALOG oDlg CENTERED
	oDlg:Activate( oDlg:bLClicked, oDlg:bMoved, oDlg:bPainted,.T.,,,, oDlg:bRClicked, )
//oDlg:Activate()

Return cOpcao
