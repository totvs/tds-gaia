
// basico: Montar um relatório utilizando FwMsPrinter que contenha um QRCode
// complementar: O Relatório deve ser impresso pelo Servidor em PDF e em orientação de paisagem
#Include "RPTDEF.CH"
User Function relQRCode()
 
	Local oPrint                  := Nil
	Local cFilePrint              := "NomeDoRelatorio"
	Local lAdjustToLegacy         := .F.
	Local cLocal				  := "C:/temp/"
	Local bPrintInServer		  := .T.
	Local lDisabeSetup	          := .T.
	Local lTReport		          := .F.

	RPCSetEnv("T1", "D MG 01","admin", "1234")

	oPrint := FWMSPrinter():New( cFilePrint, IMP_PDF, lAdjustToLegacy, cLocal, lDisabeSetup,lTReport, , , bPrintInServer, , ,.f. )
	oPrint:SetResolution(72)
	oPrint:SetLandscape()
	oPrint:SetPaperSize(DMPAPER_A4)
 
	oPrint:Setup()
	oPrint:lserver := bPrintInServer
	oPrint:linjob := .T.
	oPrint:cPathPDF	:= cLocal
 
	oPrint:QRCode(150,150,"QR Code gerado com sucesso", 100)
 
	oPrint:EndPage()
	oPrint:Preview()
	FreeObj(oPrint)
	oPrint := Nil
 
Return

