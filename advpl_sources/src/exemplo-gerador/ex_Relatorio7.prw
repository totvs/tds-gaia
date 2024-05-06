
// basico: Montar um relatório utilizando FwMsPrinter que contenha uma imagem
// complementar: O Relatório deve ser impresso localmente pelo SmartClient em PDF e em orientação de retrato
#INCLUDE "RPTDEF.CH"
user function relImg()
	
	Local oPrint                  := Nil
	Local cFilePrint              := "NomeDoRelatorio"
	Local lAdjustToLegacy         := .F.
	Local cLocal				  := "C:/temp/"
	Local cImagem                 := "<CAMINHO COMPLETO DA IMAGEM>"
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
	
	oPrint:SayBitmap(200,20, cImagem,550,200) 

	oPrint:EndPage()
	oPrint:Preview()

	FreeObj(oPrinter)
	oPrinter := Nil

Return(.T.)

