
// basico: Montar um relatório utilizando FwMsPrinter com cabeçalho, rodapé e paginação
// complementar: O Relatório deve ser impresso pelo SmartClient e em orientação de retrato
#INCLUDE "RPTDEF.CH"
user function relatorio()
	
	Local oPrint                  := Nil
	Local cFilePrint              := "NomeDoRelatorio"
	Local lAdjustToLegacy         := .F.
	Local cLocal				  := "C:/temp/"
	Local bPrintInServer		  := .F.
	Local lDisabeSetup	          := .T.
	Local lTReport		          := .F.
	Local nRow					  := 15
	Local nCol					  := 250

	oPrint := FWMSPrinter():New( cFilePrint, IMP_PDF, lAdjustToLegacy, cLocal, lDisabeSetup,lTReport, , , bPrintInServer, , ,.f. )
	oPrint:SetResolution(72)
	oPrint:SetPortrait()
	oPrint:SetPaperSize(DMPAPER_A4)

	oPrint:lserver := bPrintInServer
	oPrint:linjob := .T.
	oPrint:cPathPDF	:= cLocal

	oPrint:StartPage()

	oPrint:Say( nRow, nCol, "Cabeçalho")
	nRow += 10
	oPrint:Line ( nRow, 10, nRow, 560, nil, "-4" )

	nRow *= 10 
	nCol := 20
	oPrint:Say( nRow, nCol, "Conteúdo")

	nRow := 800
	oPrint:Line ( nRow, 10, nRow, 560, nil, "-4" )	
	nRow += 10
	nCol := 250
	oPrint:Say( nRow, nCol, "Rodapé")

	oPrint:EndPage()
	oPrint:Preview()

	FreeObj(oPrinter)
	oPrinter := Nil

Return(.T.)

