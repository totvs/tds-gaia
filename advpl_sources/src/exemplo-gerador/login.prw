#include "protheus.ch"

// gerar diálogo solicitando usuário e senha
user function dlglogin()
	local oDlg as object
	local oButton1 := null as object as object
	local oGet1 as object
	local oGet2 as object
	local oSay1 as object
	local oSay2 as object
	local cName := space(10) as character as character/tem que reservar "espaço"
	local cPassword := space(10) as character

	define msdialog oDlg title "Login" from 000, 000 to 300, 500 pixel //oDlg := MSDialog()....

	@ 038, 065 say oSay1 prompt "Nome" size 049, 007 of oDlg  pixel //oSay1 := TSay()....
	@ 048, 065 get oGet1 var cName size 060, 010 of oDlg pixel //oGet1 := TGet()....

	@ 075, 065 say oSay2 prompt "Senha" size 049, 007 of oDlg  pixel
	@ 085, 065 get oGet2 var cPassword size 060, 010 of oDlg pixel

	@ 105, 065 button oButton1 prompt "OK" of oDlg action {|| oDlg:end() } size 36,11 pixel // oButton1 := TButton()....

	activate msdialog oDlg centered

	//adicione o seu código
	if trim(cPassword) == "1234"
		msgalert(cName + ", senha correta", "ok")
	else
		msgalert(cName + ", senha incorreta. Tente 1234", "Erro")
	endif

return
