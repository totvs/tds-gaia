#include "protheus.ch"

#define ABC "xxxxxxx"

user function escolheNum(replay, replayPath, numbers)
	local n, cResp := "xxxxx", cMsg := ""
	local aOpcoes := {}
	private cOpcao
	private ondeEstou := "escolheNum"
	public aPublic := {}

	conout(ABC)
	conout()

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

	substr

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
	oDlg:cName := "oDlg"
	oDlg:cCaption := "Escolha um número"
	oDlg:nLeft := 0

	aEval(aaOpcoes, { |x,i| ;
		oBtn := TButton():Create(oDlg),;
		oBtn:cName := "oBtn" + strZero(i,1,0),;
		oBtn:cCaption := x,;
		oBtn:nLeft := 10,;
		oBtn:nTop := 10 + i * 20,;
		oBtn:nWidth := 180,;
		oBtn:nHeight := 20,;
		oBtn:onClick := {|| cOpcao := oBtn:cCaption, oDlg:End() },;
		oBtn:bLClicked := {|| cOpcao := oBtn:cCaption, oDlg:End() },;
		oBtn:bRClicked := {|| cOpcao := oBtn:cCaption, oDlg:End() },;

		})

//ACTIVATE DIALOG oDlg CENTERED
	oDlg:Activate( oDlg:bLClicked, oDlg:bMoved, oDlg:bPainted,.T.,,,, oDlg:bRClicked, )
//oDlg:Activate()

Return cOpcao
