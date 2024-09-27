#INCLUDE "PROTHEUS.CH"
#INCLUDE "FWADAPTEREAI.CH"
//#INCLUDE "ATFI010.CH"

#Define FILIAL  01
#Define CBASE   02
#Define ITEM    03
#Define TIPO    04
#Define BAIXA   05
#Define SEQ     06
#Define HISTOR  07
#Define CCONTAB 08
#Define CUSTBEM 09
#Define DINDEPR 10
#Define VORIG1  11
#Define TXDEPR1 12
#Define TPSALDO 13
#Define IDEXT   14

//-------------------------------------------------------------------
/*/{Protheus.doc} ATFI010

Funcao de integracao com o adapter EAI para envio e recebimento do
cadastro de ativos (SN1, SN3) utilizando o conceito de mensagem unica.

@param   Caracter, cXML, Variavel com conteudo xml para envio/recebimento.
@param   Número, nTypeTrans, Tipo de transacao. (Envio/Recebimento)
@param   Caracter, cTypeMessage, Tipo de mensagem. (Business Type, WhoIs, etc)

@author  Mateus Gustavo de Freitas e Silva
@version P11
@since   19/10/2012
@return  Array, Array contendo o resultado da execucao e a mensagem Xml de retorno.
         aRet[1] - (boolean) Indica o resultado da execução da função
         aRet[2] - (caracter) Mensagem Xml para envio

@obs
O método irá retornar um objeto do tipo TOTVSBusinessEvent caso
o tipo da mensagem seja EAI_BUSINESS_EVENT ou um tipo
TOTVSBusinessRequest caso a mensagem seja do tipo TOTVSBusinessRequest.
O tipo da classe pode ser definido com a função EAI_BUSINESS_REQUEST.
/*/
//-------------------------------------------------------------------
Function ATFI010(cXML, nTypeTrans, cTypeMessage, cVersion)
	Local lRet             := .T.
	Local cXMLRet          := ""
	Local nCount           := 1
	Local cError           := ""
	Local cWarning         := ""
	Local aAtivos          := {}
	Local cCode            := ""
	Local cItem            := ""
	Local cFornecedor      := ""
	Local cEvent           := "upsert"
	Local cValInt          := ""
	Local cValIntItem      := ""
	Local cValExt          := ""
	Local cProduct         := ""
	Local cEmp             := ""
	Local cFil             := ""
	LOCAL cFiltro          := ""
	Local cAlias           := "SN1"
	Local cField           := "N1_CBASE"
	Local cAliasItem       := "SN3"
	Local cFieldItem       := "N3_CBASE"
	Local aItens           := {}
	Local aItem            := {}
	Local aAuxItm          := {}
	Local dDinDepr         := Nil
	Local aArea            := {SN1->(GetArea()),SN3->(GetArea()),XXF->(GetArea())}
	Local aAux             := {}
	Local cAux             := ""
	Local cTipAtiv         := ""
	Local nI               := 1
	Local cSeek            := ""
	Local aItemUpd         := {}
	Local aItensUpd        := {}
	Local lLog             := FindFunction("AdpLogEAI")
	Local aDePara          := {}
	Local nCont            := 0
	Local aTranFil         := {.F.}
	Local aDelSN3          := {}
	Local dDtAquisic       := Nil
	local cVersaoForne	  :=""
	Local lContabiliza     := .F.

	//Variaveis para manipulação de Parâmetros
	Local dParUld          := dDataBase
	Local nPerPa1          := 2
	Local nPerPa2          := 2
	Local nPerPa3          := 2

	Private oXml           := Nil
	Private oXmlItem       := Nil
	Private lMsErroAuto    := .F.
	Private lMsHelpAuto    := .T.
	Private lAutoErrNoFile := .T.

	Pergunte("AFA060", .F.)

	IIf(lLog, AdpLogEAI(1, "ATFI010", nTypeTrans, cTypeMessage, cXML), ConOutR("STR{0}"))

	If nTypeTrans == TRANS_RECEIVE
		If cTypeMessage == EAI_MESSAGE_BUSINESS

			// Faz o parse do xml em um objeto
			oXml := XmlParser(cXml, "_", @cError, @cWarning)

			// Se não houve erros
			If oXml != Nil .And. Empty(cError) .And. Empty(cWarning)
				// Verifica se o código do Ativo
				If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Code:Text") == "U" .Or. Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Code:Text)
					lRet    := .F.
					cXmlRet := "STR{0}"//"O código do ativo (Code) é obrigatório!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
					Return {lRet,cXMLRet}
				Else
					cCode := PadR(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Code:Text,TamSX3("N1_CBASE")[1])
				EndIf

				// Verifica se o InternalId foi informado
				If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_InternalId:Text") == "U" .Or. Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_InternalId:Text)
					lRet    := .F.
					cXmlRet := "STR{0}"//"O código do InternalId é obrigatório!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
					Return {lRet, cXMLRet}
				Else
					cValExt := oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_InternalId:Text
				EndIf

				// Verifica se o código do Ativo
				If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ItemNumber:Text") == "U" .Or. Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ItemNumber:Text)
					cItem := PADL("1", TAMSX3("N1_ITEM")[1], "0")
				Else
					cItem := PadR(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ItemNumber:Text,TamSX3("N1_ITEM")[1])
				EndIf

				// Verifica se o Ativo será contabilizado
				If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_IsCalculated:Text") == "U" .Or. Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_IsCalculated:Text)
					lContabiliza := .T.
				Else
					If Upper(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_IsCalculated:Text) == "TRUE"
						lContabiliza := .T.
					Else
						lContabiliza := .F.
					EndIf
				EndIf

				// Código do Produto da Integração
				cProduct := oXml:_TOTVSMessage:_MessageInformation:_Product:_Name:Text

				// Filial do Produto
				aAdd(aAtivos, {"N1_CBASE", PadR(cCode, TamSx3("N1_CBASE")[1]), Nil})

				// Pesquisa o IntenalId do Ativo
				aAux := IntAdvInt(cValExt, cProduct)

				If Upper(oXml:_TOTVSMessage:_BusinessMessage:_BusinessEvent:_Event:Text) == "UPSERT"
					If aAux[1]
						nOpcx := 4 // Alteração

						// Obtém o item do de/para
						cItem := PadR(aAux[2][4], TamSx3("N1_ITEM")[1])

						// Insere o item obtido no array
						aAdd(aAtivos, {"N1_ITEM", cItem, Nil})

						// Chama rotina de transferência
						aTranFil := GetFilAtv(oXml, aAux[2][2], cProduct)

						// Houve transferência de filial?
						If aTranFil[1]
							// Monta InternalId com a filial de destino
							cValInt := IntAdvExt(, aTranFil[2], aAux[2][3], cItem)[2]
							// Insere filial de destino no array
							aAdd(aAtivos, {"N1_FILIAL", aTranFil[2], Nil})
						Else
							// Monta InternalId com filial de origem
							cValInt := IntAdvExt(, , aAux[2][3], cItem)[2]
							// Insere filial de origem no array
							aAdd(aAtivos, {"N1_FILIAL", PadR(xFilial("SN1"), TamSx3("N1_FILIAL")[1]), Nil})
						EndIf
					Else
						nOpcx := 3 // Inclusão

						aAdd(aAtivos, {"N1_ITEM", PadR(cItem, TamSx3("N1_ITEM")[1]), Nil})

						// Verifica se a filial do MessageInformation é a mesma do BusinessContent
						If FindFunction("IntChcEmp")
							aAux := IntChcEmp(oXML, cAlias, cProduct)
							If !aAux[1]
								lRet := aAux[1]
								cXmlRet := aAux[2]
								IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
								Return {lRet, cXmlRet}
							EndIf
						EndIf

						// Chave interna será filial + código
						cValInt  := IntAdvExt(, , cCode, cItem)[2]

						aAdd(aAtivos, {"N1_FILIAL", PadR(xFilial("SN1"), TamSx3("N1_FILIAL")[1]), Nil})
					EndIf

					// Verifica se o Código do Fornecedor é válido
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_VendorInternalId:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_VendorInternalId:Text)
						cVersaoForne := RTrim(PmsMsgUVer("CUSTOMERVENDOR","MATA020"))
						aAux := IntForInt(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_VendorInternalId:Text, cProduct, alltrim(cVersaoForne))
						If !aAux[1]
							lRet := aAux[1]
							cXmlRet := aAux[2]
							IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
							Return {lRet, cXMLRet}
						Else
							if cVersaoForne = "1.000"
								aAdd(aAtivos, {"N1_FORNEC", aAux[2][1], Nil})
								aAdd(aAtivos, {"N1_LOJA",   aAux[2][2], Nil})
							else
								aAdd(aAtivos, {"N1_FORNEC", aAux[2][3], Nil})
								aAdd(aAtivos, {"N1_LOJA",   aAux[2][4], Nil})
							endif
						EndIf
					EndIf

					// Descrição Sintética
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Description:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Description:Text)
						aAdd(aAtivos, {"N1_DESCRIC", oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Description:Text, Nil})
					EndIf
					// Data de Aquisição
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_PurchaseDate:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_PurchaseDate:Text)
						dDtAquisic := SToD(Alltrim(SubStr(StrTran(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_PurchaseDate:Text, "-", ""), 1, 8)))
						aAdd(aAtivos, {"N1_AQUISIC", dDtAquisic, Nil})
					EndIf
					// Quantidade do Bem
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Amount:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Amount:Text)
						aAdd(aAtivos, {"N1_QUANTD", Val(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_Amount:Text), Nil})
					EndIf
					// Número da Plaqueta
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CardAssets:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CardAssets:Text)
						aAdd(aAtivos, {"N1_CHAPA", oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CardAssets:Text, Nil})
					EndIf
					// Status Atual do Bem
					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_StatusAssets:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_StatusAssets:Text)
						aAdd(aAtivos, {"N1_STATUS", oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_StatusAssets:Text, Nil})
					EndIf

					If Type("oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ListOfSalesAndValuesAssets:_SalesAndValuesItem") != "A"
						XmlNode2Arr(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ListOfSalesAndValuesAssets:_SalesAndValuesItem, "_SalesAndValuesItem")
					EndIf

					For nI:= 1 To Len(oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ListOfSalesAndValuesAssets:_SalesAndValuesItem)
						oXmlItem := oXml:_TOTVSMessage:_BusinessMessage:_BusinessContent:_ListOfSalesAndValuesAssets:_SalesAndValuesItem[nI]

						If nOpcx == 3
							If XmlChildEx(oXmlItem,'_TYPEASSETS') <> Nil .And. !Empty(oXmlItem:_TypeAssets:Text)
								cTipAtiv := oXmlItem:_TypeAssets:Text
							EndIf

							// Filial
							aAdd(aAuxItm, {"N3_FILIAL", xFilial("SN3"), Nil})
							// Codigo do Bem
							aAdd(aAuxItm, {"N3_CBASE", cCode, Nil})
							// item
							aAdd(aAuxItm, {"N3_ITEM", cItem, Nil})
							// Tipo do Bem
							If XmlChildEx(oXmlItem,'_TYPEASSETS') <> Nil  .And. !Empty(oXmlItem:_TypeAssets:Text)
								aAdd(aAuxItm, {"N3_TIPO", oXmlItem:_TypeAssets:Text, Nil})
							Else
								lRet    := .F.
								cXmlRet := "STR{0}"//"O Tipo do Ativo (TypeAssets) é obrigatório!"
								IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
								Return {lRet, cXMLRet}
							EndIf
							// Baixa do item
							If XmlChildEx(oXmlItem,'_TYPEOCCURRENCE') <> Nil .And. !Empty(oXmlItem:_TypeOccurrence:Text)
								aAdd(aAuxItm, {"N3_BAIXA", oXmlItem:_TypeOccurrence:Text, Nil})
							EndIf
							// Conta contabil do item
							If XmlChildEx(oXmlItem,'_ASSETACCOUNT') <> Nil .And. !Empty(oXmlItem:_AssetAccount:Text)
								aAdd(aAuxItm, {"N3_CCONTAB", oXmlItem:_AssetAccount:Text, Nil})
							Else
								dbSelectArea("CT1")
								CT1->(dbSetOrder(1))

								If CT1->(dbSeek(xFilial("CT1") + "001"))
									aAdd(aAuxItm, {"N3_CCONTAB", "001", Nil})
								Else
									lRet    := .F.
									cXmlRet := "STR{0}" + cEmpAnt + "/" + cFilAnt + "."//"Plano de Contas 001 não cadastrado para a empresa " + cEmpAnt + "/" + cFilAnt + "."
									IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
									Return {lRet, cXMLRet}
								EndIf
							EndIf
							// Centro de custo do item
							If XmlChildEx(oXmlItem,'_COSTCENTERINTERNALID') <> Nil .And. !Empty(oXmlItem:_CostCenterInternalId:Text)

								aAux  := IntCusInt(oXmlItem:_CostCenterInternalId:Text, cProduct)

								If !aAux[1]
									lRet := aAux[1]
									cXmlRet := aAux[2]
									IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
									Return {lRet, cXMLRet}
								Else
									aAdd(aAuxItm, {"N3_CUSTBEM", aAux[2][3], Nil})
								EndIf
							EndIf
							// Taxa Anual da Depreciacao 1
							If XmlChildEx(oXmlItem,'_ANNUALRATECURRENCYDEPRECIATION') <> Nil  .And. !Empty(oXmlItem:_AnnualRateCurrencyDepreciation:Text)
								aAdd(aAuxItm, {"N3_TXDEPR1"  ,Val(oXmlItem:_AnnualRateCurrencyDepreciation:Text), Nil})
							EndIf
							// Data Inicio da Depreciacao do item
							If XmlChildEx(oXmlItem,'_DEPRECIATIONSTARTDATE') <> Nil .And. !Empty(oXmlItem:_DepreciationStartDate:Text)
								dDinDepr := SToD(Alltrim(SubStr(StrTran(oXmlItem:_DepreciationStartDate:Text,"-",""),1,8)))
								aAdd(aAuxItm, {"N3_DINDEPR", dDinDepr, Nil})
							EndIf
							// Tipo de Depreciacao
							If XmlChildEx(oXmlItem,'_METHODDEPRECIATION') <> Nil .And. !Empty(oXmlItem:_MethodDepreciation:Text)
								aAdd(aAuxItm, {"N3_TPDEPR", oXmlItem:_MethodDepreciation:Text, Nil})
							EndIf
							// Tipo de Saldo
							If XmlChildEx(oXmlItem,'_BALANCETYPE') <> Nil .And. !Empty(oXmlItem:_BalanceType:Text)
								aAdd(aAuxItm, {"N3_TPSALDO", oXmlItem:_BalanceType:Text, Nil})
							EndIf
							// Histórico
							If XmlChildEx(oXmlItem,'_OBSERVATION') <> Nil  .And. !Empty(oXmlItem:_Observation:Text)
								aAdd(aAuxItm, {"N3_HISTOR", oXmlItem:_Observation:Text, Nil})
							Else
								aAdd(aAuxItm, {"N3_HISTOR", "INTEGRAÇÃO " + cProduct + " INCLUSÃO", Nil})
							EndIf
							// Valor Origem da Moeda 1
							If XmlChildEx(oXmlItem,'_ORIGINALVALUECURRENCY') <> Nil .And. !Empty(oXmlItem:_OriginalValueCurrency:Text)
								aAdd(aAuxItm, {"N3_VORIG1", Val(oXmlItem:_OriginalValueCurrency:Text), Nil})
							EndIf
							// Saldo Depreciado
							If XmlChildEx(oXmlItem,'_BALANCEDEPRECIATION') <> Nil .And. !Empty(oXmlItem:_BalanceDepreciation:Text)
								aAdd(aAuxItm, {"N3_VRDACM1", Val(oXmlItem:_BalanceDepreciation:Text), Nil})
							EndIf

							// Contabiliza ativo
							If !lContabiliza
								// Atribui a data de início da depreciação para o último dia do mês anterior
								PutMv("MV_ULTDEPR", LastDay(MsSomaMes(dDtAquisic, -1, .F.)))

								// cria a cotação da origem no destino (SM2)
								SetCtDes(LastDay(MsSomaMes(dDtAquisic, -1, .F.)))

								// cria a cotação da origem no destino (SM2)
								SetCtDes(dDinDepr)
							EndIf
						Else //nOpcx == 4
							SN3->(dbSetOrder(1)) //N3_FILIAL+N3_CBASE+N3_ITEM+N3_TIPO+N3_BAIXA+N3_SEQ
							If SN3->(dbSeek(xFilial("SN3") + PadR(cCode, TamSx3("N3_CBASE")[1]) + PadR(cItem, TamSx3("N3_ITEM")[1]) + PadR(oXmlItem:_TypeAssets:Text, TamSx3("N3_TIPO")[1]) + PadR(oXmlItem:_TypeOccurrence:Text, TamSx3("N3_BAIXA")[1])))
								// Filial
								aAdd(aAuxItm, {"N3_FILIAL", SN3->N3_FILIAL, Nil})
								// Codigo do Bem
								aAdd(aAuxItm, {"N3_CBASE", SN3->N3_CBASE, Nil})
								// Item
								aAdd(aAuxItm, {"N3_ITEM", SN3->N3_ITEM, Nil})
								// Tipo do Bem
								aAdd(aAuxItm, {"N3_TIPO", SN3->N3_TIPO, Nil})
								// Baixa do item
								aAdd(aAuxItm, {"N3_BAIXA", SN3->N3_BAIXA, Nil})
								// Sequência do item
								aAdd(aAuxItm, {"N3_SEQ", SN3->N3_SEQ, Nil})
								// Conta contabil do item
								aAdd(aAuxItm, {"N3_CCONTAB", SN3->N3_CCONTAB, Nil})
								// Centro de custo do item
								aAdd(aAuxItm, {"N3_CUSTBEM", SN3->N3_CUSTBEM, Nil})
								// Taxa Anual da Depreciacao 1
								aAdd(aAuxItm, {"N3_TXDEPR1", SN3->N3_TXDEPR1, Nil})
								// Data Inicio da Depreciacao do item
								dDinDepr := SN3->N3_DINDEPR
								aAdd(aAuxItm, {"N3_DINDEPR", SN3->N3_DINDEPR, Nil})
								// Tipo de Depreciacao
								aAdd(aAuxItm, {"N3_TPDEPR", SN3->N3_TPDEPR, Nil})
								// Tipo de Saldo
								aAdd(aAuxItm, {"N3_TPSALDO", SN3->N3_TPSALDO, Nil})
								// Histórico
								aAdd(aAuxItm, {"N3_HISTOR", SN3->N3_HISTOR, Nil})
								// Valor Origem da Moeda 1
								aAdd(aAuxItm, {"N3_VORIG1", SN3->N3_VORIG1, Nil})
								// Saldo Depreciado
								aAdd(aAuxItm, {"N3_VRDACM1", SN3->N3_VRDACM1, Nil})
								// Comando da frame para permitir alterar o registro
								aAdd(aAuxItm, {"LINPOS", "N3_TIPO", oXmlItem:_TypeAssets:Text})

								// Centro de custo do item
								If XmlChildEx(oXmlItem,'_COSTCENTERINTERNALID') <> Nil .And. !Empty(oXmlItem:_CostCenterInternalId:Text)

									aAux  := IntCusInt(oXmlItem:_CostCenterInternalId:Text, cProduct)

									If !aAux[1]
										lRet := aAux[1]
										cXmlRet := aAux[2]
										IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
										Return {lRet, cXMLRet}
									EndIf

									// Se o centro de custo ou a filial for diferente altera o centro de custo ou filial pela rotina de transferência de ativo
									If (!Empty(aAux) .And. AllTrim(aAux[2][3]) != AllTrim(SN3->N3_CUSTBEM)) .Or. aTranFil[1]
										//Altera parametros para executar rotina automática de transferência, ATFA060, transferindo apenas o bem entre Centros de Custos

										nPerPa1  := mv_par01
										nPerPa2  := mv_par02
										nPerPa3  := mv_par03
										mv_par01 := 2
										mv_par02 := 2
										mv_par03 := 2

										If !lContabiliza
											//Altera parametro Data Ult. Depreciação para mês sequente a data informada como início da depreciação para permitir a inclusão.
											PutMv("MV_TIPDEPR", "2")
										EndIf

										If aTranFil[1]
											// Insere a filial de destino no array (SN3)
											aAdd(aItemUpd, {'N3_FILIAL', aTranFil[2], NIL})
											If !lContabiliza
												// Caso não exista, cria a cotação da origem no destino (SM2)
												SetCtDes(dDinDepr)
											EndIf
										Else
											aAdd(aItemUpd, {'N3_FILIAL', SN3->N3_FILIAL, NIL})
										EndIf

										aAdd(aItemUpd, {'N3_CBASE',   SN3->N3_CBASE,   NIL})
										aAdd(aItemUpd, {'N3_ITEM',    SN3->N3_ITEM,    NIL})
										aAdd(aItemUpd, {'N3_TIPO',    SN3->N3_TIPO,    NIL})
										aAdd(aItemUpd, {"N3_BAIXA",   SN3->N3_BAIXA,   Nil})
										aAdd(aItemUpd, {"N3_SEQ",     SN3->N3_SEQ,     Nil})
										aAdd(aItemUpd, {"N3_CUSTBEM", aAux[2][3],      Nil})
										aAdd(aItemUpd, {"N3_TPDEPR",  SN3->N3_TPDEPR,  Nil})
										aAdd(aItemUpd, {"N3_CCONTAB", SN3->N3_CCONTAB, Nil})

										aAdd(aItensUpd, aItemUpd)
										aItemUpd := {}
									EndIf
								EndIf
							Else //Acrescentar novo item
								If XmlChildEx(oXmlItem,'_TYPEASSETS') <> Nil .And. !Empty(oXmlItem:_TypeAssets:Text)
									cTipAtiv := oXmlItem:_TypeAssets:Text
								EndIf

								// Filial
								aAdd(aAuxItm, {"N3_FILIAL", xFilial("SN3"), Nil})
								// Codigo do Bem
								aAdd(aAuxItm, {"N3_CBASE", cCode, Nil})
								// item
								aAdd(aAuxItm, {"N3_ITEM", cItem, Nil})
								// Tipo do Bem
								If XmlChildEx(oXmlItem,'_TYPEASSETS') <> Nil .And. !Empty(oXmlItem:_TypeAssets:Text)
									aAdd(aAuxItm, {"N3_TIPO", oXmlItem:_TypeAssets:Text, Nil})
								Else
									lRet    := .F.
									cXmlRet := "STR{0}"//"O Tipo do Ativo (TypeAssets) é obrigatório!"
									IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
									Return {lRet, cXMLRet}
								EndIf
								// Baixa do item
								If XmlChildEx(oXmlItem,'_TYPEOCCURRENCE') <> Nil .And. !Empty(oXmlItem:_TypeOccurrence:Text)
									aAdd(aAuxItm, {"N3_BAIXA", oXmlItem:_TypeOccurrence:Text, Nil})
								EndIf
								// Conta contabil do item
								If XmlChildEx(oXmlItem,'_ASSETACCOUNT') <> Nil .And. !Empty(oXmlItem:_AssetAccount:Text)
									aAdd(aAuxItm, {"N3_CCONTAB", oXmlItem:_AssetAccount:Text, Nil})
								Else
									dbSelectArea("CT1")
									CT1->(dbSetOrder(1))

									If CT1->(dbSeek(xFilial("CT1") + "001"))
										aAdd(aAuxItm, {"N3_CCONTAB", "001", Nil})
									Else
										lRet    := .F.
										cXmlRet := "STR{0}" + cEmpAnt + "/" + cFilAnt + "."//"Plano de Contas 001 não cadastrado para a empresa " + cEmpAnt + "/" + cFilAnt + "."
										IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
										Return {lRet, cXMLRet}
									EndIf
								EndIf
								// Centro de custo do item
								If XmlChildEx(oXmlItem,'_COSTCENTERINTERNALID') <> Nil .And. !Empty(oXmlItem:_CostCenterInternalId:Text)

									aAux  := IntCusInt(oXmlItem:_CostCenterInternalId:Text, cProduct)

									If !aAux[1]
										lRet := aAux[1]
										cXmlRet := aAux[2]
										IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
										Return {lRet, cXMLRet}
									Else
										aAdd(aAuxItm, {"N3_CUSTBEM", aAux[2][3], Nil})
									EndIf
								EndIf
								// Taxa Anual da Depreciacao 1
								If XmlChildEx(oXmlItem,'_ANNUALRATECURRENCYDEPRECIATION') <> Nil .And. !Empty(oXmlItem:_AnnualRateCurrencyDepreciation:Text)
									aAdd(aAuxItm, {"N3_TXDEPR1"  ,Val(oXmlItem:_AnnualRateCurrencyDepreciation:Text), Nil})
								EndIf
								// Data Inicio da Depreciacao do item
								If XmlChildEx(oXmlItem,'_DEPRECIATIONSTARTDATE') <> Nil .And. !Empty(oXmlItem:_DepreciationStartDate:Text)
									dDinDepr := SToD(Alltrim(SubStr(StrTran(oXmlItem:_DepreciationStartDate:Text,"-",""),1,8)))
									aAdd(aAuxItm, {"N3_DINDEPR", dDinDepr, Nil})
								EndIf
								// Tipo de Depreciacao
								If XmlChildEx(oXmlItem,'_METHODDEPRECIATION') <> Nil .And. !Empty(oXmlItem:_MethodDepreciation:Text)
									aAdd(aAuxItm, {"N3_TPDEPR", oXmlItem:_MethodDepreciation:Text, Nil})
								EndIf
								// Tipo de Saldo
								If XmlChildEx(oXmlItem,'_BALANCETYPE') <> Nil .And. !Empty(oXmlItem:_BalanceType:Text)
									aAdd(aAuxItm, {"N3_TPSALDO", oXmlItem:_BalanceType:Text, Nil})
								EndIf
								// Histórico
								If XmlChildEx(oXmlItem,'_OBSERVATION') <> Nil .And. !Empty(oXmlItem:_Observation:Text)
									aAdd(aAuxItm, {"N3_HISTOR", oXmlItem:_Observation:Text, Nil})
								Else
									aAdd(aAuxItm, {"N3_HISTOR", "INTEGRACAO " + cProduct + " INCLUSAO", Nil})
								EndIf
								// Valor Origem da Moeda 1
								If XmlChildEx(oXmlItem,'_ORIGINALVALUECURRENCY') <> Nil .And. !Empty(oXmlItem:_OriginalValueCurrency:Text)
									aAdd(aAuxItm, {"N3_VORIG1", Val(oXmlItem:_OriginalValueCurrency:Text), Nil})
								EndIf
								// Saldo Depreciado
								If XmlChildEx(oXmlItem,'_BALANCEDEPRECIATION') <> Nil .And. !Empty(oXmlItem:_BalanceDepreciation:Text)
									aAdd(aAuxItm, {"N3_VRDACM1", Val(oXmlItem:_BalanceDepreciation:Text), Nil})
								EndIf
							EndIf
						EndIf

						aAdd(aItens, aAuxItm)
						aAuxItm := {}
					Next nI
				ElseIf Upper(oXml:_TOTVSMessage:_BusinessMessage:_BusinessEvent:_Event:Text) == "DELETE"
					nOpcx := 5 //Exclusão
					cFilAnt := aAux[2][2]
					aDelSN3 := FilSN3(cCode)
//            aDePara := GetDePara(cProduct, aDelSN3)

					cItem := PadR(aAux[2][4], TamSx3("N1_ITEM")[1])

					cValInt := IntAdvExt(, , aAux[2][3], cItem)[2]

					aAdd(aAtivos, {"N1_ITEM", cItem, Nil})
				Else
					lRet    := .F.
					cXmlRet := "STR{0}"//"O Event informado é inválido!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
					Return {lRet, cXMLRet}
				EndIf

				If lLog
					AdpLogEAI(4, nOpcx)
					AdpLogEAI(3, "STR{0}", aAtivos) // "Cabecalho Ativos: "
					AdpLogEAI(3, "STR{0}", aItens) // "Itens Ativos: "
					AdpLogEAI(3, "STR{0}", aItensUpd) // "Itens Transferência: "
					AdpLogEAI(3, "cValInt: ", cValInt)
					AdpLogEAI(3, "cValExt: ", cValExt)
					AdpLogEAI(3, "Tran. Fil: ", aTranFil[1])
				Else
					ConOutR("STR{0}")
				EndIf

				// Não alterar o produto quando transferir o ativo
				If nOpcx == 4 .And. aTranFil[1]

					// Atribui a data de início da depreciação da origem no destino
					SetMtDes(aTranFil[2], dDinDepr, dDtAquisic, lContabiliza)

					nI := 1

					While nI <= Len(aItensUpd) .And. !lMsErroAuto
						MSExecAuto({|x, y, z| AtfA060(x, y, z)}, aItensUpd[nI], nOpcx)

						nI += 1
					EndDo

					//Grava Parametros Originais
					mv_par01 := nPerPa1
					mv_par02 := nPerPa2
					mv_par03 := nPerPa3
				Else
					// Executa comando para insert, update ou delete conforme evento
					MSExecAuto({|x, y, z| ATFA010(x, y, z)}, aAtivos, aItens, nOpcx)

				EndIf

				// Se houve erros no processamento do MSExecAuto
				If lMsErroAuto

					aErroAuto := GetAutoGRLog()

					cXMLRet := '<![CDATA['
					For nCount := 1 To Len(aErroAuto)
						cXMLRet += aErroAuto[nCount] + Chr(10)
					Next nCount
					cXMLRet += ']]>'

					lRet := .F.
				Else
					If aTranFil[1]

						// Obtém o último item inserido na filial de destino
						cItem := GetItem(aTranFil[2], cCode)
						// Exclui o de/para anterior
						aAux := IntAdvInt(cValExt, cProduct)
						CFGA070Mnt(cProduct, cAlias, cField, cValExt, IntAdvExt(, aAux[2][2], aAux[2][3], aAux[2][4])[2], .T.)
						// Monta InternalId com o último item inserido no destino
						cValInt := IntAdvExt(, aTranFil[2], aAux[2][3], cItem)[2]
					EndIf

					If nOpcx != 5 // Se o evento é diferente de delete
						// Grava o registro na tabela XXF (de/para)

						CFGA070Mnt(cProduct, cAlias, cField, cValExt, cValInt, .F.)
						// Monta o XML de retorno
						cXMLRet := "<ListOfInternalId>"
						cXMLRet +=    "<InternalId>"
						cXMLRet +=       "<Name>" + "Assets" + "</Name>"
						cXMLRet +=       "<Origin>" + cValExt + "</Origin>" // Valor recebido na tag
						cXMLRet +=       "<Destination>" + cValInt + "</Destination>" // Valor XXF gerado
						cXMLRet +=    "</InternalId>"
						cXMLRet += "</ListOfInternalId>"

					Else

						CFGA070Mnt(cProduct, cAlias, cField, cValExt, cValInt, .T.)

					EndIf
				EndIf
			Else
				lRet    := .F.
				cXmlRet := "STR{0}"//"Erro ao parsear xml!"
			EndIf
		ElseIf cTypeMessage == EAI_MESSAGE_RESPONSE
			//Faz o parser do XML de retorno em um objeto
			oXML := xmlParser(cXML, "_", @cError, @cWarning)

			//Se não houve erros na resposta
			If Upper(oXML:_TOTVSMessage:_ResponseMessage:_ProcessingInformation:_Status:Text) == "OK"
				//Verifica se a marca foi informada
				If Type("oXML:_TOTVSMessage:_MessageInformation:_Product:_name:Text") != "U" .And. !Empty(oXML:_TOTVSMessage:_MessageInformation:_Product:_name:Text)
					cProduct := oXML:_TOTVSMessage:_MessageInformation:_Product:_name:Text
				Else
					lRet := .F.
					cXmlRet := "STR{0}" // "Erro no retorno. O Product é obrigatório!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", nTypeTrans, cTypeMessage, cXML), ConOutR("STR{0}"))
					Return {lRet, cXmlRet}
				EndIf

				//Se não for array
				If Type("oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId") != "A"
					//Transforma em array
					XmlNode2Arr(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId, "_InternalId")
				EndIf

				For nI := 1 To Len(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId)
					aAdd(aDePara, Array(3))

					//Verifica se o InternalId foi informado
					If XmlChildEx(oXML,'_TOTVSMESSAGE') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage,'_RESPONSEMESSAGE') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage,'_RETURNCONTENT') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent,'_LISTOFINTERNALID') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId,'_INTERNALID['+Str(nI)+']') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI],'_ORIGIN') <> Nil .And.;
							!Empty(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Origin:Text)

						aDePara[nI][1] := oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Origin:Text
					Else
						lRet    := .F.
						cXmlRet := "STR{0}" // "Erro no retorno. O OriginalInternalId é obrigatório!"
						IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
						Return {lRet, cXmlRet}
					EndIf

					//Verifica se o código externo foi informado
					If XmlChildEx(oXML,'_TOTVSMESSAGE') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage,'_RESPONSEMESSAGE') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage,'_RETURNCONTENT') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent,'_LISTOFINTERNALID') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId,'_INTERNALID['+Str(nI)+']') <> Nil .And.;
							XmlChildEx(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI],'_DESTINATION') <> Nil .And.;
							!Empty(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Destination:Text)
						//Não armazena Rateio
						aDePara[nI][2] := oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Destination:Text
					Else
						lRet := .F.
						cXmlRet := "STR{0}" // "Erro no retorno. O DestinationInternalId é obrigatório!"
						IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
						Return {lRet, cXmlRet}
					EndIf

					If lLog
						//Envia os valores de InternalId e ExternalId para o Log
						AdpLogEAI(3, "cValInt" + Str(nI) + ": ", aDePara[nI][1]) // InternalId
						AdpLogEAI(3, "cValExt" + Str(nI) + ": ", aDePara[nI][2]) // ExternalId
					Else
						ConOutR("STR{0}")
					EndIf

					If Upper(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Name:Text) $ 'ASSETS'
						aDePara[nI][3] := cAlias
					ElseIf Upper(oXML:_TOTVSMessage:_ResponseMessage:_ReturnContent:_ListOfInternalId:_InternalId[nI]:_Name:Text) $ 'SALESANDVALUESITEM'
						aDePara[nI][3] := cAliasItem
					EndIf
					//Incrementa contador que será usado no de/para
					nCont++
				Next nI

				//Obtém a mensagem original enviada
				If Type("oXML:_TOTVSMessage:_ResponseMessage:_ReceivedMessage:_MessageContent:Text") != "U" .And. !Empty(oXml:_TOTVSMessage:_ResponseMessage:_ReceivedMessage:_MessageContent:Text)
					cXML := oXml:_TOTVSMessage:_ResponseMessage:_ReceivedMessage:_MessageContent:Text
				Else
					lRet := .F.
					cXmlRet := "STR{0}" // "Conteúdo do MessageContent vazio!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
					Return {lRet, cXmlRet}
				EndIf

				//Faz o parse do XML em um objeto
				oXML := XmlParser(cXML, "_", @cError, @cWarning)

				//Se não houve erros no parse
				If oXML != Nil .And. Empty(cError) .And. Empty(cWarning)
					//Loop para manipular os InternalId no de/para
					For nI := 1 To nCont
						If Upper(oXML:_TOTVSMessage:_BusinessMessage:_BusinessEvent:_Event:Text) == "UPSERT"
							//Insere / Atualiza o registro na tabela XXF (de/para)
							CFGA070Mnt(cProduct, cAlias, aDePara[nI][3], aDePara[nI][2], aDePara[nI][1], .F.)
						ElseIf Upper(oXML:_TOTVSMessage:_BusinessMessage:_BusinessEvent:_Event:Text) == "DELETE"
							//Exclui o registro na tabela XXF (de/para)
							CFGA070Mnt(cProduct, cAlias, aDePara[nI][3], aDePara[nI][2], aDePara[nI][1], .T.)
						Else
							lRet := .F.
							cXmlRet := "STR{0}" // "Evento do retorno inválido!"
						EndIf
					Next nI
					cValInt := ""
					cValExt := ""
				Else
					lRet := .F.
					cXmlRet := "STR{0}" // "Erro no parser do retorno!"
					IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
					Return {lRet, cXmlRet}
				EndIf
			Else
				//Se não for array
				If Type("oXML:_TOTVSMessage:_ResponseMessage:_ProcessingInformation:_ListOfMessages:_Message") != "A"
					//Transforma em array
					XmlNode2Arr(oXML:_TOTVSMessage:_ResponseMessage:_ProcessingInformation:_ListOfMessages:_Message, "_Message")
				EndIf

				//Percorre o array para obter os erros gerados
				For nI := 1 To Len(oXML:_TOTVSMessage:_ResponseMessage:_ProcessingInformation:_ListOfMessages:_Message)
					cError := oXML:_TOTVSMessage:_ResponseMessage:_ProcessingInformation:_ListOfMessages:_Message[nI]:Text + Chr(13)
				Next nI

				lRet := .F.
				cXmlRet := cError
			EndIf
		ElseIf cTypeMessage == EAI_MESSAGE_WHOIS
			cXMLRet := '1.000|1.001'
		Endif
	ElseIf nTypeTrans == TRANS_SEND
		//Verica operação realizada
		If lLog
			Do Case
			Case Inclui
				AdpLogEAI(4, 3)
			Case Altera
				AdpLogEAI(4, 4)
			Otherwise
				AdpLogEAI(4, 5)
			EndCase
		Else
			ConOutR("STR{0}")
		EndIf

		If !Inclui .And. !Altera
			cEvent := "delete"

			M->N1_FILIAL  := SN1->N1_FILIAL
			M->N1_CBASE   := SN1->N1_CBASE
			M->N1_ITEM    := SN1->N1_ITEM
			M->N1_AQUISIC := SN1->N1_AQUISIC
			M->N1_DESCRIC := SN1->N1_DESCRIC
			M->N1_QUANTD  := SN1->N1_QUANTD
			M->N1_CHAPA   := SN1->N1_CHAPA
			M->N1_STATUS  := SN1->N1_STATUS
			M->N1_FORNEC  := SN1->N1_FORNEC
			M->N1_LOJA    := SN1->N1_LOJA
		Else
			DBSelectArea("SN3")
			SN3->(DbSetOrder(1))

			If SN3->(MsSeek(xfilial("SN1") + M->N1_CBASE + M->N1_ITEM))
				While (xfilial("SN1") + M->N1_CBASE + M->N1_ITEM == SN3->N3_FILIAL + SN3->N3_CBASE + SN3->N3_ITEM) .And. !SN3->(Eof())
					aItem := {}

					aAdd(aItem, SN3->N3_FILIAL ) //01
					aAdd(aItem, SN3->N3_CBASE  ) //02
					aAdd(aItem, SN3->N3_ITEM   ) //03
					aAdd(aItem, SN3->N3_TIPO   ) //04
					aAdd(aItem, SN3->N3_BAIXA  ) //05
					aAdd(aItem, SN3->N3_SEQ    ) //06
					aAdd(aItem, SN3->N3_HISTOR ) //07
					aAdd(aItem, SN3->N3_CCONTAB) //08
					aAdd(aItem, SN3->N3_CUSTBEM) //09
					aAdd(aItem, SN3->N3_DINDEPR) //10
					aAdd(aItem, SN3->N3_VORIG1 ) //11
					aAdd(aItem, SN3->N3_TXDEPR1) //12
					aAdd(aItem, SN3->N3_TPSALDO) //13

					aAdd(aItens, aItem)

					SN3->(DbSkip())
				EndDo
			EndIf
		EndIf

		cXMLRet := '<BusinessEvent>'
		cXMLRet +=    '<Entity>Assets</Entity>'
		cXMLRet +=    '<Event>' + cEvent + '</Event>'
		cXMLRet +=    '<Identification>'
		cXMLRet +=       '<key name="InternalID">' + IntAdvExt(, , M->N1_CBASE, M->N1_ITEM)[2] + '</key>'
		cXMLRet +=    '</Identification>'
		cXMLRet += '</BusinessEvent>'
		cXMLRet += '<BusinessContent>'
		cXMLRet +=    '<CompanyId>' + cEmpAnt + '</CompanyId>'
		cXMLRet +=    '<BranchId>' + xFilial("SN1") + '</BranchId>'
		cXMLRet +=    '<CompanyInternalId>' + cEmpAnt + '|' + xFilial("SN1") + '</CompanyInternalId>'
		cXMLRet +=    '<Code>' + AllTrim(M->N1_CBASE) + '</Code>'
		cXMLRet +=    '<InternalId>' + IntAdvExt(, , M->N1_CBASE, M->N1_ITEM)[2] + '</InternalId>'
		cXMLRet +=    '<PropertyCode>' + AllTrim(M->N1_CBASE) + '</PropertyCode>'
		cXMLRet +=    '<ItemNumber>' + AllTrim(M->N1_ITEM) + '</ItemNumber>'
		If !Empty(M->N1_AQUISIC)
			//cXMLRet +=    '<PurchaseDate>' + SubStr(AllTrim(M->N1_AQUISIC), 1, 4) + '-' + SubStr(AllTrim(M->N1_AQUISIC), 5, 2) + '-' + SubStr(AllTrim(M->N1_AQUISIC), 7, 2) + '</PurchaseDate>'
			cXMLRet +=    '<PurchaseDate>' + SubStr(DToC(M->N1_AQUISIC), 7, 4) + '-' + SubStr(DToC(M->N1_AQUISIC), 4, 2) + '-' + SubStr(DToC(M->N1_AQUISIC), 1, 2) + '</PurchaseDate>'
		EndIf
		cXMLRet +=    '<Description>' + AllTrim(M->N1_DESCRIC) + '</Description>'
		cXMLRet +=    '<Amount>' + AllTrim(cValToChar(M->N1_QUANTD)) + '</Amount>'
		cXMLRet +=    '<CardAssets>' + AllTrim(M->N1_CHAPA) + '</CardAssets>'
		cXMLRet +=    '<StatusAssets>' + IIf(AllTrim(M->N1_STATUS) =="1", "1", "2") + '</StatusAssets>'
		cXMLRet +=    '<VendorCode>' + AllTrim(M->N1_FORNEC) + '</VendorCode>'
//    cXMLRet +=    '<VendorInternalId>' + M->N1_FORNEC + '|' + AllTrim(M->N1_LOJA) + '</VendorInternalId>'
		cXMLRet +=    '<VendorInternalId>' + RTrim(IntForExt(/*cEmpresa*/, /*cFilial*/, M->N1_FORNEC, M->N1_LOJA)[2]) + '</VendorInternalId>'
		cXMLRet +=    '<ListOfSalesAndValuesAssets>'
		For nI := 1 To Len(aItens)
			cXMLRet +=    '<SalesAndValuesItem>'
			cXMLRet +=       '<InternalId>' + IntAdvExt(, , M->N1_CBASE, M->N1_ITEM, aItens[nI][TIPO], aItens[nI][BAIXA], aItens[nI][SEQ])[2] + '</InternalId>'
			cXMLRet +=       '<TypeAssets>' + AllTrim(aItens[nI][TIPO]) + '</TypeAssets>'
			cXMLRet +=       '<TypeOccurrence>' + '' + '</TypeOccurrence>'
			cXMLRet +=       '<Observation>' + AllTrim(aItens[nI][HISTOR]) + '</Observation>'
			cXMLRet +=       '<AssetAccount>' + AllTrim(aItens[nI][CCONTAB]) + '</AssetAccount>'
			cXMLRet +=       '<CostCenterCode>' + AllTrim(aItens[nI][CUSTBEM]) + '</CostCenterCode>'
			//cXMLRet +=       '<CostCenterInternalId>' + xFIlial("CTT") + '|' + AllTrim(aItens[nI][CUSTBEM]) + '</CostCenterInternalId>'
			cXMLRet +=       '<CostCenterInternalId>' + IntCusExt(/*cEmpresa*/, /*cFilial*/, aItens[nI][CUSTBEM])[2] + '</CostCenterInternalId>'
			If !Empty(aItens[nI][DINDEPR])
				cXMLRet +=       '<DepreciationStartDate>' + SubStr(AllTrim(aItens[nI][DINDEPR]), 1, 4) + '-' + SubStr(AllTrim(aItens[nI][DINDEPR]), 5, 2) + '-' + SubStr(AllTrim(aItens[nI][DINDEPR]), 7, 2) + '</DepreciationStartDate>'
			EndIf
			cXMLRet +=       '<CurrencyCode>' + "01" + '</CurrencyCode>'
			cXMLRet +=       '<CurrencyInternalId>' + xFilial("CTO") + '|' + "01" + '</CurrencyInternalId>'
			cXMLRet +=       '<OriginalValueCurrency>' + AllTrim(cValToChar(aItens[nI][VORIG1])) + '</OriginalValueCurrency>'
			cXMLRet +=       '<AnnualRateCurrencyDepreciation>' + AllTrim(cValToChar(aItens[nI][TXDEPR1])) + '</AnnualRateCurrencyDepreciation>'
			cXMLRet +=       '<MethodDepreciation>' + "1" + '</MethodDepreciation>'
			cXMLRet +=       '<BalanceType>' + AllTrim(aItens[nI][TPSALDO]) + '</BalanceType>'
			cXMLRet +=    '</SalesAndValuesItem>'
		Next nI
		cXMLRet +=    '</ListOfSalesAndValuesAssets>'
		cXMLRet += '</BusinessContent>'
	EndIf

	AEval (aArea, {|x| RestArea(x)})

	IIf(lLog, AdpLogEAI(5, "ATFI010", cXMLRet, lRet), ConOutR("STR{0}"))
Return {lRet, cXMLRet}

//-------------------------------------------------------------------
/*/{Protheus.doc} IntAdvExt
Monta o InternalID do Ativo de acordo com o código passado
no parâmetro.

@param   cEmpresa   Código da empresa (Default cEmpAnt)
@param   cFil       Código da Filial (Default cFilAnt)
@param   cCode      Código do Bem
@param   cNumero    Número do Bem
@param   cTipo      Tipo
@param   cBaixa     Baixa
@param   cSeq       Sequência
@param   cVersao    Versão da mensagem única (Default 1.000)

@author  Roney de Oliveira
@version P11
@since   26/02/2013
@return  aResult Array contendo no primeiro parâmetro uma variável
         lógica indicando se o registro foi encontrado.
         No segundo parâmetro uma variável string com o InternalID
         montado.

@sample  IntAdvExt(, , '00001') irá retornar {.T.,'01|01|001|0001'}
/*/
//-------------------------------------------------------------------
Function IntAdvExt(cEmpresa, cFil, cCode, cNumero, cTipo, cBaixa, cSeq, cVersao)
	Local   aResult  := {}
	Local   cTemp    := ""
	Default cEmpresa := cEmpAnt
	Default cFil     := xFilial('SN1') // Cadastro compartilhado
	Default cVersao  := '1.000'

	If cVersao == '1.000'  .Or. cVersao == '1.001'
		cTemp := cEmpresa + '|' + RTrim(cFil) + '|' + RTrim(cCode)+ '|' + RTrim(cNumero)

		If !Empty(cTipo)
			cTemp += '|' + RTrim(cTipo) + '|' + RTrim(cBaixa)+ '|' + RTrim(cSeq)
		EndIf

		aAdd(aResult, .T.)
		aAdd(aResult, cTemp)
	Else
		aAdd(aResult, .F.)
		aAdd(aResult, "STR{0}" + Chr(10) + "STR{0}") // "Versão não suportada." "As versões suportadas são: 1.000"
	EndIf
Return aResult

//-------------------------------------------------------------------
/*/{Protheus.doc} IntAdvInt
Recebe um InternalID e retorna o código do Ativo.

@param   cInternalID InternalID recebido na mensagem.
@param   cRefer      Produto que enviou a mensagem
@param   cVersao     Versão da mensagem única (Default 1.000)

@author  Roney de Oliveira
@version P11
@since   27/02/2013
@return  aResult Array contendo no primeiro parâmetro uma variável
         lógica indicando se o registro foi encontrado no de/para.
         No segundo parâmetro uma variável array com a empresa,
         filial, o código do bem e o número do bem.

@sample  IntAdvIn('01|01|01') irá retornar {.T., {'01', '01', '001', '0001'}}
/*/
//-------------------------------------------------------------------
Function IntAdvInt(cInternalID, cRefer, cVersao)
	Local   aResult  := {}
	Local   aTemp    := {}
	Local   cTemp    := ''
	Local   cAlias   := 'SN1'
	Local   cField   := 'N1_CBASE'
	Default cVersao  := '1.000'

	cTemp := CFGA070Int(cRefer, cAlias, cField, cInternalID)

	If Empty(cTemp)
		aAdd(aResult, .F.)
		aAdd(aResult, "STR{0}" + cInternalID + "STR{0}") // "Ativo " + cInternalID + " não encontrado no de/para!"
	Else
		If cVersao == '1.000' .Or. cVersao == '1.001'
			aAdd(aResult, .T.)
			aTemp := Separa(cTemp, '|')
			aAdd(aResult, aTemp)
		Else
			aAdd(aResult, .F.)
			aAdd(aResult, "STR{0}" + Chr(10) + "STR{0}") // "Versão não suportada." "As versões suportadas são: 1.000"
		EndIf
	EndIf
Return aResult

//-------------------------------------------------------------------
/*/{Protheus.doc} GetDePara
Função para tratamento do de/para de registros da SN3

@param   cValInt InternalID pai

@author  Leandro Luiz da Cruz
@version P11
@since   08/05/2013
@return  aResult Array contendo no primeiro parâmetro o valor do
         InternalId de origem e no segundo parâmetro o InternalId
         de destino.
/*/
//-------------------------------------------------------------------
/*
Static Function GetDePara(cRefer, aFiliais)
   Local aResult := {}
   Local nI      := 0
   Local cValInt := ""
   Local cValExt := ""

   dbSelectArea("SN3")
   SN3->(dbSetOrder(1))

   For nI := 1 To Len(aFiliais)
      If SN3->(DbSeek(aFiliais[nI][1] + aFiliais[nI][2] + aFiliais[nI][3] + aFiliais[nI][4] + aFiliais[nI][5] + aFiliais[nI][6])) //N3_FILIAL, N3_CBASE, N3_ITEM, N3_TIPO, N3_BAIXA, N3_SEQ
         cValInt := RTrim(IntAdvExt(, aFiliais[nI][1], aFiliais[nI][2], aFiliais[nI][3], aFiliais[nI][4], aFiliais[nI][5], aFiliais[nI][6])[2])
         cValExt := RTrim(CFGA070Ext(cRefer, "SN3", "N3_CBASE", cValInt))
         aAdd(aResult, {cValExt, cValInt})
      EndIf
   Next nI
Return aResult
*/

//-------------------------------------------------------------------
/*/{Protheus.doc} GetFilAtv
Função para obter a filial enviada na mensagem e comparar com a
filial cadastrada para o Ativo. Visa informar se há transferência
do Ativo entre filiais

@param   oXml     Objeto XML da mensagem
@param   cFilAtu  Filial atual do Ativo
@param   cProduto Marca que enviou a mensagem

@author  Leandro Luiz da Cruz
@version P11
@since   09/07/2013
@return  aResult Array contendo no primeiro parâmetro valor boleano
         e no segundo parâmetro a filial para transferência do Ativo
/*/
//-------------------------------------------------------------------
Function GetFilAtv(oXml, cFilAti, cProduto)
	Local aResult := {}
	Local aAux    := {}
	Local cEmp    := cEmpAnt
	Local cFil    := ""

	aAdd(aResult, .F.)

	// Obtém a empresa enviada na mensagem
	If Type("oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CompanyId:Text") != "U" .And. !Empty(oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CompanyId:Text)
		cEmp := oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_CompanyId:Text
	EndIf

	// Obtém a Filial enviada na mensagem
	If Type("oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_BranchId:Text") != "U" .And. !Empty(oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_BranchId:Text)
		cFil := oXML:_TOTVSMessage:_BusinessMessage:_BusinessContent:_BranchId:Text
	EndIf

	// Obtém Empresa/Filial no de/para
	aAux := FWEAIEMPFIL(cEmp, cFil, cProduto)

	// Filial vinda no Business é diferente da filial do ativo na XXF?
	If aAux[2] != cFilAti
		aResult := {}
		aAdd(aResult, .T.)
		aAdd(aResult, aAux[2])
		cFilAnt := cFilAti
	Else
		cFilAnt := cFilAti
	EndIf
Return aResult

//-------------------------------------------------------------------
/*/{Protheus.doc} FilSN3
Função que recebe um ativo e retorna todos os itens do ativo na SN3.

@param   cBase Código do ativo

@author  Leandro Luiz da Cruz
@version P11
@since   02/08/2013
@return  aResult Array contendo os itens do ativo.
/*/
//-------------------------------------------------------------------
Static Function FilSN3(cBase)
	Local aResult := {}
	Local cQuery  := ""
	Local aAreaAnt := SN1->(GetArea())
	Local cAlias  := "SN3"//GetNextAlias()

	cQuery := "SELECT DISTINCT(N3_FILIAL), N3_CBASE ,N3_ITEM, N3_TIPO, N3_BAIXA, N3_SEQ FROM SN3" + cEmpAnt + "0 WHERE N3_CBASE = '" + cBase + "' AND N3_BAIXA = 0"
	cQuery := ChangeQuery(cQuery)

	If Select(cAlias) > 0
		(cAlias)->(dbCloseArea())
	Endif

	dbUseArea(.T.,"TOPCONN",TcGenQry(,,cQuery),cAlias,.T.,.T.)

	If Select(cAlias) > 0
		While (cAlias)->(!EOF())
			aAdd(aResult, {(cAlias)->N3_FILIAL, (cAlias)->N3_CBASE, (cAlias)->N3_ITEM, (cAlias)->N3_TIPO, (cAlias)->N3_BAIXA, (cAlias)->N3_SEQ})
			(cAlias)->(dbSkip())
		EndDo

		(cAlias)->(dbCloseArea())
	EndIf

	RestArea(aAreaAnt)
Return aResult

//-------------------------------------------------------------------
/*/{Protheus.doc} GetItem
Função que recebe a filial e o código do ativo e retorna o maior item
do ativo na SN3.

@param   cFil  Filial do Ativo
@param   cBase Código do Ativo

@author  Leandro Luiz da Cruz
@version P11
@since   02/08/2013
@return  cResult Número do maior item do ativo.
/*/
//-------------------------------------------------------------------
Static Function GetItem(cFil, cBase)
	Local cResult as character
	Local cQuery as character
	Local aAreaAnt as array
	Local cAlias as character
	local xxxxx as character
	cResult := PADL("1", TAMSX3("N1_ITEM")[1], "0")
	cQuery := ""
	aAreaAnt := SN1->(GetArea())
	cAlias := "SN3"

	cQuery := "SELECT MAX(N3_ITEM) N3_ITEM FROM SN3" + cEmpAnt + "0 WHERE N3_CBASE = '" + cBase + "' AND N3_FILIAL = '" + cFil + "'"
	cQuery := ChangeQuery(cQuery)

	If Select(cAlias) > 0
		(cAlias)->(dbCloseArea())
	EndIf

	dbUseArea(.T.,"TOPCONN",TcGenQry(,,cQuery),cAlias,.T.,.T.)

	If Select(cAlias) > 0
		If !Empty(AllTrim((cAlias)->N3_ITEM))
			cResult := (cAlias)->N3_ITEM
		EndIf
	EndIf

	(cAlias)->(dbCloseArea())

	RestArea(aAreaAnt)
Return cResult

//-------------------------------------------------------------------
/*/{Protheus.doc} SetMtDes
Função que recebe a filial, a data de início da depreciação e a data
de aquisição do ativo e altera o parâmetro MV_ULTDEPR para o mês anterior
de acordo com o parâmetro MV_TIPDEPR.

@param   FilDest   Filial do Ativo
@param   DtIniDep  Data de início de depreciação
@param   DtAquisic Data da aquisição

@author  Leandro Luiz da Cruz
@version P11
@since   02/08/2013
/*/
//-------------------------------------------------------------------
Function SetMtDes(FilDest, DtIniDep, DtAquisic, lContabiliza)
	Local cTemp       := cFilAnt
	Local dData       := Nil
	Local cTipDepr    := GetMv("MV_TIPDEPR", .F., "0")
	Local lSetCentury := __SetCentury()

	If !lSetCentury
		SET CENTURY ON
	EndIf

	////A data de depreciação está sendo calculada sobre a data de aquisição
	//DtIniDep := DtAquisic

	//Tp deprec p/bens adquiridos no meio do mes
	Do Case
	Case cTipDepr == "0" //0=Prop
		dData := DtIniDep
	Case cTipDepr == "1" //1=Mes cheio
		dData := LastDay(DtIniDep)
	Case cTipDepr == "2" //2=Mes post
		dData := FirstDay(MsSomaMes(DtIniDep, 1, .F.))
	Case cTipDepr == "3" //3=Ano prop c/ mes aquis prop
		dData := sToD(Year2Str(DtIniDep) + Month2Str(DtAquisic) + Day2Str(DtAquisic))
	Case cTipDepr == "4" //4=Ano prop c/mes aquis cheio
		dData := LastDay(sToD(Year2Str(DtIniDep) + Month2Str(DtAquisic) + "01"))
	Case cTipDepr == "5" //5=Ano post
		dData := sToD(StrZero(Year(DtIniDep) + 1, 4) + "0101")
	EndCase

	dData := DaySub(FirstDate(dData), 1)

	AdpLogEAI(3, "Data original da filial "  + cFilAnt + " (origem): ", SuperGetMv( "MV_ULTDEPR", .F., "", cFilAnt))
	If cFilAnt != FilDest
		AdpLogEAI(3, "Data original da filial "  + FilDest + " (destino): ", SuperGetMv( "MV_ULTDEPR", .F., "", FilDest))
	EndIf

	If !lContabiliza
		PutMv("MV_ULTDEPR", dData)

		// Cadastra a cotação para a transferência
		SetCtDes(dData)
	EndIf

	If cFilAnt != FilDest
		cFilAnt := FilDest

		If !lContabiliza
			PutMv("MV_ULTDEPR", dData)
			// Cadastra a cotação para a transferência
			SetCtDes(dData)
		EndIf
	EndIf

	AdpLogEAI(3, "Data modificada da filial "  + cFilAnt + " (origem): ", SuperGetMv( "MV_ULTDEPR", .F., "", cFilAnt))
	If cFilAnt != cTemp
		AdpLogEAI(3, "Data modificada da filial "  + FilDest + " (destino): ", SuperGetMv( "MV_ULTDEPR", .F., "", FilDest))
	EndIf

	cFilAnt := cTemp

	If !lSetCentury
		SET CENTURY OFF
	EndIf
Return

//-------------------------------------------------------------------
/*/{Protheus.doc} SetCtDes
Função que recebe uma data e insere uma cotação para a moeda 1 na data
recebida.

@param   DtIniDep Data de início de depreciação

@author  Leandro Luiz da Cruz
@version P11
@since   02/08/2013
/*/
//-------------------------------------------------------------------
Static Function SetCtDes(DtIniDep)
	Local aAreaAnt := SM2->(GetArea())

	dbSelectArea("SM2")
	SM2->(dbSetOrder(1))

	If !SM2->(dbSeek(DtIniDep))
		RecLock("SM2", .T.)
		SM2->M2_DATA   := DtIniDep
		SM2->M2_MOEDA1 := 1
		SM2->M2_INFORM := "S"
		MsUnLock()
	EndIf

	DtIniDep := DaySub(DtIniDep, 30)

	If !SM2->(dbSeek(DtIniDep))
		RecLock("SM2", .T.)
		SM2->M2_DATA   := DtIniDep
		SM2->M2_MOEDA1 := 1
		SM2->M2_INFORM := "S"
		MsUnLock()
	EndIf

	RestArea(aAreaAnt)
Return
