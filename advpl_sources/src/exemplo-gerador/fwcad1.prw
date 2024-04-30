#INCLUDE "PROTHEUS.CH"
#INCLUDE "FWBROWSE.CH"

user function fwCad01()

	RPCSetEnv("T1", "D MG 01",,,"FAT",,,,,,)

	process()

return

static function process()

	Local oBrowse
	Local oColumn
	Local oDlg

//-------------------------------------------------------------------// Abertura da tabela//-------------------------------------------------------------------
	DbSelectArea("SX2")
	DbSetOrder(1)

//-------------------------------------------------------------------// Define a janela do Browse//-------------------------------------------------------
	DEFINE DIALOG oDlg FROM 0,0 TO 600,800 PIXEL

//------------------------------------------------------------------- // Define o Browse //----------------------------------------------------------------
	DEFINE FWBROWSE oBrowse DATA TABLE ALIAS "SX2" OF oDlg

//------------------------------------------------------------------- // Adiciona as colunas do Browse //------------------------------------------
	ADD COLUMN oColumn DATA { || X2_CHAVE } TITLE "Chave" SIZE 3 OF oBrowse
	ADD COLUMN oColumn DATA { || X2_ARQUIVO } TITLE "Arquivo" SIZE 10 OF oBrowse
	ADD COLUMN oColumn DATA { || X2_NOME } TITLE DecodeUTF8("Descrição") SIZE 40 OF oBrowse
	ADD COLUMN oColumn DATA { || X2_MODO } TITLE "Modo" SIZE 1 OF oBrowse

//------------------------------------------------------------------- // Ativação do Browse//----------------------------------------------------------------
	ACTIVATE FWBROWSE oBrowse

//-------------------------------------------------------------------// Ativação do janela//-------------------------------------------------------------------
	ACTIVATE DIALOG oDlg CENTERED

Return
