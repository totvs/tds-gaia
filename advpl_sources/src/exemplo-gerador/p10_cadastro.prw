#include "protheus.ch"
#Include "FWMVCDef.ch"
// Montar um axcadastro para a tabela de clientes
// Montar um axcadastro para SA1
// Montar uma Mod 1 para SA1
// Montar tela para cadastro de clientes
// Montar tela para tabela SA1

/*/{Protheus.doc} proc_01

Permite a manutenção dos dados do cliente (SA1).

@author Alan Candido
/*/
user function P10_CADASTRO()
	//>>> opcional, mas recomendado para rotinas do usuï¿½rio
	Local aArea   := GetArea()
	//<<<

	//opcional
	dbSelectArea("SA1")

	AxCadastro("SA1")

	//>>> recomendado
	RestArea(aArea)
	//<<<

Return(.T.)
