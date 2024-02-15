#include "protheus.ch"

user function cadastro()

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	process()

return

static function process()
	// Local aRotAdic :={}
	// Local bPre := {||MsgAlert('Chamada antes da função')}
	// Local bOK  := {||MsgAlert('Chamada ao clicar em OK'), .T.}
	// Local bTTS  := {||MsgAlert('Chamada durante transacao')}
	// Local bNoTTS  := {||MsgAlert('Chamada após transacao')}
	// Local aButtons := {}//adiciona botões na tela de inclusão, alteração, visualização e exclusao
	// aadd(aButtons,{ "PRODUTO", {|| MsgAlert("Teste")}, "Teste", "Botão Teste" }  ) //adiciona chamada no aRotina
	// aadd(aRotAdic,{ "Adicional","U_Adic", 0 , 6 })
	//AxCadastro("SA1", "Clientes", "U_DelOk()", "U_COK()", aRotAdic, bPre, bOK, bTTS, bNoTTS, , , aButtons, , )

	dbSelectArea("SA1")
	AxCadastro("SA1")

Return(.T.)

User Function DelOk()
	MsgAlert("Chamada antes do delete")
Return

User Function COK()
	MsgAlert("Clicou botao OK")
Return .t.

User Function Adic()
	MsgAlert("Rotina adicional")
Return
