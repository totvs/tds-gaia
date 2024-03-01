#include "TOTVS.CH"

User Function MsWorkTime()
	DEFINE DIALOG oDlg TITLE "Exemplo MsWorkTime" FROM 180,180 TO 550,700 PIXEL
	oMsWorkTime := MsWorkTime():New(oDlg,01,01,260,184,0,'',{||.T.},{||} )
	oMsWorkTime:SetValue('X X XX X                          X X XX X')
	ACTIVATE DIALOG oDlg CENTERED
Return
