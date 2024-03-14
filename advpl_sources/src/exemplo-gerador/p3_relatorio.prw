#include "protheus.ch"
#Include "FWMVCDef.ch"
#INCLUDE "FWPrintSetup.ch"
#INCLUDE "RPTDEF.CH"

//Ignorar, rotina somente para rodar o código exemplos
user function P3_RELATORIO()

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE 'Janela Principal'
	ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT ( proc_01() , oMainWnd:End() )
return

// Gerar um relatório de produtos com código e nome
static function proc_01()
	//>>> opcional, mas recomendado para rotinas do usuário
	Local aArea   := GetArea()
	//<<<
	local oPrint
	local nRow := 99
	local nPage := 0

	oPrint := FwMsPrinter():New('produtos', IMP_PDF, .T.,,.T.,,,'NOME_IMPRESSORA')
	oPrint:SetPortrait()
	oPrint:SetPaperSize(DMPAPER_A4)
	oPrint:SetMargin(50, 50, 50, 50)

	dbSelectArea("SB1")
	dbSetOrder(0)
	dbGotop()

	while !eof()

		if nRow > 55
			printHeader(oPrint, @nPage, @nRow)
		endif

		oPrint:Say( nRow*50, 50, str(nRow, 5))
		oPrint:Say( nRow*50, 150, B1_COD)
		oPrint:Say( nRow*50, 550, B1_DESC)

		nRow++

		if nRow > 55
			printFooter(oPrint, @nPage, @nRow)
		endif

		dbSkip()
	enddo

	oPrint:Setup()
	if oPrint:nModalResult == PD_OK
		oPrint:Preview()
	EndIf
	//>>> recomendado
	RestArea(aArea)
	//<<<

Return(.T.)

static function printHeader(oPrint, nPage, nRow)
	nRow := 2
	nPage++

	oPrint:StartPage()

	oPrint:Say( nRow*50, 50, "Cabeçalho do relatório")
	oPrint:Say( nRow*50, 550, dtoc(date()) + " " + time() )
	nRow++

	oPrint:Say( nRow*50, 150, "Codigo")
	oPrint:Say( nRow*50, 550, "Descrição")
	nRow += 0.5

	oPrint:Line ( nRow*50, 50, nRow*50, 800, nil, "-4" )
	nRow += 0.5

Return Nil

static function printFooter(oPrint, nPage, nRow)
	nRow += 0.5

	oPrint:Line ( nRow*50, 50, nRow*50, 800, nil, "-4" )
	nRow += 0.5

	oPrint:Say( nRow*50, 450, strZero(nPage, 3))

	oPrint:endPage()

return
