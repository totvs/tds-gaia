#include "protheus.ch"
#Include "FWMVCDef.ch"

// Montar tela para tabela  de clientes por estado informado, usando MVC
// Montar tela para tabela SA1, trazendo por estado informado, usando MVC
// Montar uma Mod 1 para SA1, filtrando por estado informado, usando MVC

/*/{Protheus.doc} proc_01

Permite a manutenção dos dados do cliente (SA1), previamente selecionados.

@author Alan Candido
/*/
user function P12_MVC_FILTER()
	//>>> opcional, mas recomendado para rotinas do usuï¿½rio
	Local aArea   := GetArea()
	//<<<
	Local oBrowse

	// Uma forma, também pode ser usada função:
	// - Pergunte
	// - Filtro pré-definido no dicionário de dados
	//u_zPutSX1("P12", "01", "UF?", "MV_PAR01", "", "C", 2, 0, "G", "", "SA1", "","", "", "", "", "", "Informe a UF para filtro")
	//pergunte("P12", .t.)
	//cUF := MV_PAR01
	cUf :="SP"

	//opcional
	dbSelectArea("SA1")

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("SA1")
	oBrowse:SetDescription("Cadastro de Clientes (Somente "+cUF+")")
	oBrowse:SetFilterDefault( "A1_EST=='"+cUF+"'" )

	oBrowse:Activate()

	//>>> recomendado
	RestArea(aArea)
	//<<<
Return Nil

static Function MenuDef()
	Local aRotina := {}

	add option aRotina title "VISUALIZAR" action "VIEWDEF.P1_CADASTRO" operation 2 access 0
	// add option aRotina title "INCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 3 access 0
	// add option aRotina title "ALTERAR"    action "VIEWDEF.P1_CADASTRO" operation 4 access 0
	// add option aRotina title "EXCLUIR"    action "VIEWDEF.P1_CADASTRO" operation 5 access 0
	// add option aRotina title "IMPRIMIR"   action "VIEWDEF.P1_CADASTRO" operation 8 access 0
	// add option aRotina title "COPIAR"     action "VIEWDEF.P1_CADASTRO" operation 9 access 0

Return aRotina

// menu CRUD "automático"
// static Function ModelDef()
// return FWMVCMenu("p1_cadstro")

// definição do modelo
static Function ModelDef()
	Local oModel := Nil
	Local oStSA1 := FWFormStruct(1, "SA1")

	oModel := MPFormModel():New("proc_02",/*bPre*/, /*bPos*/,/*bCommit*/,/*bCancel*/)
	oModel:AddFields("FORMSA1",/*cOwner*/,oStSA1)
	oModel:SetPrimaryKey({"A1_FILIAL","A1_CODIGO"})
	oModel:SetDescription("Cadastro de Clientes")
	oModel:GetModel("FORMSA1"):SetDescription("Formulário do Cadastro Cliente")

Return oModel

// definição da visão
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
