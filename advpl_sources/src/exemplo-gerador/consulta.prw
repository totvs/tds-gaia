#include "protheus.ch"

user function consulta()

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	process2()

return

static function process()

	dbSelectArea("SB1")

	If ConPad1(, , , "SB1")

		//Se a consulta foi confirmada, mostra o produto selecionado
		MsgInfo("Produto selecionado foi " + SB1->B1_COD, "Atenção")

	EndIf

return

static function process2()
	dbSelectArea("SA1")

	mBrowse(, , , , "SA1")

return
