#include "protheus.ch"

//Fonte: https://tdn.totvs.com/display/tec/Tipagem+de+Dados
static function primitive()
	local n1 as numeric
	local c1 as character //char
	local d1 as date
	local b1 as codeblock //block
	local m1 as memo //não documentado, mas existe em tabelas
	local l1 as logical //boolean
	local a1 as array
	local o1 as object
	local u1 //undefined, contem NIL

	conout(n1)
	conout(c1)
	conout(d1)
	conout(b1)
	conout(m1)
	conout(l1)
	conout(a1)
	conout(o1)
	conout(u1)
Return

//Fonte: https://tdn.totvs.com/display/tec/Tipagem+de+Dados
static function inferPrimitive()
	local n1  := 0
	local c1  := ""
	local d1   := date()
	local b1   := {||}
	//local m1 as memo //não documentado, mas existe em tabelas
	local l1   := .t.
	local a1   := []
	local o1   := object():new()
	local u1  := NIL

	conout(n1)
	conout(c1)
	conout(d1)
	conout(b1)
	conout(m1)
	conout(l1)
	conout(a1)
	conout(o1)
	conout(u1)
Return

user function _escolheNum(replay, replayPath, numbers)
	local n, cResp  := "", cMsg := ""
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
		if n % 2 == 0
			aAdd(aOpcoes, "1")
		else
			aAdd(aOpcoes, "2")
		endif

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


static Function TAF012()
	Local oBrowse := Nil
	local cCadastro := "Cadastro de Eventos R-4030"

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("C8E")
	oBrowse:SetDescription("Eventos R-4030")

	oBrowse:Activate()
Return Ni
