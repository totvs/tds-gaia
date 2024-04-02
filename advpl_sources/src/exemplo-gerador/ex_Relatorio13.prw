
// basico: Montar um relatório utilizando FwMsPrinter que contenha um texto 
// com opção de alinhamento horizontal e vertical e seleção de tipo de fonte
// complementar: O relatório deve ser impresso pelo SmartClient e em orientação de retrato
#INCLUDE "RPTDEF.CH"
#INCLUDE "COLORS.CH"
user function relTxt()
	
	Local oPrint                  := Nil
	Local cFilePrint              := "NomeDoRelatorio"
	Local lAdjustToLegacy         := .F.
	Local cLocal				  := "C:/temp/"
	Local bPrintInServer		  := .F.
	Local lDisabeSetup	          := .T.
	Local lTReport		          := .F.

	oPrint := FWMSPrinter():New( cFilePrint, IMP_PDF, lAdjustToLegacy, cLocal, lDisabeSetup,lTReport, , , bPrintInServer, , ,.f. )
	oPrint:SetResolution(72)
	oPrint:SetPortrait()
	oPrint:SetPaperSize(DMPAPER_A4)

	oPrint:lserver := bPrintInServer
	oPrint:linjob := .T.
	oPrint:cPathPDF	:= cLocal

	oPrint:StartPage()

	oFont1 := TFont():New('Courier new',,-18,.T.)
	oPrint:SayAlign( 10,10,"Texto para visualização",,1400, 200, CLR_HRED, 0, 2 )

	oPrint:EndPage()
	oPrint:Preview()

	FreeObj(oPrint)
	oPrint := Nil

Return(.T.)

