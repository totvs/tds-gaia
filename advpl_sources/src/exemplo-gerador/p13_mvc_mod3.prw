#include "protheus.ch"
#Include "FWMVCDef.ch"

//Ignorar, rotina somente para rodar o cï¿½digo exemplos
user function P13_CADASTRO(process)

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	DEFINE WINDOW oMainWnd FROM 001,001 TO 400,500 TITLE "Janela Principal"
	ACTIVATE WINDOW oMainWnd MAXIMIZED ON INIT (proc_01() , oMainWnd:End())
return

// Listar as NFs  de um cliente selecionado
/*/{Protheus.doc} proc_01

Permite a visualização das NF emitidas um cliente selecionado.

@author Alan Candido
/*/
static function proc_01()
	//>>> opcional, mas recomendado para rotinas do usuï¿½rio
	Local aArea   := GetArea()
	//<<<
	Local oBrowse

	//opcional
	dbSelectArea("SA1")
	dbSelectArea("SF2")

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("SA1")
	oBrowse:SetDescription("Cadastro de Clientes")

	oBrowse:Activate()

	//>>> recomendado
	RestArea(aArea)
	//<<<
Return Nil

// static Function MenuDef()
// 	Local aRot := {}

// 	add option arotina title "VISUALIZAR" action "VIEWDEF.P1_CADASTRO" operation 2 access 0
// 	add option arotina title "INCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 3 access 0
// 	add option arotina title "ALTERAR"    action "VIEWDEF.P1_CADASTRO" operation 4 access 0
// 	add option arotina title "EXCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 5 access 0
// 	add option arotina title "IMPRIMIR"   action "VIEWDEF.P1_CADASTRO" operation 8 access 0
// 	add option arotina title "COPIAR"     action "VIEWDEF.P1_CADASTRO" operation 9 access 0

// Return aRot

// menu CRUD "automático"
// static Function ModelDef()
// return FWMVCMenu("p1_cadstro")

// definição do modelo
// static Function ModelDef()
// 	Local oModel := Nil
// 	Local oStSA1 := FWFormStruct(1, "SA1")
// 	Local oStSF2 := FWFormStruct(1, "SF2")

// 	oModel := MPFormModel():New("P13_CADASTRO",/*bPre*/, /*bPos*/,/*bCommit*/,/*bCancel*/)
// 	oModel:AddFields("SA1MASTER", /*cOwner*/, oStSA1)
// 	oModel:AddGrid("SF2DETAIL", "ZA1MASTER", oStSF2)
// 	oModel:SetRelation("SF2DETAIL", {;
// 		{ "F2_CLIENTE", "A1_COD" },;
// 		{ "F2_LOJA", "A1_LOJA" },;
// 		},;
// 		SF2->(IndexKey(1)))

// 	// oModel:AddFields("FORMSA1",/*cOwner*/,oStSA1)
// 	oModel:SetPrimaryKey({"A1_FILIAL","A1_CODIGO"})
// 	oModel:SetDescription("NF´s por cliente")
// 	oModel:GetModel("SA1MASTER"):SetDescription("Cliente")
// 	oModel:GetModel("SF2DEATIL"):SetDescription("Notas Fiscais")

// Return oModel

// // definição da visão
// Static Function ViewDef()
// 	Local oModel := FWLoadModel("P13_CADASTRO")
// 	Local oStSA1 := FWFormStruct(2, "SA1")  //pode se usar um terceiro parâmetro para filtrar os campos exibidos { |cCampo| cCampo $ "SA1_NOME|SA1_DTAFAL|"}
// 	Local oStSF2 := FWFormStruct(2, "SF2")  //pode se usar um terceiro parâmetro para filtrar os campos exibidos { |cCampo| cCampo $ "SA1_NOME|SA1_DTAFAL|"}
// 	Local oView := Nil

// 	oView := FWFormView():New()
// 	oView:SetModel(oModel)
// 	oView:AddField("VIEW_SA1", oStSA1, "SA1MASTER")
// 	oView:AddGrid("VIEW_SF2", oStSF2, "SF2DETAIL")

// 	oView:CreateHorizontalBox("SUPERIOR", 15)
// 	oView:CreateHorizontalBox("INFERIOR", 85)

// 	oView:SetOwnerView("VIEW_SA1", "SUPERIOR")
// 	oView:SetOwnerView("VIEW_SF2", "INFERIOR")

// 	// oView:CreateHorizontalBox("TELA",100)
// 	// oView:EnableTitleView("VIEW_SA1", "Clientes")
// 	// oView:SetCloseOnOk({||.T.})
// 	// oView:SetOwnerView("VIEW_SA1","TELA")

// Return oView

