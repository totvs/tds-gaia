#include "protheus.ch"
#Include "FWMVCDef.ch"

//Ignorar, rotina somente para rodar o código exemplos
user function P2_CONSULTA(process)

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	if process == "01"
		DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE 'Janela Principal'
		ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT ( proc_01() , oMainWnd:End() )
	else
		DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE 'Janela Principal'
		ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT ( proc_02() , oMainWnd:End() )
	endif
return

// Montar um browse para a tabela de produtos
// Montar um browse para a SB1
static function proc_01()
	//>>> opcional, mas recomendado para rotinas do usuário
	Local aArea   := GetArea()
	//<<<

	//opcional
	dbSelectArea("SB1")

	mBrowse("SB1")

	//>>> recomendado
	RestArea(aArea)
	//<<<

Return(.T.)

// Montar um browse para a tabela de produtos, usando MVC
// Montar um browse para a SB1, usando MVC
static function proc_02()
	//>>> opcional, mas recomendado para rotinas do usuário
	Local aArea   := GetArea()
	//<<<
	Local oBrowse

	//opcional
	dbSelectArea("SB1")

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("SB1")
	oBrowse:SetDescription("Cadastro de Produtos")

	oBrowse:Activate()

	//>>> recomendado
	RestArea(aArea)
	//<<<
Return Nil

