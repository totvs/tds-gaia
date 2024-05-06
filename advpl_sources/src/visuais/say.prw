#include 'totvs.ch'

User Function TSay()
	Local oDlg, oFont, oSay
	local lista := {{1,2,3},{4,5,6,7}}
//	local map := { "a": { "n1": "v1" }}

	DEFINE DIALOG oDlg TITLE "Exemplo TSay" FROM 180,180 TO 550,700 PIXEL
	DEFINE SAY oSay FROM 10,10 TO 100,100 PIXEL
	
	// Cria Fonte para visualização
	oFont := TFont():New('Courier new',,-18,.T.)

	@ 10,01 say "Texto para exibição I" SIZE 200,20 COLORS CLR_RED,CLR_WHITE FONT oFont OF oDlg PIXEL

	oDlg := MSDialog():New(,oDlg,0,0,0,0,.T.,.T.)
	oDlg:lMaximized :=.T.


	// Cria o Objeto tSay usando o comando @ .. SAY
	@ 10,10 SAY oSay PROMPT 'Texto para exibição I' SIZE 200,20 COLORS CLR_RED,CLR_WHITE FONT oFont OF oDlg PIXEL

	ACTIVATE DIALOG oDlg CENTERED

Return
