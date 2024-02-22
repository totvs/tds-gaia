#include "protheus.ch"

user function dbgString()
	local int := 1234
	local flot := 123.45
	local bool := .t.

	local s010 := "ABCDEFGHI*"
	local s050 := replicate(s010, 5)
	local s100 := replicate(s010, 10)
	local s1000 := replicate(s100, 10)
	local s1000M := ""
	local s10000 := replicate(s010, 1000)
	local s100000 := replicate(s10000, 10)

	local a10 := geraArray(10, 2)
	local a100 := geraArray(100)
	local a1000 := geraArray(1000)
	local a10000 := geraArray(10000)

	local utf := encodeUtf8("αινσϊ")

	s1000M := substr(s1000, 1, 250) + "*** MANSANO ***" + substr(s1000, 251)

	S100 := s100 + "ALAN"
	conout(s010)

	conout(s100)
	conout(s1000)
	conout(s10000)
	conout(s100000)

	@ 10,01 say s010
	@ 11,01 say s050
	@ 12,01 say s100
	@ 13,01 say s1000
	@ 14,01 say s10000

	@ 10,010 say s010
	@ 11,010 say s050
	@ 12,010 say s100
	@ 13,010 say s1000
	@ 14,010 say s10000

	for i:=1 to 10
		@ 10,010+i*10 say s010
		@ 11,010+i*10 say s050
		@ 12,010+i*10 say s100
		@ 13,010+i*10 say s1000
		@ 14,010+i*10 say s10000
	next

return

static function geraArray(n, d)
	local result := {}

	local i

	if d > 1
		d--
		aadd(result, geraArray(n, @d ))
	else
		for i:=0 to n
			aadd(result, i)
		next
	endif

return result

