# Relato de testes (16/05/24)

## Resumo

Efetuado testes de geração de código. De 5 solicitações, apenas a primeira é aproveitada.

## MBrowse (grid) para SA1 (clientes)

### Descrição

```code
montar MBrowse para a tabela SA1
```

### Código

```code
# include "protheus.ch"
# Include "FWMVCDef.ch"

user function BROWSESA1()
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
return FWMVCMenu("BROWSESA1")

static Function ModelDef()
  Local oModel := Nil
  Local oStSA1 := FWFormStruct(1, "SA1")

  oModel := MPFormModel():New("BROWSESA1",/*bPre*/, /*bPos*/,/*bCommit*/,/*bCancel*/)
  oModel:AddFields("FORMSA1",/*cOwner*/,oStSA1)
  oModel:SetPrimaryKey({"A1_FILIAL","A1_CODIGO"})
  oModel:SetDescription("Cadastro de Clientes")
  oModel:GetModel("FORMSA1"):SetDescription("Formulário do Cadastro Cliente")

Return oModel

Static Function ViewDef()
  Local oModel := FWLoadModel("BROWSESA1")
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
```

## Diálogo simples para login

### Descrição

```code
gerar diálogo solicitando usuário e senha
```

### Código

```code
user function fncPergunte()
  Private cPerg1    := "QER051"

    RPCSetEnv("T1", "D MG 01","admin", "1234")

  Pergunte(cPerg1,.T.)
  conout("Pergunte executada")
return
```

## Cadastro simples

### Descrição

```code
cadastro simples de cliente SA1
```

### Código

```code
#INCLUDE "RPTDEF.CH"
user function relatorio()
  
  Local oPrint                  := Nil
  Local cFilePrint              := "NomeDoRelatorio"
  Local lAdjustToLegacy         :=.F.
  Local cLocal          := "C:/temp/"
  Local bPrintInServer      :=.F.
  Local lDisabeSetup            :=.T.
  Local lTReport              :=.F.
  Local nRow            := 15
  Local nCol            := 250

  oPrint := FWMSPrinter():New( cFilePrint, IMP_PDF, lAdjustToLegacy, cLocal, lDisabeSetup,lTReport,,, bPrintInServer,,,.f. )
  oPrint:SetResolution(72)
  oPrint:SetLandscape()
  oPrint:SetPaperSize(DMPAPER_A4)

  oPrint:lserver := bPrintInServer
  oPrint:linjob :=.T.
  oPrint:cPathPDF  := cLocal

  oPrint:StartPage()

  oPrint:Say( nRow, nCol, "Cabecalho")
  nRow += 10
  oPrint:Line ( nRow, 10, nRow, 560, nil, "-4" )

  nRow *= 10 
  nCol := 20
  oPrint:Say( nRow, nCol, "Conteúdo")

  nRow := 800
  oPrint:Line ( nRow, 10, nRow, 560, nil, "-4" )  
  nRow += 10
  nCol := 250
  oPrint:Say( nRow, nCol, "Rodapé")

  oPrint:EndPage()
  oPrint:Preview()

  FreeObj(oPrinter)
  oPrinter := Nil

Return(.T.)
```

## MBrowse (grid) para SA2 (produtos) com campos específicos

### Descrição

```code
//montar FWBrowse com caixa de seleção para a tabela SA2, com os campos
// A2_COD
// A2_NOME
```

### Código

```code
# include "protheus.ch"
# include "fwmvcdef.ch"
# include "totvs.ch"

user function BROWSESA2()
  Local oBrowse := Nil
  Local aCoors  := FWGetDialogSize(oMainWnd)
  Local aCoors2 := FWGetDialogSize(oMainWnd)
  Local aCoors3 := FWGetDialogSize(oMainWnd)
  Local aCoors4 := FWGetDialogSize(oMainWnd)
  Local aCoors5 := FWGetDialogSize(oMainWnd)
  Local aCoors6 := FWGetDialogSize(oMainWnd)
  Local aCoors7 := FWGetDialogSize(oMainWnd)
  Local aCoors8 := FWGetDialogSize(oMainWnd)
  Local aCoors9 := FWGetDialogSize(oMainWnd)
  Local aCoors10:= FWGetDialogSize(oMainWnd)
  Local aCoors11:= FWGetDialogSize(oMainWnd)
  Local aCoors12:= FWGetDialogSize(oMainWnd)
  Local aCoors13:= FWGetDialogSize(oMainWnd)
  Local aCoors14:= FWGetDialogSize(oMainWnd)
  Local aCoors15:= FWGetDialogSize(oMainWnd)
  Local aCoors16:= FWGetDialogSize(oMainWnd)
  Local aCoors17:= FWGetDialogSize(oMainWnd)
  Local aCoors18:= FWGetDialogSize(oMainWnd)
  Local aCoors19:= FWGetDialogSize(oMainWnd)
  Local aCoors20:= FWGetDialogSize(oMainWnd)
  Local aCoors21:= FWGetDialogSize(oMainWnd)
  Local aCoors22:= FWGetDialogSize(oMainWnd)
  Local aCoors23:= FWGetDialogSize(oMainWnd)
  Local aCoors24:= FWGetDialogSize(oMainWnd)
  Local aCoors25:= FWGetDialogSize(oMainWnd)
  Local aCoors26:= FWGetDialogSize(oMainWnd)
  Local aCoors27:= FWGetDialogSize(oMainWnd)
  Local aCoors28:= FWGetDialogSize(oMainWnd)
  Local aCoors29:= FWGetDialogSize(oMainWnd)
  Local aCoors30:= FWGetDialogSize(oMainWnd)
  Local aCoors31:= FWGetDialogSize(oMainWnd)
  Local aCoors32:= FWGetDialogSize(oMainWnd)
  Local aCoors33:= FWGetDialogSize(oMainWnd)
  Local aCoors34:= FWGetDialogSize(oMainWnd)
  Local aCoors35:= FWGetDialogSize(oMainWnd)
  Local aCoors36:= FWGetDialogSize(oMainWnd)
  Local aCoors37:= FWGetDialogSize(oMainWnd)
  Local aCoors38:= FWGetDialogSize(oMainWnd)
  Local aCoors39:= FWGetDialogSize(oMainWnd)
  Local aCoors40:= FWGetDialogSize(oMainWnd)
  Local aCoors41:= FWGetDialogSize(oMainWnd)
  Local aCoors42:= FWGetDialogSize(oMainWnd)
  Local aCoors43:= FWGetDialogSize(oMainWnd)
  Local aCoors44:= FWGetDialogSize(oMainWnd)
  Local aCoors45:= FWGetDialogSize(oMainWnd)
  Local aCoors46:= FWGetDialogSize(oMainWnd)
  Local aCoors47:= FWGetDialogSize(oMainWnd)
  Local aCoors48:= FWGetDialogSize(oMainWnd)
  Local aCoors49:= FWGetDialogSize(oMainWnd)
  Local aCoors50:= FWGetDialogSize(oMainWnd)
  Local aCoors51:= FWGetDialogSize(oMainWnd)
  Local aCoors52:= FWGetDialogSize(oMainWnd)
  Local aCoors53:= FWGetDialogSize(oMainWnd)
  Local aCoors54:= FWGetDialogSize(oMainWnd)
  Local aCoors55:= FWGetDialogSize(oMainWnd)
  Local aCoors56:= FWGetDialogSize(oMainWnd)
  Local aCoors57:= FWGetDialogSize(oMainWnd)
  Local aCoors58:= FWGetDialogSize(oMainWnd)
  Local aCoors59:= FWGetDialogSize(oMainWnd)
  Local aCoors60:= FWGetDialogSize(oMainWnd)
  Local aCoors61:= FWGetDialogSize(oMainWnd)
  Local aCoors62:= FWGetDialogSize(oMainWnd)
  Local aCoors63:= FWGetDialogSize(oMainWnd)
  Local aCoors64:= FWGetDialogSize(oMainWnd)
  Local aCoors65:= FWGetDialogSize(oMainWnd)
  Local aCoors66:= FWGetDialogSize(oMainWnd)
  Local aCoors67:= FWGetDialogSize(oMainWnd)
  Local aCoors68:= FWGetDialogSize(oMainWnd)
  Local aCoors69:= FWGetDialogSize(oMainWnd)
  Local aCoors70:= FWGetDialogSize(oMainWnd)
  Local aCoors71:= FWGetDialogSize(oMainWnd)
  Local aCoors72:= FWGetDialogSize(oMainWnd)
  Local aCoors73:= FWGetDialogSize(oMainWnd)
  Local aCoors74:= FWGetDialogSize(oMainWnd)
  Local aCoors75:= FWGetDialogSize(oMainWnd)
  Local aCoors76:= FWGetDialogSize(oMainWnd)
  Local aCoors77:= FWGetDialogSize(oMainWnd)
  Local aCoors78:= FWGetDialogSize(oMainWnd)
  Local aCoors79:= FWGetDialogSize(oMainWnd)
  Local aCoors80:= FWGetDialogSize(oMainWnd)
  Local aCoors81:= FWGetDialogSize(oMainWnd)
  Local aCoors82:= FWGetDialogSize(oMainWnd)
  Local aCoors83:= FWGetDialogSize(oMainWnd)
  Local aCoors84:= FWGetDialogSize(oMainWnd)
  Local aCoors85:= FWGetDialogSize(oMainWnd)
  Local aCoors86:= FWGetDialogSize(oMainWnd)
  Local aCoors87:= FWGetDialogSize(oMainWnd)
  Local aCoors88:= FWGetDialogSize(oMainWnd)
  Local aCoors89:= FWGetDialogSize(oMainWnd)
  Local aCoors90:= FWGetDialogSize(oMainWnd)
  Local aCoors91:= FWGetDialogSize(oMainWnd)
  Local aCoors92:= FWGetDialogSize(oMainWnd)
  Local aCoors93:= FWGetDialogSize(oMainWnd)
  Local aCoors94:= FWGetDialogSize(oMainWnd)
  Local aCoors95:= FWGetDialogSize(oMainWnd)
  Local aCoors96:= FWGetDialogSize(oMainWnd)
  Local aCoors97:= FWGetDialogSize(oMainWnd)
  Local aCoors98:= FWGetDialogSize(oMainWnd)
  Local aCoors99:= FWGetDialogSize(oMainWnd)
  Local aCoors100:= FWGetDialogSize(oMainWnd)
  Local aCoors101:= FWGetDialogSize(oMainWnd)
  Local aCoors102:= FWGetDialogSize(oMainWnd)
  Local aCoors103:= FWGetDialogSize(oMainWnd)
  Local aCoors104:= FWGetDialogSize(oMainWnd)
  Local aCoors105:= FWGetDialogSize(oMainWnd)
  Local aCoors106:= FWGetDialogSize(oMainWnd)
  Local aCoors107:= FWGetDialogSize(oMainWnd)
  Local aCoors108:= FWGetDialogSize(oMainWnd)
  Local aCoors1
```

## Processo

### Descrição

```code
Criar uma função que abra uma conexão com meu ambiente mssql, 
verifique se a tabela T1 existe e se existir, deve deletar ela. 
Em seguida deve criar uma tabela com alias GAIA e com os 
campos GCPOC do tipo caractere com 120 de tamanho, campo CCPON 
do tipo numérico com tamanho de 10 e 2 casas decimais... 
em seguida criar um looping para incluir 1001 registros 
nessa tabela... 
depois fechar a tabela e encerrar a conexão com o DBAccess
```

### Código

```code
user function fncConexao()
  Local cT1 := "T1"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_Srv := "127.0.0.1"
  Local cT1_Port := "1433"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local cT1_DB := "MSSQL/MSSQL7"
  Local c
```
