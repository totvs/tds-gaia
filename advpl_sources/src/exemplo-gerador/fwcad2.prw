#INCLUDE "PROTHEUS.CH"
#INCLUDE "FWBROWSE.CH"

user function fwCad02()

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	process()

return

static function process()

	Local oBrowse
	Local oColumn
	Local oDlg

//-------------------------------------------------------------------// Abertura da tabela//-------------------------------------------------------------------
	DbSelectArea("SA2")
	DbSetOrder(1)

//-------------------------------------------------------------------// Define a janela do Browse//-------------------------------------------------------
	DEFINE DIALOG oDlg FROM 0,0 TO 600,800 PIXEL

//------------------------------------------------------------------- // Define o Browse //----------------------------------------------------------------
	DEFINE FWBROWSE oBrowse DATA TABLE ALIAS "SA2" OF oDlg

//-------------------------------------------------------- // Cria uma coluna de marca/desmarca//----------------------------------------------
	ADD MARKCOLUMN oColumn DATA { || If(.T./* Função com a regra*/,'LBOK','LBNO') };
		DOUBLECLICK { |oBrowse| /* Função que atualiza a regra*/ };
		HEADERCLICK { |oBrowse| /* Função executada no clique do header */ } OF oBrowse

//------------------------------------------------------------------- // Adiciona as colunas do Browse //------------------------------------------
	ADD COLUMN oColumn DATA { || A2_COD } TITLE "Código" SIZE 6 OF oBrowse
	ADD COLUMN oColumn DATA { || A2_NOME } TITLE "Nome" SIZE 40 OF oBrowse

//------------------------------------------------------------------- // Ativação do Browse//----------------------------------------------------------------
	ACTIVATE FWBROWSE oBrowse

//-------------------------------------------------------------------// Ativação do janela//-------------------------------------------------------------------
	ACTIVATE DIALOG oDlg CENTERED

Return
