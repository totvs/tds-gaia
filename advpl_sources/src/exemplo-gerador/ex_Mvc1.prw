// basico: Montar tela para cadastro de clientes usando MVC
// basico: Montar tela para tabela SA1 usando MVC
// basico: Montar uma Mod 1 para SA1 usando MVC
// basico: Criar um exemplo de tela usando MVC

#include "protheus.ch"
#Include "FWMVCDef.ch"
	

user function MVC_CADASTRO()
	Local aArea   := GetArea()
	Local oBrowse

	dbSelectArea("SA1")

	oBrowse := FWMBrowse():New()
	oBrowse:SetAlias("SA1")
	oBrowse:SetDescription("Cadastro de Clientes")

	oBrowse:Activate()

	RestArea(aArea)
Return Nil

static Function MenuDef()
return FWMVCMenu("MVC_CADASTRO")

static Function ModelDef()
	Local oModel := Nil
	Local oStSA1 := FWFormStruct(1, "SA1")

	oModel := MPFormModel():New("MVC_CADASTRO",/*bPre*/, /*bPos*/,/*bCommit*/,/*bCancel*/)
	oModel:AddFields("FORMSA1",/*cOwner*/,oStSA1)
	oModel:SetPrimaryKey({"A1_FILIAL","A1_CODIGO"})
	oModel:SetDescription("Cadastro de Clientes")
	oModel:GetModel("FORMSA1"):SetDescription("Formul�rio do Cadastro Cliente")


		
Return oModel

Static Function ViewDef()
	Local oModel := FWLoadModel("MVC_CADASTRO")
	Local oStSA1 := FWFormStruct(2, "SA1") 
	Local oView := Nil

	oView := FWFormView():New()
	oView:SetModel(oModel)
	oView:AddField("VIEW_SA1", oStSA1, "FORMSA1")
	oView:CreateHorizontalBox("TELA",100)
	oView:EnableTitleView("VIEW_SA1", "Clientes" )
	oView:SetCloseOnOk({||.T.})
	oView:SetOwnerView("VIEW_SA1","TELA")

Return oView
