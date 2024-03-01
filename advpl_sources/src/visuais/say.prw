#include 'totvs.ch'

User Function TSay()
	Local oDlg, oFont, oSay

	DEFINE DIALOG oDlg TITLE "Exemplo TSay" FROM 180,180 TO 550,700 PIXEL

	// Cria Fonte para visualização
	oFont := TFont():New('Courier new',,-18,.T.)

	// Cria o Objeto tSay usando o comando @ .. SAY
	@ 10,10 SAY oSay PROMPT 'Texto para exibição I' SIZE 200,20 COLORS CLR_RED,CLR_WHITE FONT oFont OF oDlg PIXEL

	ACTIVATE DIALOG oDlg CENTERED

Return
