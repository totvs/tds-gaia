#include "protheus.ch"
#Include "FWMVCDef.ch"

//Ignorar, rotina somente para rodar o código exemplos
user function P1_CADASTRO(process)

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	if process == "01"
		DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE 'Janela Principal'
		ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT ( proc_01() , oMainWnd:End() )
	else
		DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE 'Janela Principal'
		ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT ( proc_02() , oMainWnd:End() )
	endif
return

// Montar um axcadastro para a tabela de clientes
// Montar um axcadastro para SA1
// Montar uma Mod 1 para SA1
// Montar tela para cadastro de clientes
// Montar tela para tabela SA1
static function proc_01()
	//>>> opcional, mas recomendado para rotinas do usuário
	Local aArea   := GetArea()
	//<<<

	//opcional
	dbSelectArea("SA1")

	AxCadastro("SA1")

	//>>> recomendado
	RestArea(aArea)
	//<<<

Return(.T.)

// Montar tela para cadastro de clientes, usando MVC
// Montar tela para tabela SA1, usando MVC
// Montar uma Mod 1 para SA1, usando MVC

static function proc_02()
	//>>> opcional, mas recomendado para rotinas do usuário
	Local aArea   := GetArea()
	//<<<
	Local oBrowse

	//opcional
	dbSelectArea("SA1")

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("SA1")
	oBrowse:SetDescription("Cadastro de Clientes")

	oBrowse:Activate()

	//>>> recomendado
	RestArea(aArea)
	//<<<
Return Nil

static Function MenuDef()
	Local aRot := {}

	add option arotina title "VISUALIZAR" action "VIEWDEF.P1_CADASTRO" operation 2 access 0
	add option arotina title "INCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 3 access 0
	add option arotina title "ALTERAR"    action "VIEWDEF.P1_CADASTRO" operation 4 access 0
	add option arotina title "EXCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 5 access 0
	add option arotina title "IMPRIMIR"   action "VIEWDEF.P1_CADASTRO" operation 8 access 0
	add option arotina title "COPIAR"     action "VIEWDEF.P1_CADASTRO" operation 9 access 0

Return aRot

// menu CRUD "automático"
// static Function ModelDef()
// return FWMVCMenu("p1_cadstro")

// menu customizado
static Function ModelDef()
	Local oModel := Nil
	Local oStSA1 := FWFormStruct(1, "SA1")

	oModel := MPFormModel():New("proc_02",/*bPre*/, /*bPos*/,/*bCommit*/,/*bCancel*/)
	oModel:AddFields("FORMSA1",/*cOwner*/,oStSA1)
	oModel:SetPrimaryKey({"A1_FILIAL","A1_CODIGO"})
	oModel:SetDescription("Cadastro de Clientes")
	oModel:GetModel("FORMSA1"):SetDescription("Formulário do Cadastro Cliente")

Return oModel

Static Function ViewDef()
	Local oModel := FWLoadModel("P1_CADASTRO")
	Local oStSA1 := FWFormStruct(2, "SA1")  //pode se usar um terceiro parâmetro para filtrar os campos exibidos { |cCampo| cCampo $ "SA1_NOME|SA1_DTAFAL|"}
	Local oView := Nil

	oView := FWFormView():New()
	oView:SetModel(oModel)
	oView:AddField("VIEW_SA1", oStSA1, "FORMSA1")
	oView:CreateHorizontalBox("TELA",100)
	oView:EnableTitleView("VIEW_SA1", "Clientes" )
	oView:SetCloseOnOk({||.T.})
	oView:SetOwnerView("VIEW_SA1","TELA")

Return oView
