#include "TOTVS.CH"

User Function TFolder()

	DEFINE DIALOG oDlg TITLE "Exemplo TFolder" FROM 180,180 TO 550,700 PIXEL
	// Cria a Folder
	aTFolder := { 'Aba 01', 'Aba 02', 'Aba 03' }
	oTFolder := TFolder():New( 0,0,aTFolder,,oDlg,,,,.T.,,260,184 )

	// Insere um TGet em cada aba da folder
	cTGet1 := "Teste TGet 01"
	oTGet1 := TGet():New( 01,01,{||cTGet1},oTFolder:aDialogs[1],096,009,;
		"",,0,,,.F.,,.T.,,.F.,,.F.,.F.,,.F.,.F.,,cTGet1,,,, )

	cTGet2 := "Teste TGet 02"
	oTGet2 := TGet():New( 01,01,{||cTGet2},oTFolder:aDialogs[2],096,009,;
		"",,0,,,.F.,,.T.,,.F.,,.F.,.F.,,.F.,.F.,,cTGet2,,,, )

	cTGet3 := "Teste TGet 03"
	oTGet3 := TGet():New( 01,01,{||cTGet3},oTFolder:aDialogs[3],096,009,;
		"",,0,,,.F.,,.T.,,.F.,,.F.,.F.,,.F.,.F.,,cTGet3,,,, )

	ACTIVATE DIALOG oDlg CENTERED
Return
