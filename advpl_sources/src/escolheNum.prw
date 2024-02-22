#include "protheus.ch"

user function escolheNum(replay, replayPath, numbers)
	local n, cResp := "xxxxx", cMsg := ""
	local aOpcoes := {}
	private cOpcao
	private ondeEstou := "escolheNum"
	public aPublic := {}


	if replay == "true"
		replay = .t.
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

	oDlg := MSDIALOG():Create()
	oDlg:cCaption := "Escolha um número"
	oDlg:cName := "oDlg"
	oDlg:lBorder :=.T.
	oDlg:lCaption :=.T.
	oDlg:nWidth := 300
	oDlg:nHeight := 150
	oDlg:lCentered :=.T.
	oDlg:lEscClose :=.T.
	oDlg:lMaximized :=.T.
	oDlg:lMinimized :=.T.
	oDlg:lSysMenu :=.T.
	oDlg:lSysButtons :=.T.
	oDlg:lSysClose :=.T.
	oDlg:lVisible :=.T.
	oDlg:lCentered :=.T.
	oDlg:lCentered :=.T.
	oDlg:lCentered :=.T.

	oSay1 := TSAY():Create(oDlg)
		
	// oSay1:cName := "oSay1"
	// oSay1:xxxxxxxxxx := "Escolha um número acionando um dos botões abaixo."
	// oSay1:nLeft := 10
	// oSay1:nTop := 28
	// oSay1:nWidth := 250
	// oSay1:nHeight := 17
	// oSay1:lTransparent := .T.

	oBtn := TButton():Create(oDlg)
	oBtn:cCaption := "<nenhum>"
	oBtn:blClicked := {|| cOpcao := "", oDlg:end() }
	oBtn:nWidth := 90
	oBtn:nTop := 90
	oBtn:nLeft := 10

	oBtn := TButton():Create(oDlg)
	oBtn:cCaption := "<encerrar>"
	oBtn:blClicked := {|| cOpcao := "*", oDlg:end() }
	oBtn:nWidth := 90
	oBtn:nTop := 90
	oBtn:nLeft := 110

	aEval(aaOpcoes, { |x,i| ;
		oBtn := TButton():Create(oDlg),;
		oBtn:cCaption := x,;
		oBtn:blClicked := {|| cOpcao := x, oDlg:end() },;
		oBtn:nWidth := 90,;
		oBtn:nTop := 90 + (i * 30),;
		oBtn:nLeft := 10;

		})

//ACTIVATE DIALOG oDlg CENTERED
	oDlg:Activate( oDlg:bLClicked, oDlg:bMoved, oDlg:bPainted,.T.,,,, oDlg:bRClicked, )
//oDlg:Activate()

Return cOpcao
