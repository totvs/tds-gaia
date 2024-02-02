#include "protheus.ch"

// comment line

/*
comment block
*/

user function test(arg1, arg2)
	local n

	for n := 1.3 to 5.4 step 0.1
		aAdd(aOpcoes, strZero(n,1,0))
	next

@ 10,122 say "Teste 1" size 100, 100 of meuDlg

@ 10,100 say "Teste 2" size 100, 100 of meuDlg

@ 10, 1 say "Teste 1" size 100, 100 of meuDlg
@ 10, 100 say "Teste 2" size 100, "Teste 2" of meuDlg

return
