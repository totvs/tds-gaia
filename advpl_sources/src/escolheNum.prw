#include "protheus.ch"

user function escolheNum(replay, replayPath, numbers)
	local n, cResp := "", cMsg := ""
	local aOpcoes := {}
	private cOpcao
	private ondeEstou := "escolheNum"
	public aPublic := {}
	

	if replay == "true" .or. replay == "TRUE"
		replay = .t.
		numbers += "*"

		TDSReplay(.T. , {"*"}, {}, {"*"} , replayPath, 0 , .t. , "")
	endif
//

	for n := 1 to 5
		aAdd(aOpcoes, strZero(n,1,0))


	next
//
	n := 0
	while !(cResp == "*")
		if (replay)
			cOpcao = substr(numbers, 1, 1)
			numbers =  substr(numbers, 2)
			conout("BOT: select number " + cOpcao)
		else
			tela(aOpcoes)
		endif


		n++
		//cResp := trim(cOpcao)
		cResp := cOpcao

		if cResp == "1"
			cMsg := "Você escolheu o número 1"
		elseif cResp == "2"
			cMsg := "Você escolheu o número 2"
		elseif cResp == "3"
			cMsg := "Você escolheu o número 3"
		elseif cResp == "4"
			cMsg := "Você escolheu o número 4"
		elseif cResp == "5"
			cMsg := "Você escolheu o número 5"
		else
			cMsg := "Nenhum número escolhido"
		endif

		if !empty(cResp)
			if cResp == "2" .or. cResp == "4"
				cMsg += " e é PAR"
			else
				cMsg += " e é IMPAR"
			endif
		endif

		if !(cResp == "*")
			if replay
				conout("BOT: " + cMsg)
			else
				msgAlert(cMsg)
			endif
		endif

	enddo

	if replay
		TDSReplay(.F.)
	endif

return

static function tela(aaOpcoes)
	Local oDlg,oSay1 := "",oBtn

	if !(valType(aaOpcoes) == "A")
		msgAlerta("Parametro aaOpcoes não é uma lista (array)")
		return cOpcao
	endif

//listar produtos 
	oDlg := MSDIALOG():Create()
	oDlg:cName := "oDlg"
	oDlg:cCaption := "Escolha um número"
	oDlg:nLeft := 0
	oDlg:nTop := 0
	oDlg:nWidth := 300
	oDlg:nHeight := 150
	oDlg:lShowHint :=.F.
	oDlg:lCentered :=.T.
	oDlg:lEscClose :=.F.
	oDlg:lMaximized :=.F.
	oDlg:lMinimized :=.F.
	oDlg:lVisibleControl :=.T.
	oDlg:lDesign =.F.


//ACTIVATE DIALOG oDlg CENTERED
	oDlg:Activate( oDlg:bLClicked, oDlg:bMoved, oDlg:bPainted,.T.,,,, oDlg:bRClicked, )
//oDlg:Activate()

Return cOpcao


static Function TAF012()
	Local oBrowse := Nil

	Private cCadastro := STR0001 //"Cadastro de Eventos R-4030"
	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("C8E")
	oBrowse:SetDescription(STR0002) //"Eventos R-4030"
	
	oBrowse:Activate()
Return Ni
