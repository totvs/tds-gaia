#include "TOTVS.CH"

User Function TBrowseButton()
	DEFINE DIALOG oDlg TITLE "Exemplo TBrowseButton" FROM 180,180 TO 550,700 PIXEL
	oTBrowseButton1 := TBrowseButton():New( 01,01,'TBrowseButton1',oDlg,;
		{||Alert('Clique em TBrowseButton1')},50,10,,,.F.,.T.,.F.,,.F.,,,)
	oTBrowseButton2 := TBrowseButton():New( 20,01,'TBrowseButton2',oDlg,;
		{||Alert('Clique em TBrowseButton2')},50,10,,,.F.,.T.,.F.,,.F.,,,)
	ACTIVATE DIALOG oDlg CENTERED
Return

