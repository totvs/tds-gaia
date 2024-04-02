#include "protheus.ch"
#Include "FWMVCDef.ch"

// basico: Montar um axcadastro para a tabela de clientes
// basico: Montar um axcadastro para SA1
// basico: Montar uma Mod 1 para SA1
// basico: Montar tela para cadastro de clientes
// basico: Montar tela para tabela SA1
user function AXCADASTRO()
	Local aArea   := GetArea()
	dbSelectArea("SA1")
	AxCadastro("SA1")
	RestArea(aArea)
Return(.T.)
